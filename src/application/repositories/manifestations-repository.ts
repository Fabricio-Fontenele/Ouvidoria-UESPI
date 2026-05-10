import type { Manifestation } from '#src/domain/entities/manifestation.js'

export interface ManifestationsRepository {
  save(manifestation: Manifestation): Promise<void>
}
