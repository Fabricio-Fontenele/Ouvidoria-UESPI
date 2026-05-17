import { describe, expect, it } from 'vitest'

import {
  getPrismaPgConnectionConfig,
  withDatabaseSchema,
  withDatabaseSchemaSearchPath,
} from '#src/infra/database/prisma/database-url.js'

describe('database-url', () => {
  it('sets the schema query parameter on the database url', () => {
    const databaseUrl = withDatabaseSchema('postgresql://postgres:postgres@localhost:5432/ouvidoria', 'e2e_schema')

    expect(new URL(databaseUrl).searchParams.get('schema')).toBe('e2e_schema')
  })

  it('extracts the schema for the PrismaPg adapter', () => {
    const config = getPrismaPgConnectionConfig(
      'postgresql://postgres:postgres@localhost:5432/ouvidoria?schema=e2e_schema',
    )

    expect(config).toStrictEqual({
      connectionString: 'postgresql://postgres:postgres@localhost:5432/ouvidoria?schema=e2e_schema',
      schema: 'e2e_schema',
    })
  })

  it('adds search_path using the schema from the database url', () => {
    const config = withDatabaseSchemaSearchPath(
      'postgresql://postgres:postgres@localhost:5432/ouvidoria?schema=e2e_schema',
    )

    const options = new URL(config.connectionString).searchParams.get('options')

    expect(config.schema).toBe('e2e_schema')
    expect(options).toBe('-csearch_path=e2e_schema')
  })

  it('preserves existing options and appends search_path once', () => {
    const config = withDatabaseSchemaSearchPath(
      'postgresql://postgres:postgres@localhost:5432/ouvidoria?schema=e2e_schema&options=--statement_timeout%3D5000',
    )

    const options = new URL(config.connectionString).searchParams.get('options')

    expect(options).toBe('--statement_timeout=5000 -csearch_path=e2e_schema')
    expect(withDatabaseSchemaSearchPath(config.connectionString).connectionString).toBe(config.connectionString)
  })
})
