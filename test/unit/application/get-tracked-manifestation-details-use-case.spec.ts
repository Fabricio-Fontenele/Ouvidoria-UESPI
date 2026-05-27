import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { HashComparer } from '#src/application/cryptography/hash-comparer.js'
import type { ManifestationDetailsDTO } from '#src/application/dto/manifestation-query-dtos.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { ManifestationTrackingNotFoundError } from '#src/application/use-cases/anonymous-manifestation-access/errors/manifestation-tracking-not-found-error.js'
import { GetTrackedManifestationDetailsUseCase } from '#src/application/use-cases/manifestation-attachments/get-tracked-manifestation-details-use-case.js'
import { ManifestationMessageSenderType } from '#src/domain/entities/manifestation-message.js'
import { Manifestation, ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

describe('GetTrackedManifestationDetailsUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let hashComparer: DeepMockProxy<HashComparer>
  let sut: GetTrackedManifestationDetailsUseCase

  const buildAnonymousManifestation = (): Manifestation =>
    Manifestation.restore(
      {
        protocol: Protocol.create('OUV-2026-K7F9Q2'),
        type: ManifestationType.COMPLAINT,
        status: ManifestationStatus.IN_ANALYSIS,
        campusId: CampusId.create('campus-1'),
        administrativeUnitId: AdministrativeUnitId.create('unit-1'),
        description: ManifestationDescription.create('The service was unavailable during the whole morning.'),
        involvedPeople: null,
        authorUserId: null,
        attendantUserId: null,
        accessCodeHash: 'hashed-access-code',
        createdAt: new Date('2026-05-10T12:00:00.000Z'),
      },
      new UniqueEntityId('manifestation-1'),
    )

  const details: ManifestationDetailsDTO = {
    id: 'manifestation-1',
    protocol: 'OUV-2026-K7F9Q2',
    type: ManifestationType.COMPLAINT,
    status: ManifestationStatus.IN_ANALYSIS,
    campusId: 'campus-1',
    administrativeUnitId: 'unit-1',
    description: 'The service was unavailable during the whole morning.',
    involvedPeople: null,
    authorUserId: null,
    author: null,
    attendantUserId: null,
    forwardedToUnit: null,
    createdAt: new Date('2026-05-10T12:00:00.000Z'),
    history: [],
    messages: [
      {
        id: 'message-1',
        senderUserId: null,
        senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
        content: 'Tenho uma dúvida sobre o andamento.',
        createdAt: new Date('2026-05-10T12:45:00.000Z'),
      },
      {
        id: 'message-2',
        senderUserId: 'ombudsman-1',
        senderType: ManifestationMessageSenderType.OMBUDSMAN,
        content: 'Recebemos sua manifestação e estamos analisando.',
        createdAt: new Date('2026-05-10T13:30:00.000Z'),
      },
    ],
    attachments: [
      {
        id: 'attachment-1',
        originalName: 'evidence.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 1234,
        uploadedByType: 'anonymous_manifestant',
        createdAt: new Date('2026-05-10T12:30:00.000Z'),
      },
      {
        id: 'attachment-2',
        originalName: 'internal.pdf',
        mimeType: 'application/pdf',
        sizeInBytes: 4321,
        uploadedByType: 'ombudsman',
        createdAt: new Date('2026-05-10T13:00:00.000Z'),
      },
    ],
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    hashComparer = mockDeep<HashComparer>()

    mockReset(manifestationsRepository)
    mockReset(hashComparer)

    sut = new GetTrackedManifestationDetailsUseCase(manifestationsRepository, hashComparer)
  })

  it('returns only the public tracking projection plus attachments and messages', async () => {
    const publicAttachment = details.attachments[0]

    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    manifestationsRepository.findDetailsById.mockResolvedValue(details)
    hashComparer.compare.mockResolvedValue(true)

    const result = await sut.execute({
      protocol: 'OUV-2026-K7F9Q2',
      accessCode: 'plain-access-code',
    })

    expect(result).toStrictEqual({
      manifestation: {
        protocol: details.protocol,
        type: details.type,
        status: details.status,
        campusId: details.campusId,
        administrativeUnitId: details.administrativeUnitId,
        description: details.description,
        forwardedToUnit: details.forwardedToUnit,
        createdAt: details.createdAt,
        // Internal sender user ids are dropped — only senderType is exposed to anonymous trackers.
        messages: [
          {
            id: 'message-1',
            senderType: ManifestationMessageSenderType.ANONYMOUS_MANIFESTANT,
            content: 'Tenho uma dúvida sobre o andamento.',
            createdAt: new Date('2026-05-10T12:45:00.000Z'),
          },
          {
            id: 'message-2',
            senderType: ManifestationMessageSenderType.OMBUDSMAN,
            content: 'Recebemos sua manifestação e estamos analisando.',
            createdAt: new Date('2026-05-10T13:30:00.000Z'),
          },
        ],
        attachments: publicAttachment === undefined ? [] : [publicAttachment],
      },
    })
    expect(Object.keys(result.manifestation).sort()).toStrictEqual(
      [
        'protocol',
        'type',
        'status',
        'campusId',
        'administrativeUnitId',
        'description',
        'forwardedToUnit',
        'createdAt',
        'messages',
        'attachments',
      ].sort(),
    )
  })

  it('throws the generic anonymous tracking error when the details projection is missing', async () => {
    manifestationsRepository.findByProtocol.mockResolvedValue(buildAnonymousManifestation())
    manifestationsRepository.findDetailsById.mockResolvedValue(null)
    hashComparer.compare.mockResolvedValue(true)

    await expect(
      sut.execute({
        protocol: 'OUV-2026-K7F9Q2',
        accessCode: 'plain-access-code',
      }),
    ).rejects.toBeInstanceOf(ManifestationTrackingNotFoundError)
  })
})
