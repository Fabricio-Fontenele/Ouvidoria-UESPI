import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'

describe('Catalog (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('returns only active campuses with at least one active administrative unit', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'GET',
      url: '/catalog',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({
      campuses: [
        {
          id: 'campus-poeta-torquato-neto',
          label: 'Campus Poeta Torquato Neto',
          city: 'Teresina',
          administrativeUnits: [
            { id: 'unit-prad-teresina', label: 'Pró-Reitoria de Administração' },
            { id: 'unit-preg-teresina', label: 'Pró-Reitoria de Ensino de Graduação' },
          ],
        },
        {
          id: 'campus-professor-alexandre-alves-de-oliveira',
          label: 'Campus Professor Alexandre Alves de Oliveira',
          city: 'Parnaíba',
          administrativeUnits: [
            {
              id: 'unit-biblioteca-parnaiba',
              label: 'Biblioteca Setorial do Campus Professor Alexandre Alves de Oliveira',
            },
            {
              id: 'unit-coordenacao-computacao-parnaiba',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
            {
              id: 'unit-direcao-parnaiba',
              label: 'Direção do Campus Professor Alexandre Alves de Oliveira',
            },
          ],
        },
        {
          id: 'campus-professor-antonio-giovanni-alves-de-sousa',
          label: 'Campus Professor Antônio Giovanni Alves de Sousa',
          city: 'Piripiri',
          administrativeUnits: [
            {
              id: 'unit-coordenacao-computacao-piripiri',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
            {
              id: 'unit-direcao-piripiri',
              label: 'Direção do Campus Professor Antônio Giovanni Alves de Sousa',
            },
            {
              id: 'unit-secretaria-academica-piripiri',
              label: 'Secretaria Acadêmica do Campus Professor Antônio Giovanni Alves de Sousa',
            },
          ],
        },
      ],
    })
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
        administrativeUnitId: 'unit-coordenacao-computacao-parnaiba',
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
        administrativeUnitId: 'unit-prad-teresina',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: 'CampusNotFoundError',
      message: 'Campus not found',
    })
  })

  it('rejects manifestations for inactive campuses', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-doutora-josefina-demes',
        administrativeUnitId: 'unit-protocolo-floriano',
        description: 'Há ruído excessivo no setor administrativo.',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toStrictEqual({
      error: 'CampusInactiveError',
      message: 'Campus is inactive',
    })
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

    const response = await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-professor-alexandre-alves-de-oliveira',
        administrativeUnitId: 'unit-nti-parnaiba-inativo',
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
        administrativeUnitId: 'unit-biblioteca-parnaiba',
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

    await app.inject({
      method: 'POST',
      url: '/manifestations',
      payload: {
        isAnonymous: true,
        type: 'complaint',
        campusId: 'campus-professor-antonio-giovanni-alves-de-sousa',
        administrativeUnitId: 'unit-direcao-piripiri',
        description: 'Manifestação transitória para validar o reset.',
      },
    })

    await resetDatabase()

    const catalogResponse = await app.inject({
      method: 'GET',
      url: '/catalog',
    })

    expect(catalogResponse.statusCode).toBe(200)
    expect(catalogResponse.json()).toStrictEqual({
      campuses: [
        {
          id: 'campus-poeta-torquato-neto',
          label: 'Campus Poeta Torquato Neto',
          city: 'Teresina',
          administrativeUnits: [
            { id: 'unit-prad-teresina', label: 'Pró-Reitoria de Administração' },
            { id: 'unit-preg-teresina', label: 'Pró-Reitoria de Ensino de Graduação' },
          ],
        },
        {
          id: 'campus-professor-alexandre-alves-de-oliveira',
          label: 'Campus Professor Alexandre Alves de Oliveira',
          city: 'Parnaíba',
          administrativeUnits: [
            {
              id: 'unit-biblioteca-parnaiba',
              label: 'Biblioteca Setorial do Campus Professor Alexandre Alves de Oliveira',
            },
            {
              id: 'unit-coordenacao-computacao-parnaiba',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
            {
              id: 'unit-direcao-parnaiba',
              label: 'Direção do Campus Professor Alexandre Alves de Oliveira',
            },
          ],
        },
        {
          id: 'campus-professor-antonio-giovanni-alves-de-sousa',
          label: 'Campus Professor Antônio Giovanni Alves de Sousa',
          city: 'Piripiri',
          administrativeUnits: [
            {
              id: 'unit-coordenacao-computacao-piripiri',
              label: 'Coordenação do Curso de Ciência da Computação',
            },
            {
              id: 'unit-direcao-piripiri',
              label: 'Direção do Campus Professor Antônio Giovanni Alves de Sousa',
            },
            {
              id: 'unit-secretaria-academica-piripiri',
              label: 'Secretaria Acadêmica do Campus Professor Antônio Giovanni Alves de Sousa',
            },
          ],
        },
      ],
    })
  })
})
