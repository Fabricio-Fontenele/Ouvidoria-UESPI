import type { AuthenticatedUser } from '../auth/auth-types'
import type { ManifestationType } from '../manifestations/manifestation-type-contract'
import type { GuaraChatDraft, GuaraChatMissingField } from './guara-chat-types'

export interface GuaraChatCapabilities {
  canAskInstitutionalInfo: boolean
  canCreateDraft: boolean
  allowedDraftTypes: readonly ManifestationType[]
}

const publicCapabilities: GuaraChatCapabilities = {
  allowedDraftTypes: ['report'],
  canAskInstitutionalInfo: true,
  canCreateDraft: true,
}

const manifestantCapabilities: GuaraChatCapabilities = {
  allowedDraftTypes: ['report', 'complaint', 'suggestion', 'compliment'],
  canAskInstitutionalInfo: true,
  canCreateDraft: true,
}

const administrativeCapabilities: GuaraChatCapabilities = {
  allowedDraftTypes: [],
  canAskInstitutionalInfo: true,
  canCreateDraft: false,
}

export function getGuaraChatCapabilities(user: AuthenticatedUser | null): GuaraChatCapabilities {
  if (user === null) {
    return publicCapabilities
  }

  if (user.role === 'manifestant') {
    return manifestantCapabilities
  }

  return administrativeCapabilities
}

export function canApplyDraft(capabilities: GuaraChatCapabilities, draft: GuaraChatDraft | null): boolean {
  if (!capabilities.canCreateDraft || draft === null || draft.type === null) {
    return false
  }

  return capabilities.allowedDraftTypes.includes(draft.type)
}

const missingFieldLabels: Record<GuaraChatMissingField, string> = {
  administrativeUnitId: 'Unidade administrativa',
  campusId: 'Campus',
  description: 'Descrição',
  type: 'Tipo da manifestação',
}

export function getMissingFieldLabel(field: GuaraChatMissingField): string {
  return missingFieldLabels[field]
}
