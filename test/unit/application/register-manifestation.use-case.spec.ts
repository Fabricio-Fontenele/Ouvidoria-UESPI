import { beforeEach, describe, expect, it } from 'vitest'
import { mockDeep, mockReset, type DeepMockProxy } from 'vitest-mock-extended'

import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { AccessCodeGenerator } from '#src/application/protocol/access-code-generator.js'
import type { ProtocolGenerator } from '#src/application/protocol/protocol-generator.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import { IdentifiedManifestationRequiresRequesterError } from '#src/application/use-cases/register-manifestation/errors/identified-manifestation-requires-requester-error.js'
import { RegisterManifestationUseCase } from '#src/application/use-cases/register-manifestation/register-manifestation.use-case.js'
import type { Manifestation } from '#src/domain/entities/manifestation.js'
import { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { InvalidAdministrativeUnitIdError } from '#src/domain/value-objects/administrative-unit-id.js'
import { InvalidCampusIdError } from '#src/domain/value-objects/campus-id.js'
import { InvalidManifestationDescriptionError } from '#src/domain/value-objects/manifestation-description.js'

describe('RegisterManifestationUseCase', () => {
  let manifestationsRepository: DeepMockProxy<ManifestationsRepository>
  let protocolGenerator: DeepMockProxy<ProtocolGenerator>
  let accessCodeGenerator: DeepMockProxy<AccessCodeGenerator>
  let passwordHasher: DeepMockProxy<PasswordHasher>
  let sut: RegisterManifestationUseCase
  let validInput: {
    requesterId: string | null
    isAnonymous: boolean
    type: ManifestationType
    campusId: string
    administrativeUnitId: string
    description: string
  }

  beforeEach(() => {
    manifestationsRepository = mockDeep<ManifestationsRepository>()
    protocolGenerator = mockDeep<ProtocolGenerator>()
    accessCodeGenerator = mockDeep<AccessCodeGenerator>()
    passwordHasher = mockDeep<PasswordHasher>()
    validInput = {
      requesterId: 'user-1',
      isAnonymous: false,
      type: ManifestationType.COMPLAINT,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      description: '  The service was unavailable during the whole morning.  ',
    }

    mockReset(manifestationsRepository)
    mockReset(protocolGenerator)
    mockReset(accessCodeGenerator)
    mockReset(passwordHasher)

    sut = new RegisterManifestationUseCase(
      manifestationsRepository,
      protocolGenerator,
      accessCodeGenerator,
      passwordHasher,
    )
  })

  it('registers a manifestation with normalized data and generated protocol', async () => {
    protocolGenerator.generate.mockResolvedValue('  2026-0001  ')

    const result = await sut.execute(validInput)

    expect(protocolGenerator.generate.mock.calls).toHaveLength(1)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(1)
    expect(accessCodeGenerator.generate.mock.calls).toHaveLength(0)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)

    const saveCall = manifestationsRepository.save.mock.calls[0] as [Manifestation] | undefined

    expect(saveCall).toBeDefined()

    if (!saveCall) {
      throw new Error('Expected saved manifestation to be provided to repository')
    }

    const savedManifestation = saveCall[0]

    expect(savedManifestation.protocol.getValue()).toBe('2026-0001')
    expect(savedManifestation.type).toBe(ManifestationType.COMPLAINT)
    expect(savedManifestation.status).toBe(ManifestationStatus.IN_ANALYSIS)
    expect(savedManifestation.campusId.getValue()).toBe('campus-1')
    expect(savedManifestation.administrativeUnitId.getValue()).toBe('unit-1')
    expect(savedManifestation.description.getValue()).toBe('The service was unavailable during the whole morning.')
    expect(savedManifestation.authorUserId?.toString()).toBe('user-1')
    expect(savedManifestation.accessCodeHash).toBeNull()
    expect(savedManifestation.createdAt).toBeInstanceOf(Date)

    expect(result.manifestation).toStrictEqual({
      id: savedManifestation.id.toString(),
      protocol: '2026-0001',
      type: ManifestationType.COMPLAINT,
      status: ManifestationStatus.IN_ANALYSIS,
      campusId: 'campus-1',
      administrativeUnitId: 'unit-1',
      description: 'The service was unavailable during the whole morning.',
      isAnonymous: false,
      authorUserId: 'user-1',
      createdAt: savedManifestation.createdAt,
    })
    expect(result.accessCode).toBeNull()
  })

  it('generates and hashes an access code only for anonymous manifestations', async () => {
    protocolGenerator.generate.mockResolvedValue('2026-0002')
    accessCodeGenerator.generate.mockResolvedValue('OUV-2026-K7F9Q2')
    passwordHasher.hash.mockResolvedValue('hashed-access-code')

    const result = await sut.execute({
      ...validInput,
      isAnonymous: true,
      requesterId: 'user-1',
    })

    const saveCall = manifestationsRepository.save.mock.calls[0] as [Manifestation] | undefined

    expect(accessCodeGenerator.generate.mock.calls).toHaveLength(1)
    expect(passwordHasher.hash.mock.calls).toStrictEqual([['OUV-2026-K7F9Q2']])
    expect(saveCall?.[0].authorUserId).toBeNull()
    expect(saveCall?.[0].accessCodeHash).toBe('hashed-access-code')
    expect(result.manifestation.authorUserId).toBeNull()
    expect(result.manifestation.isAnonymous).toBe(true)
    expect(result.accessCode).toBe('OUV-2026-K7F9Q2')
  })

  it('rejects identified manifestations without requester id before generating a protocol or saving', async () => {
    await expect(
      sut.execute({
        ...validInput,
        requesterId: null,
      }),
    ).rejects.toBeInstanceOf(IdentifiedManifestationRequiresRequesterError)

    expect(protocolGenerator.generate.mock.calls).toHaveLength(0)
    expect(accessCodeGenerator.generate.mock.calls).toHaveLength(0)
    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid campus ids before generating a protocol or saving', async () => {
    await expect(
      sut.execute({
        ...validInput,
        campusId: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidCampusIdError)

    expect(protocolGenerator.generate.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid administrative unit ids before generating a protocol or saving', async () => {
    await expect(
      sut.execute({
        ...validInput,
        administrativeUnitId: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidAdministrativeUnitIdError)

    expect(protocolGenerator.generate.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('rejects invalid descriptions before generating a protocol or saving', async () => {
    await expect(
      sut.execute({
        ...validInput,
        description: '   ',
      }),
    ).rejects.toBeInstanceOf(InvalidManifestationDescriptionError)

    expect(protocolGenerator.generate.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates protocol generator failures and does not save the manifestation', async () => {
    const generatorError = new Error('protocol generation failed')

    protocolGenerator.generate.mockRejectedValue(generatorError)

    await expect(sut.execute(validInput)).rejects.toThrow(generatorError)

    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })

  it('propagates access code generator failures and does not save the manifestation', async () => {
    const generatorError = new Error('access code generation failed')

    protocolGenerator.generate.mockResolvedValue('2026-0003')
    accessCodeGenerator.generate.mockRejectedValue(generatorError)

    await expect(
      sut.execute({
        ...validInput,
        isAnonymous: true,
        requesterId: null,
      }),
    ).rejects.toThrow(generatorError)

    expect(passwordHasher.hash.mock.calls).toHaveLength(0)
    expect(manifestationsRepository.save.mock.calls).toHaveLength(0)
  })
})
