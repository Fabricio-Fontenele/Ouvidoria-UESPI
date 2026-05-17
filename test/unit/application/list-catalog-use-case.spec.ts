import { describe, expect, it } from 'vitest'
import { mockDeep } from 'vitest-mock-extended'

import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import { ListCatalogUseCase } from '#src/application/use-cases/list-catalog/list-catalog-use-case.js'

describe('ListCatalogUseCase', () => {
  it('returns the public catalog with only active campuses and administrative units', async () => {
    const catalogRepository = mockDeep<CatalogRepository>()
    const sut = new ListCatalogUseCase(catalogRepository)

    catalogRepository.listPublic.mockResolvedValue({
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

    await expect(sut.execute(undefined)).resolves.toStrictEqual({
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

    expect(catalogRepository.listPublic).toHaveBeenCalledTimes(1)
  })

  it('does not return active campuses without active administrative units', async () => {
    const catalogRepository = mockDeep<CatalogRepository>()
    const sut = new ListCatalogUseCase(catalogRepository)

    catalogRepository.listPublic.mockResolvedValue({ campuses: [] })

    await expect(sut.execute(undefined)).resolves.toStrictEqual({ campuses: [] })
  })
})
