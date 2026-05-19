import type { OmbudsmanManifestationStatus, OmbudsmanManifestationSummary } from './ombudsman-manifestation-contract'

export interface OmbudsmanManifestationDetail extends OmbudsmanManifestationSummary {
  createdAt: string
  title: string
}

export interface OmbudsmanManifestationReply {
  createdAt: string
  id: string
  message: string
}

export interface OmbudsmanReplyFormData {
  message: string
}

export interface OmbudsmanManifestationDetailViewModel extends OmbudsmanManifestationDetail {
  replies: OmbudsmanManifestationReply[]
  status: OmbudsmanManifestationStatus
}

export const ombudsmanReplyLimits = {
  maxLength: 1000,
} as const
