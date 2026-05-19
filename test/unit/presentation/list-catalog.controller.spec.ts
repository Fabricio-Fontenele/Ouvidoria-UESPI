import { describe, expect, it } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'

import type { ListCatalogUseCase } from '#src/application/use-cases/list-catalog/list-catalog-use-case.js'
import { ListCatalogController } from '#src/presentation/controllers/catalog/list-catalog.controller.js'
import type { HttpRequest } from '#src/presentation/protocols/http.js'

describe('ListCatalogController', () => {
  it('returns 200 with the public catalog', async () => {
    const useCase = mockDeep<ListCatalogUseCase>()
    const sut = new ListCatalogController(useCase)
    const request: HttpRequest = {
      body: undefined,
      params: {},
      query: {},
      headers: {},
    }

    useCase.execute.mockResolvedValue({
      campuses: [
        {
          id: 'campus-professor-alexandre-alves-de-oliveira',
          label: 'Campus Professor Alexandre Alves de Oliveira',
          city: 'Parnaíba',
          administrativeUnits: [
            {
              id: 'unit-coordenacao-computacao-parnaiba',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
          ],
        },
      ],
    })

    const response = await sut.handle(request)

    expect(response.statusCode).toBe(200)
    expect(response.body).toStrictEqual({
      campuses: [
        {
          id: 'campus-professor-alexandre-alves-de-oliveira',
          label: 'Campus Professor Alexandre Alves de Oliveira',
          city: 'Parnaíba',
          administrativeUnits: [
            {
              id: 'unit-coordenacao-computacao-parnaiba',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
          ],
        },
      ],
    })
  })
})
