import process from 'node:process'

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type * as EnvModule from '../src/config/env.js'
import type * as MainModule from '../src/main.js'

const originalEnv = { ...process.env }

const restoreEnv = (): void => {
  process.env = { ...originalEnv }
}

const clearAppEnv = (): void => {
  delete process.env['NODE_ENV']
  delete process.env['APP_NAME']
  delete process.env['APP_PORT']
}

const loadEnvModule = async (): Promise<typeof EnvModule> => {
  vi.resetModules()

  return import('../src/config/env.js')
}

const loadMainModule = async (): Promise<typeof MainModule> => {
  vi.resetModules()

  return import('../src/main.js')
}

const mutableEnv = (): Record<string, string | undefined> => process.env as Record<string, string | undefined>

describe('environment configuration', () => {
  beforeEach(() => {
    restoreEnv()
    clearAppEnv()
  })

  afterEach(() => {
    restoreEnv()
    vi.restoreAllMocks()
  })

  it('uses safe defaults when environment variables are missing', async () => {
    const { env } = await loadEnvModule()

    expect(env).toStrictEqual({
      nodeEnv: 'development',
      appName: 'ts-project',
      appPort: 3030,
    })
  })

  it('parses valid environment variables', async () => {
    process.env['NODE_ENV'] = 'production'
    process.env['APP_NAME'] = 'professional-template'
    process.env['APP_PORT'] = '8080'

    const { env } = await loadEnvModule()

    expect(env).toStrictEqual({
      nodeEnv: 'production',
      appName: 'professional-template',
      appPort: 8080,
    })
  })

  it('throws for an invalid NODE_ENV', async () => {
    mutableEnv()['NODE_ENV'] = 'prod'

    await expect(loadEnvModule()).rejects.toThrow('Invalid NODE_ENV: prod')
  })

  it('throws for an invalid APP_PORT', async () => {
    process.env['NODE_ENV'] = 'test'
    process.env['APP_PORT'] = '0'

    await expect(loadEnvModule()).rejects.toThrow('Invalid APP_PORT')
  })
})

describe('bootstrap', () => {
  beforeEach(() => {
    restoreEnv()
    process.env['NODE_ENV'] = 'test'
    process.env['APP_NAME'] = 'ts-project'
    process.env['APP_PORT'] = '3030'
  })

  afterEach(() => {
    restoreEnv()
    vi.restoreAllMocks()
  })

  it('logs the startup banner', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined)
    const { bootstrap } = await loadMainModule()

    bootstrap()

    expect(logSpy).toHaveBeenNthCalledWith(1, '[ts-project] starting application')
    expect(logSpy).toHaveBeenNthCalledWith(2, 'Environment: test')
    expect(logSpy).toHaveBeenNthCalledWith(3, 'Port: 3030')
  })
})
