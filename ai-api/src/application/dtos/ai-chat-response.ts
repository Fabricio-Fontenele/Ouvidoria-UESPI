import { z } from 'zod'

export const AI_CHAT_INTENTS = [
  'institutional_question',
  'manifestation_candidate',
  'manifestation_draft_ready',
  'out_of_scope',
  'unknown',
] as const

export type AiChatIntent = (typeof AI_CHAT_INTENTS)[number]

export const MANIFESTATION_TYPES = ['report', 'complaint', 'suggestion', 'compliment'] as const

export type ManifestationType = (typeof MANIFESTATION_TYPES)[number]

export const REQUIRED_DRAFT_FIELDS = ['type', 'campusId', 'administrativeUnitId', 'description'] as const

export type RequiredDraftField = (typeof REQUIRED_DRAFT_FIELDS)[number]

export const aiSuggestionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1).max(60),
  message: z.string().min(1).max(200),
})

export const aiDraftSchema = z.object({
  type: z.enum(MANIFESTATION_TYPES).nullable(),
  campusId: z.string().min(1).nullable(),
  administrativeUnitId: z.string().min(1).nullable(),
  description: z.string().min(1).nullable(),
  involvedPeople: z.string().min(1).nullable(),
})

export const aiChatResponseSchema = z.object({
  answer: z.string().min(1),
  intent: z.enum(AI_CHAT_INTENTS),
  confidence: z.number().min(0).max(1).nullable(),
  shouldOpenManifestationDraft: z.boolean(),
  draft: aiDraftSchema.nullable(),
  missingFields: z.array(z.enum(REQUIRED_DRAFT_FIELDS)),
  suggestions: z.array(aiSuggestionSchema).max(4).default([]),
})

export type AiChatDraft = z.infer<typeof aiDraftSchema>
export type AiChatSuggestion = z.infer<typeof aiSuggestionSchema>
export type AiChatResponse = z.infer<typeof aiChatResponseSchema>

export const NEUTRAL_FALLBACK_RESPONSE: AiChatResponse = {
  answer:
    'Não consegui interpretar sua solicitação com segurança. Você pode reformular ou abrir uma manifestação pelo formulário.',
  intent: 'unknown',
  confidence: null,
  shouldOpenManifestationDraft: false,
  draft: null,
  missingFields: [],
  suggestions: [],
}
