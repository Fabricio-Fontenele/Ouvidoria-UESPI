import type { ManifestationEvaluation } from '#src/domain/entities/manifestation-evaluation.js'

export interface AttendantRatingSummary {
  average: number | null
  count: number
}

export interface ManifestationEvaluationsRepository {
  findByManifestationId(manifestationId: string): Promise<ManifestationEvaluation | null>
  getRatingSummaryByAttendantUserId(userId: string): Promise<AttendantRatingSummary>
  save(evaluation: ManifestationEvaluation, actorUserId: string): Promise<void>
}
