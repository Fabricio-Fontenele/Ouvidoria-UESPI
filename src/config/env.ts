import 'dotenv/config'

export type NodeEnv = 'development' | 'test' | 'production'

export interface Env {
  nodeEnv: NodeEnv
  appName: string
  appPort: number
}

const parseNodeEnv = (value: string | undefined): NodeEnv => {
  if (value === 'development' || value === 'test' || value === 'production') {
    return value
  }

  throw new Error(`Invalid NODE_ENV: ${String(value)}`)
}

const parsePort = (value: string | undefined): number => {
  const port = Number(value)

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error('Invalid APP_PORT')
  }

  return port
}

export const env: Env = {
  nodeEnv: parseNodeEnv(process.env['NODE_ENV'] ?? 'development'),
  appName: process.env['APP_NAME'] ?? 'ts-project',
  appPort: parsePort(process.env['APP_PORT'] ?? '3030'),
}
