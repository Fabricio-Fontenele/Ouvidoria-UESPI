declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV?: 'development' | 'test' | 'production'
    APP_NAME?: string
    APP_PORT?: `${number}`
  }
}
