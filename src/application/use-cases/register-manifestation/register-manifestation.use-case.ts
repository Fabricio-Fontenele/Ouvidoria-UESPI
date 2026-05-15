import type { PasswordHasher } from '#src/application/cryptography/password-hasher.js'
import type { AccessCodeGenerator } from '#src/application/protocol/access-code-generator.js'
import type { ProtocolGenerator } from '#src/application/protocol/protocol-generator.js'
import type { ManifestationsRepository } from '#src/application/repositories/manifestations-repository.js'
import type { ManifestationStatus, ManifestationType } from '#src/domain/entities/manifestation.js'
import { Manifestation } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

import type { UseCase } from '../use-case.js'
import { IdentifiedManifestationRequiresRequesterError } from './errors/identified-manifestation-requires-requester-error.js'

interface RegisterManifestationInput {
  requesterId?: string | null
  isAnonymous: boolean
  type: ManifestationType
  campusId: string
  administrativeUnitId: string
  description: string
}

interface RegisterManifestationOutput {
  manifestation: {
    id: string
    protocol: string
    type: ManifestationType
    status: ManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    isAnonymous: boolean
    authorUserId: string | null
    createdAt: Date
  }
  accessCode: string | null
}

export class RegisterManifestationUseCase implements UseCase<RegisterManifestationInput, RegisterManifestationOutput> {
  constructor(
    private readonly manifestationsRepository: ManifestationsRepository,
    private readonly protocolGenerator: ProtocolGenerator,
    private readonly accessCodeGenerator: AccessCodeGenerator,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute({
    requesterId = null,
    isAnonymous,
    type,
    campusId,
    administrativeUnitId,
    description,
  }: RegisterManifestationInput): Promise<RegisterManifestationOutput> {
    if (!isAnonymous && requesterId === null) {
      throw new IdentifiedManifestationRequiresRequesterError()
    }

    const normalizedCampusId = CampusId.create(campusId)
    const normalizedAdministrativeUnitId = AdministrativeUnitId.create(administrativeUnitId)
    const normalizedDescription = ManifestationDescription.create(description)
    const generatedProtocol = await this.protocolGenerator.generate()
    const protocol = Protocol.create(generatedProtocol)
    let authorId: UniqueEntityId | null = null

    if (!isAnonymous && requesterId !== null) {
      authorId = new UniqueEntityId(requesterId)
    }

    let plainAccessCode: string | null = null
    let accessCodeHash: string | null = null

    if (isAnonymous) {
      plainAccessCode = await this.accessCodeGenerator.generate()
      accessCodeHash = await this.passwordHasher.hash(plainAccessCode)
    }

    const manifestation = Manifestation.open({
      protocol,
      type,
      campusId: normalizedCampusId,
      administrativeUnitId: normalizedAdministrativeUnitId,
      description: normalizedDescription,
      authorUserId: authorId,
      accessCodeHash,
    })

    await this.manifestationsRepository.save(manifestation)

    return {
      manifestation: {
        id: manifestation.id.toString(),
        protocol: manifestation.protocol.getValue(),
        type: manifestation.type,
        status: manifestation.status,
        campusId: manifestation.campusId.getValue(),
        administrativeUnitId: manifestation.administrativeUnitId.getValue(),
        description: manifestation.description.getValue(),
        isAnonymous,
        authorUserId: manifestation.authorUserId?.toString() ?? null,
        createdAt: manifestation.createdAt,
      },
      accessCode: plainAccessCode,
    }
  }
}
