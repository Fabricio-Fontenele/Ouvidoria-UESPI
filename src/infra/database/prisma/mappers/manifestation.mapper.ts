import type {
  Manifestation as PrismaManifestation,
  ManifestationStatus as PrismaManifestationStatus,
  ManifestationType as PrismaManifestationType,
} from '@prisma/client'

import { Manifestation, type ManifestationStatus, type ManifestationType } from '#src/domain/entities/manifestation.js'
import { AdministrativeUnitId } from '#src/domain/value-objects/administrative-unit-id.js'
import { CampusId } from '#src/domain/value-objects/campus-id.js'
import { ManifestationDescription } from '#src/domain/value-objects/manifestation-description.js'
import { ManifestationInvolvedPeople } from '#src/domain/value-objects/manifestation-involved-people.js'
import { Protocol } from '#src/domain/value-objects/protocol.js'
import { UniqueEntityId } from '#src/domain/value-objects/unique-entity-id.js'

export const manifestationMapper = {
  toDomain(raw: PrismaManifestation): Manifestation {
    const forwardedToUnitId = raw.forwardedToUnitId
    return Manifestation.restore(
      {
        protocol: Protocol.create(raw.protocol),
        type: raw.type as ManifestationType,
        status: raw.status as ManifestationStatus,
        campusId: CampusId.create(raw.campusId),
        administrativeUnitId: AdministrativeUnitId.create(raw.administrativeUnitId),
        description: ManifestationDescription.create(raw.description),
        involvedPeople: raw.involvedPeople === null ? null : ManifestationInvolvedPeople.create(raw.involvedPeople),
        authorUserId: raw.authorUserId === null ? null : new UniqueEntityId(raw.authorUserId),
        attendantUserId: raw.attendantUserId === null ? null : new UniqueEntityId(raw.attendantUserId),
        forwardedToUnitId: forwardedToUnitId === null ? null : AdministrativeUnitId.create(forwardedToUnitId),
        accessCodeHash: raw.accessCodeHash,
        createdAt: raw.createdAt,
      },
      new UniqueEntityId(raw.id),
    )
  },

  toPersistence(manifestation: Manifestation): {
    id: string
    protocol: string
    type: PrismaManifestationType
    status: PrismaManifestationStatus
    campusId: string
    administrativeUnitId: string
    description: string
    involvedPeople: string | null
    authorUserId: string | null
    attendantUserId: string | null
    forwardedToUnitId: string | null
    accessCodeHash: string | null
    createdAt: Date
  } {
    return {
      id: manifestation.id.toString(),
      protocol: manifestation.protocol.getValue(),
      type: manifestation.type,
      status: manifestation.status,
      campusId: manifestation.campusId.getValue(),
      administrativeUnitId: manifestation.administrativeUnitId.getValue(),
      description: manifestation.description.getValue(),
      involvedPeople: manifestation.involvedPeople?.getValue() ?? null,
      authorUserId: manifestation.authorUserId?.toString() ?? null,
      attendantUserId: manifestation.attendantUserId?.toString() ?? null,
      forwardedToUnitId: manifestation.forwardedToUnitId?.getValue() ?? null,
      accessCodeHash: manifestation.accessCodeHash,
      createdAt: manifestation.createdAt,
    }
  },
}
