import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { ManifestationListItemDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { InvalidPageNumberError } from '#src/application/use-cases/list-user-manifestations/errors/invalid-page-number-error.js'
import { ListUserManifestationsUseCase } from '#src/application/use-cases/list-user-manifestations/list-user-manifestations-use-case.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'

describe('ListUserManifestationsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let sut: ListUserManifestationsUseCase

  const buildManifestation = (id: string, authorUserId: string): ManifestationListItemDTO => ({
    id,
    protocol: `2026-${id}`,
    type: ManifestationType.COMPLAINT,
    status: ManifestationStatus.IN_ANALYSIS,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: `Description for ${id}`,
    authorUserId,
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
  })

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()

    mockReset(manifestationsRepository)

    sut = new ListUserManifestationsUseCase(manifestationsRepository)
  })

  it('lists manifestations by user id using the requested page', async () => {
    const manifestations = [
      buildManifestation('manifestation-1', 'user-1'),
      buildManifestation('manifestation-2', 'user-1'),
    ]

    manifestationsRepository.findManyByAuthorUserId.mockResolvedValue(manifestations)

    const result = await sut.execute({
      userId: 'user-1',
      page: 2,
    })

    expect(manifestationsRepository.findManyByAuthorUserId.mock.calls).toStrictEqual([['user-1', { page: 2 }]])
    expect(result).toStrictEqual({ manifestations })
  })

  it('rejects invalid page numbers before touching the repository', async () => {
    await expect(
      sut.execute({
        userId: 'user-1',
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
        userId: 'user-1',
        page: 1,
      }),
    ).rejects.toThrow(repositoryError)

    expect(manifestationsRepository.findManyByAuthorUserId.mock.calls).toStrictEqual([['user-1', { page: 1 }]])
  })
})
