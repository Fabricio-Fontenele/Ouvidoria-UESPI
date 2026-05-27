import type {
  GuaraChatDraft,
  GuaraChatIntent,
  GuaraChatMissingField,
  GuaraChatSuggestion,
  SendGuaraMessageOutput,
} from '../../application/guara-chat/guara-chat-types'
import { manifestationTypeValues } from '../../application/manifestations/manifestation-type-contract'
import type { ManifestationType } from '../../application/manifestations/manifestation-type-contract'

const intentValues: readonly GuaraChatIntent[] = [
  'institutional_question',
  'manifestation_candidate',
  'manifestation_draft_ready',
  'out_of_scope',
  'unknown',
]

const missingFieldValues: readonly GuaraChatMissingField[] = ['type', 'campusId', 'administrativeUnitId', 'description']

function normalizeIntent(value: unknown): GuaraChatIntent {
  if (typeof value === 'string' && (intentValues as readonly string[]).includes(value)) {
    return value as GuaraChatIntent
  }

  return 'unknown'
}

function normalizeConfidence(value: unknown): number | null {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return null
  }

  if (value < 0 || value > 1) {
    return null
  }

  return value
}

function normalizeManifestationType(value: unknown): ManifestationType | null {
  if (typeof value === 'string' && (manifestationTypeValues as readonly string[]).includes(value)) {
    return value as ManifestationType
  }

  return null
}

function normalizeNullableString(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }

  const trimmed = value.trim()

  return trimmed.length === 0 ? null : trimmed
}

function normalizeDraft(value: unknown): GuaraChatDraft | null {
  if (value === null || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>

  const draft: GuaraChatDraft = {
    administrativeUnitId: normalizeNullableString(record.administrativeUnitId),
    campusId: normalizeNullableString(record.campusId),
    description: normalizeNullableString(record.description),
    involvedPeople: normalizeNullableString(record.involvedPeople),
    type: normalizeManifestationType(record.type),
  }

  const allEmpty =
    draft.administrativeUnitId === null &&
    draft.campusId === null &&
    draft.description === null &&
    draft.involvedPeople === null &&
    draft.type === null

  return allEmpty ? null : draft
}

function normalizeMissingFields(value: unknown): GuaraChatMissingField[] {
  if (!Array.isArray(value)) {
    return []
  }

  const fields = new Set<GuaraChatMissingField>()

  for (const entry of value) {
    if (typeof entry === 'string' && (missingFieldValues as readonly string[]).includes(entry)) {
      fields.add(entry as GuaraChatMissingField)
    }
  }

  return Array.from(fields)
}

function normalizeAnswer(value: unknown): string {
  if (typeof value !== 'string') {
    return ''
  }

  return value.trim()
}

function normalizeSuggestions(value: unknown): GuaraChatSuggestion[] {
  if (!Array.isArray(value)) {
    return []
  }

  const seenLabels = new Set<string>()
  const seenIds = new Set<string>()
  const suggestions: GuaraChatSuggestion[] = []

  for (const entry of value) {
    if (entry === null || typeof entry !== 'object') {
      continue
    }

    const record = entry as Record<string, unknown>
    const id = normalizeNullableString(record.id)
    const label = normalizeNullableString(record.label)
    const message = normalizeNullableString(record.message)

    if (id === null || label === null || message === null) {
      continue
    }

    const normalizedLabel = label.toLowerCase()
    if (seenLabels.has(normalizedLabel) || seenIds.has(id)) {
      continue
    }
    seenLabels.add(normalizedLabel)
    seenIds.add(id)

    suggestions.push({ id, label, message })

    if (suggestions.length >= 4) {
      break
    }
  }

  return suggestions
}

export function normalizeGuaraChatResponse(raw: unknown): SendGuaraMessageOutput {
  if (raw === null || typeof raw !== 'object') {
    return {
      answer: '',
      confidence: null,
      draft: null,
      intent: 'unknown',
      missingFields: [],
      shouldOpenManifestationDraft: false,
      suggestions: [],
    }
  }

  const record = raw as Record<string, unknown>

  const intent = normalizeIntent(record.intent)
  const draft = normalizeDraft(record.draft)
  const missingFields = normalizeMissingFields(record.missingFields)
  const rawShouldOpen = record.shouldOpenManifestationDraft === true
  const shouldOpenManifestationDraft =
    rawShouldOpen && intent === 'manifestation_draft_ready' && draft !== null && missingFields.length === 0

  return {
    answer: normalizeAnswer(record.answer),
    confidence: normalizeConfidence(record.confidence),
    draft,
    intent,
    missingFields,
    shouldOpenManifestationDraft,
    suggestions: normalizeSuggestions(record.suggestions),
  }
}
