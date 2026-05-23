import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { PublicCatalogDTO } from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'
import { CachedCatalogRepository } from '#src/infra/database/cached-catalog-repository.js'

describe('CachedCatalogRepository', () => {
  let inner: DeepMockProxy<CatalogRepository>

  const catalog: PublicCatalogDTO = {
    campuses: [
      {
        id: 'c1',
        label: 'Campus 1',
        city: 'X',
        administrativeUnits: [{ id: 'u1', label: 'Unit 1', description: null }],
      },
    ],
  }

  beforeEach(() => {
    inner = mockDeep<CatalogRepository>()
    mockReset(inner)
    inner.listPublic.mockResolvedValue(catalog)
  })

  it('serves listPublic from cache on subsequent calls within ttl', async () => {
    const clock = { now: vi.fn().mockReturnValue(1_000) }
    const sut = new CachedCatalogRepository(inner, 60_000, clock)

    const first = await sut.listPublic()
    clock.now.mockReturnValue(1_000 + 30_000)
    const second = await sut.listPublic()

    expect(first).toBe(second)
    expect(inner.listPublic).toHaveBeenCalledTimes(1)
  })

  it('refetches when the ttl expires', async () => {
    const clock = { now: vi.fn().mockReturnValue(1_000) }
    const sut = new CachedCatalogRepository(inner, 60_000, clock)

    await sut.listPublic()
    clock.now.mockReturnValue(1_000 + 60_001)
    await sut.listPublic()

    expect(inner.listPublic).toHaveBeenCalledTimes(2)
  })

  it('invalidate forces a refetch on next call', async () => {
    const clock = { now: vi.fn().mockReturnValue(1_000) }
    const sut = new CachedCatalogRepository(inner, 60_000, clock)

    await sut.listPublic()
    sut.invalidate()
    await sut.listPublic()

    expect(inner.listPublic).toHaveBeenCalledTimes(2)
  })

  it('does not cache findCampusById nor findAdministrativeUnitById', async () => {
    const sut = new CachedCatalogRepository(inner, 60_000)

    await sut.findCampusById('c1')
    await sut.findCampusById('c1')
    await sut.findAdministrativeUnitById('u1')

    expect(inner.findCampusById).toHaveBeenCalledTimes(2)
    expect(inner.findAdministrativeUnitById).toHaveBeenCalledTimes(1)
  })
})
