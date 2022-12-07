import axios from 'axios'

interface InitRequestOptions {
  nomadDomain: string
  nomadACL: string
  cfClientId: string
  cfClientSecret: string
}

export const request = axios.create()

export function configRequest(options: InitRequestOptions): void {
  request.defaults.baseURL = `https://${options.nomadDomain}`
  request.defaults.headers['x-nomad-token'] = options.nomadACL
  request.defaults.headers['CF-Access-Client-Id'] = options.cfClientId
  request.defaults.headers['CF-Access-Client-Secret'] = options.cfClientSecret
}
