export type PrismaPgConnectionConfig = {
  connectionString: string
  schema: string
}

const defaultSchema = 'public'

export function withDatabaseSchema(databaseUrl: string, schema: string): string {
  const url = new URL(databaseUrl)

  url.searchParams.set('schema', schema)

  return url.toString()
}

export function getPrismaPgConnectionConfig(databaseUrl: string): PrismaPgConnectionConfig {
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema') ?? defaultSchema

  return {
    connectionString: url.toString(),
    schema,
  }
}

export function withDatabaseSchemaSearchPath(databaseUrl: string): PrismaPgConnectionConfig {
  const url = new URL(databaseUrl)
  const schema = url.searchParams.get('schema') ?? defaultSchema
  const options = url.searchParams.get('options')
  const searchPathOption = `-csearch_path=${schema}`

  if (options === null || options === '') {
    url.searchParams.set('options', searchPathOption)
  } else if (!options.includes('search_path=')) {
    url.searchParams.set('options', `${options} ${searchPathOption}`)
  }

  return {
    connectionString: url.toString(),
    schema,
  }
}
