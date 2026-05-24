import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { prisma } from '#src/infra/database/prisma/client.js'

import { getApp, resetDatabase } from './utils/app.js'

interface PublicCatalog {
  campuses: Array<{
    id: string
    label: string
    city: string | null
    administrativeUnits: Array<{ id: string; label: string; description: string | null }>
  }>
}

describe('Catalog (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('returns active campuses, each carrying active units with id, label and description', async () => {
    const app = await getApp()

    const response = await app.inject({ method: 'GET', url: '/catalog' })

    expect(response.statusCode).toBe(200)
    const catalog = response.json<PublicCatalog>()

    expect(catalog.campuses.length).toBeGreaterThan(0)
    for (const campus of catalog.campuses) {
      expect(typeof campus.id).toBe('string')
      expect(typeof campus.label).toBe('string')
      expect(campus.administrativeUnits.length).toBeGreaterThan(0)
      for (const unit of campus.administrativeUnits) {
        expect(Object.keys(unit).sort()).toStrictEqual(['id', 'label', 'description'].sort())
      }
    }

    const headquarters = catalog.campuses.find((campus) => campus.id === 'campus-poeta-torquato-neto')
    expect(headquarters?.label).toBe('Campus Poeta Torquato Neto')
    const headquartersUnitIds = headquarters?.administrativeUnits.map((unit) => unit.id) ?? []
    expect(headquartersUnitIds).toStrictEqual(expect.arrayContaining(['unit-prad', 'unit-preg']))
  })

  it('accepts seeded valid catalog ids when registering a manifestation', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-coordenacoes-curso-professor-alexandre-alves-de-oliveira',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(201)
  })

  it('rejects manifestations for non-existent campuses', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-inexistente',
        administrativeUnitId: 'unit-prad',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: 'CampusNotFoundError', message: 'Campus not found' })
  })

  it('rejects manifestations for inactive campuses', async () => {
    const app = await getApp()

    await prisma.campus.upsert({
      where: { id: 'e2e-inactive-campus' },
      update: { isActive: false },
      create: { id: 'e2e-inactive-campus', name: 'Campus Inativo E2E', city: 'Teste', isActive: false },
    })
    await prisma.administrativeUnit.upsert({
      where: { id: 'e2e-inactive-campus-unit' },
      update: {},
      create: {
        id: 'e2e-inactive-campus-unit',
        name: 'Unidade do campus inativo',
        campusId: 'e2e-inactive-campus',
        isActive: true,
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'e2e-inactive-campus',
        administrativeUnitId: 'e2e-inactive-campus-unit',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({ error: 'CampusInactiveError', message: 'Campus is inactive' })
  })

  it('rejects manifestations for non-existent administrative units', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-inexistente',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: 'AdministrativeUnitNotFoundError',
      message: 'Administrative unit not found',
    })
  })

  it('rejects manifestations for inactive administrative units', async () => {
    const app = await getApp()

    await prisma.administrativeUnit.upsert({
      where: { id: 'e2e-inactive-unit' },
      update: { isActive: false },
      create: {
        id: 'e2e-inactive-unit',
        name: 'Unidade Inativa E2E',
        campusId: 'campus-poeta-torquato-neto',
        isActive: false,
      },
    })

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'e2e-inactive-unit',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: 'AdministrativeUnitInactiveError',
      message: 'Administrative unit is inactive',
    })
  })

  it('rejects manifestations when the administrative unit does not belong to the selected campus', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-biblioteca-professor-alexandre-alves-de-oliveira',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: 'AdministrativeUnitDoesNotBelongToCampusError',
      message: 'Administrative unit does not belong to the selected campus',
    })
  })

  it('keeps the seeded catalog available after resetDatabase', async () => {
    const app = await getApp()

    const before = (await app.inject({ method: 'GET', url: '/catalog' })).json<PublicCatalog>()
    expect(before.campuses.length).toBeGreaterThan(0)

    await resetDatabase()

    const afterReset = await app.inject({ method: 'GET', url: '/catalog' })
    expect(afterReset.statusCode).toBe(200)
    expect(afterReset.json<PublicCatalog>()).toStrictEqual(before)
  })
})
