/* eslint-disable no-console */
import { fileURLToPath } from 'node:url'

import { env } from './config/env.js'

export const bootstrap = (): void => {
  console.log(`[${env.appName}] starting application`)
  console.log(`Environment: ${env.nodeEnv}`)
  console.log(`Port: ${String(env.appPort)}`)
}

const isEntrypoint = (): boolean => {
  const entrypoint = process.argv[1]

  if (entrypoint === undefined) {
    return false
  }

  return fileURLToPath(import.meta.url) === entrypoint
}

if (isEntrypoint()) {
  bootstrap()
}
