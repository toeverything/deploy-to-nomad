import * as core from '@actions/core'
import {createOrRunJob} from './nomad'
import {configRequest} from './request'

async function run(): Promise<void> {
  try {
    const jobId: string = core.getInput('job-id')
    const imageUrl: string = core.getInput('image-url')
    const staticPort: string = core.getInput('static-port')
    const containerPort: string = core.getInput('container-port')
    const nomadDomain: string = core.getInput('nomad-domain')
    const nomadACL = process.env['nomad-acl']
    const cfClientId = process.env['cf-access-client-id']
    const cfClientSecret = process.env['cf-access-client-secret']

    if (!nomadACL || !cfClientId || !cfClientSecret) {
      throw new Error(
        `${[nomadACL, cfClientId, cfClientSecret]
          .filter(a => !!a)
          .join(',')} is/are not exist.`
      )
    }

    configRequest({
      nomadDomain,
      nomadACL,
      cfClientId,
      cfClientSecret
    })

    const ret = await createOrRunJob({
      id: jobId,
      staticPort,
      containerPort,
      image: imageUrl
    })
    // eslint-disable-next-line no-console
    console.log('run job', ret)

    core.setOutput('job-id', jobId)
    core.setOutput('static-port', staticPort)
    core.setOutput('image-url', imageUrl)
    core.setOutput('container-port', containerPort)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
