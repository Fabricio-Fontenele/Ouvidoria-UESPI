import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'
import { Manifestation, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('ListUserManifestationsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let sut: ListUserManifestationsUseCase

  const buildManifestation = (id: string, authorUserId: string): Manifestation =>
    Manifestation.open(
      {
        protocol: Protocol.create(`2026-${id}`),
        type: ManifestationType.COMPLAINT,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create(`Description for ${id}`),
        authorUserId: new UniqueEntityId(authorUserId),
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId(id),
    )

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()

    mockReset(manifestationsRepository)

    sut = new ListUserManifestationsUseCase(manifestationsRepository)
  })

  it('lists manifestations by author user id using the requested page', async () => {
    const manifestations = [
      buildManifestation('manifestation-1', 'user-1'),
      buildManifestation('manifestation-2', 'user-1'),
    ]

    manifestationsRepository.findManyByAuthorUserId.mockResolvedValue(manifestations)

    const result = await sut.execute({
      authorUserId: 'user-1',
      page: 2,
    })

    expect(manifestationsRepository.findManyByAuthorUserId.mock.calls).toStrictEqual([['user-1', { page: 2 }]])
    expect(result).toStrictEqual({ manifestations })
  })

  it('rejects invalid page numbers before touching the repository', async () => {
    await expect(
      sut.execute({
        authorUserId: 'user-1',
        page: 0,
      }),
    ).rejects.toBeInstanceOf(InvalidPageNumberError)

    expect(manifestationsRepository.findManyByAuthorUserId.mock.calls).toHaveLength(0)
  })

  it('propagates repository failures', async () => {
    const repositoryError = new Error('repository failed')

    manifestationsRepository.findManyByAuthorUserId.mockRejectedValue(repositoryError)

    await expect(
      sut.execute({
        authorUserId: 'user-1',
        page: 1,
      }),
    ).rejects.toThrow(repositoryError)

    expect(manifestationsRepository.findManyByAuthorUserId.mock.calls).toStrictEqual([['user-1', { page: 1 }]])
  })
})
