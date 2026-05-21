import type {
  ManifestationAttachmentInfo,
  ManifestationDetail,
  ManifestationHistoryEntry,
  ManifestationMessageEntry,
} from '../../application/manifestations/manifestation-detail-contract'
import {
  narrowAttachmentUploaderType,
  narrowHistoryEntryType,
  narrowMessageSenderType,
} from '../../application/manifestations/manifestation-detail-contract'
import type { ManifestationSummary } from '../../application/manifestations/manifestation-summary-contract'
import type {
  AddMessageInput,
  AttachmentDownloadUrlResult,
  CreateManifestationInput,
  CreateManifestationResult,
  EvaluateInput,
  GetManifestationAttachmentDownloadUrlInput,
  GetTrackedManifestationAttachmentDownloadUrlInput,
  ManifestationsService,
  TrackManifestationInput,
  UploadManifestationAttachmentInput,
  UploadTrackedManifestationAttachmentInput,
} from '../../application/manifestations/manifestations-service'
import type {
  RawTrackedManifestationDetail,
  TrackedManifestationDetail,
} from '../../application/manifestations/tracked-manifestation-contract'
import { mapTrackedManifestationDetail } from '../../application/manifestations/tracked-manifestation-contract'
import { apiFetch, publicApiFetch } from '../http/api-client'

interface ListResponse {
  manifestations: ManifestationSummary[]
}

interface DetailResponse {
  manifestation: RawManifestationDetail
}

interface MessageResponse {
  message: RawMessageEntry
}

interface TrackedDetailResponse {
  manifestation: RawTrackedManifestationDetail
}

interface RawManifestationDetail extends Omit<ManifestationDetail, 'attachments' | 'history' | 'messages'> {
  attachments: RawAttachmentInfo[]
  history: RawHistoryEntry[]
  messages: RawMessageEntry[]
}

interface RawHistoryEntry extends Omit<ManifestationHistoryEntry, 'actorType' | 'type'> {
  actorType: string
  type: string
}

interface RawMessageEntry extends Omit<ManifestationMessageEntry, 'senderType'> {
  senderType: string
}

interface RawAttachmentInfo extends Omit<ManifestationAttachmentInfo, 'uploadedByType'> {
  uploadedByType: string
}

function mapHistoryEntry(entry: RawHistoryEntry): ManifestationHistoryEntry {
  return {
    ...entry,
    actorType: narrowMessageSenderType(entry.actorType),
    type: narrowHistoryEntryType(entry.type),
  }
}

function mapMessageEntry(entry: RawMessageEntry): ManifestationMessageEntry {
  return {
    ...entry,
    senderType: narrowMessageSenderType(entry.senderType),
  }
}

function mapAttachmentInfo(attachment: RawAttachmentInfo): ManifestationAttachmentInfo {
  return {
    ...attachment,
    uploadedByType: narrowAttachmentUploaderType(attachment.uploadedByType),
  }
}

function mapManifestationDetail(raw: RawManifestationDetail): ManifestationDetail {
  return {
    ...raw,
    attachments: raw.attachments.map(mapAttachmentInfo),
    history: raw.history.map(mapHistoryEntry),
    messages: raw.messages.map(mapMessageEntry),
  }
}

export class HttpManifestationsService implements ManifestationsService {
  async addMessage(input: AddMessageInput): Promise<ManifestationMessageEntry> {
    const response = await apiFetch<MessageResponse>(`/manifestations/${input.manifestationId}/messages`, {
      body: { content: input.content },
      method: 'POST',
    })

    return mapMessageEntry(response.message)
  }

  async create(input: CreateManifestationInput): Promise<CreateManifestationResult> {
    return apiFetch<CreateManifestationResult>('/manifestations', {
      body: {
        administrativeUnitId: input.administrativeUnitId,
        campusId: input.campusId,
        description: input.description,
        involvedPeople: input.involvedPeople,
        isAnonymous: input.isAnonymous,
        type: input.type,
      },
      method: 'POST',
    })
  }

  async evaluate(input: EvaluateInput): Promise<void> {
    await apiFetch<unknown>(`/manifestations/${input.manifestationId}/evaluation`, {
      body: { comment: input.comment, rating: input.rating },
      method: 'POST',
    })
  }

  async finalize(manifestationId: string): Promise<void> {
    await apiFetch<unknown>(`/manifestations/${manifestationId}/finalize`, {
      method: 'POST',
    })
  }

  async getAttachmentDownloadUrl(input: GetManifestationAttachmentDownloadUrlInput): Promise<string> {
    const response = await apiFetch<AttachmentDownloadUrlResult>(
      `/manifestations/${input.manifestationId}/attachments/${input.attachmentId}/download-url`,
      { method: 'POST' },
    )

    return response.downloadUrl
  }

  async getById(id: string): Promise<ManifestationDetail> {
    const response = await apiFetch<DetailResponse>(`/manifestations/${id}`)
    return mapManifestationDetail(response.manifestation)
  }

  async getTrackedAttachmentDownloadUrl(input: GetTrackedManifestationAttachmentDownloadUrlInput): Promise<string> {
    const response = await publicApiFetch<AttachmentDownloadUrlResult>(
      `/manifestations/track/attachments/${input.attachmentId}/download-url`,
      {
        body: { accessCode: input.accessCode, protocol: input.protocol },
        method: 'POST',
      },
    )

    return response.downloadUrl
  }

  async getTrackedDetails(input: TrackManifestationInput): Promise<TrackedManifestationDetail> {
    const response = await publicApiFetch<TrackedDetailResponse>('/manifestations/track/details', {
      body: { accessCode: input.accessCode, protocol: input.protocol },
      method: 'POST',
    })

    return mapTrackedManifestationDetail(response.manifestation)
  }

  async list(page = 1): Promise<ManifestationSummary[]> {
    const response = await apiFetch<ListResponse>('/manifestations', {
      query: { page },
    })

    return response.manifestations
  }

  async uploadAttachment(input: UploadManifestationAttachmentInput): Promise<void> {
    const body = new FormData()
    body.set('file', input.file)

    await apiFetch<unknown>(`/manifestations/${input.manifestationId}/attachments`, {
      body,
      method: 'POST',
    })
  }

  async uploadTrackedAttachment(input: UploadTrackedManifestationAttachmentInput): Promise<void> {
    const body = new FormData()
    body.set('protocol', input.protocol)
    body.set('accessCode', input.accessCode)
    body.set('file', input.file)

    await publicApiFetch<unknown>('/manifestations/track/attachments', {
      body,
      method: 'POST',
    })
  }
}
