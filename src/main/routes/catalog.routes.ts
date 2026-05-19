import type { FastifyInstance } from 'fastify'

import { adaptRoute } from '#src/infra/http/fastify/fastify-route-adapter.js'

import { makeListCatalogController } from '../factories/controllers/catalog.js'

export async function registerCatalogRoutes(app: FastifyInstance): Promise<void> {
  app.get('/catalog', adaptRoute(makeListCatalogController()))
}
