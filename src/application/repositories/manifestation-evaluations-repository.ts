import type { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'

export interface ManifestationEvaluationsRepository {
  findByManifestationId(manifestationId: string): Promise<ManifestationEvaluation | null>
  save(evaluation: ManifestationEvaluation, actorUserId: string): Promise<void>
}
