import {request} from './request'

async function listJobs(): Promise<string[]> {
  const jobs = await request<{ID: string}[]>({
    url: '/v1/jobs',
    method: 'GET'
  })

  return jobs.data.map(job => job.ID)
}

interface JobInfoResponse {
  ID: string
  Name: string
  TaskGroups: {
    Networks: {
      ReservedPorts: {
        Value: string
      }[]
    }[]
  }[]
}
interface JobInfo {
  id: string
  name: string
  ports: string[]
}
async function getJobInfo(jobId: string): Promise<JobInfo> {
  const jobInfo = (
    await request<JobInfoResponse>({
      url: `/v1/job/${jobId}`,
      method: 'GET'
    })
  ).data

  const ports = jobInfo.TaskGroups.reduce((acc, group) => {
    for (const network of group.Networks) {
      for (const reservedPort of network.ReservedPorts) {
        acc.push(reservedPort.Value)
      }
    }
    return acc
  }, [] as string[]).filter(port => !!port)

  return {
    id: jobInfo.ID,
    name: jobInfo.Name,
    ports
  }
}

async function getAllJobs(): Promise<JobInfo[]> {
  const jobIds = await listJobs()
  const jobsInfo = await Promise.all(
    jobIds.map(async jobId => getJobInfo(jobId))
  )
  return jobsInfo
}

interface CreateJobHCLOptions {
  id: string
  staticPort: string
  containerPort: string
  image: string
}

function createJobHCL(options: CreateJobHCLOptions): string {
  return `
job "${options.id}" {
  region      = "global"
  datacenters = ["scholar"]

  type = "service"

  update {
    stagger      = "30s"
    max_parallel = 2
  }

  # Defines a series of tasks that should be co-located on the same Nomad client.
  group "${options.id}" {
    count = 1

    network {
      port "${options.id}" {
        # Specifies the static TCP/UDP port to allocate.
        static       = ${options.staticPort}
        to           = ${options.containerPort}
        host_network = "tailscale"
      }
    }

    service {
      check {
        name     = "${options.id} Check"
        port     = "${options.id}"
        type     = "http"
        path     = "/"
        interval = "10s"
        timeout  = "2s"
      }
    }

    task "${options.id}" {
      driver = "docker"

      config {
        image       = "${options.image}"
        force_pull  = true
        ports       = ["${options.id}"]
        labels      = {
          "io.portainer.accesscontrol.teams" = "development"
        }
      }
      resources {
        cpu    = 100 # MHz
        memory = 64  # MB
      }
    }
  }
}
`
}

type JobJSON = Record<string, unknown>

async function parseHCLtoJobJSON(
  options: CreateJobHCLOptions
): Promise<JobJSON> {
  const hcl = createJobHCL(options)
  const jobJSON = (
    await request({
      url: '/v1/jobs/parse?namespace=*',
      method: 'POST',
      data: {
        Canonicalize: true,
        JobHCL: hcl
      }
    })
  ).data
  return jobJSON
}

async function runJob(jobJSON: JobJSON): Promise<unknown> {
  const ran = (
    await request({
      url: `/v1/jobs`,
      method: 'POST',
      data: {
        Job: jobJSON
      }
    })
  ).data

  return ran
}

export async function createOrRunJob(
  options: CreateJobHCLOptions
): Promise<unknown> {
  const jobsInfo = await getAllJobs()
  const found = jobsInfo.find(jobInfo => {
    if (
      jobInfo.id === options.id &&
      !jobInfo.ports.includes(options.staticPort)
    ) {
      return true
    }
    if (
      jobInfo.id !== options.id &&
      jobInfo.ports.includes(options.staticPort)
    ) {
      return true
    }
  })
  if (found) {
    throw new Error(`
Job conflict:
  exist: ${found.id}|${found.name}|${found.ports.join(',')}
  this job: ${options.id}|${options.staticPort}
`)
  }
  const jobJSON = await parseHCLtoJobJSON(options)
  const ret = await runJob(jobJSON)
  return ret
}
