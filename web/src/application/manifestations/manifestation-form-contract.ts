import { z } from 'zod'

import type { GuaraChatDraft } from '../guara-chat/guara-chat-types'
import { manifestationTypeValues } from './manifestation-type-contract'
import type { ManifestationType } from './manifestation-type-contract'

export const manifestationFormSchema = z.object({
  administrativeUnitId: z.string().min(1, 'Selecione a unidade administrativa.'),
  campusId: z.string().min(1, 'Selecione o campus.'),
  description: z
    .string()
    .trim()
    .min(20, 'Descreva a manifestação com pelo menos 20 caracteres.')
    .max(4000, 'A descrição deve ter no máximo 4000 caracteres.'),
  involvedPeople: z
    .string()
    .trim()
    .max(250, 'Informe as pessoas envolvidas com no máximo 250 caracteres.')
    .optional()
    .or(z.literal('')),
  isAnonymous: z.boolean(),
  type: z.enum(manifestationTypeValues, { message: 'Selecione um tipo de manifestação.' }),
})

export type ManifestationFormData = z.infer<typeof manifestationFormSchema>

export function getManifestationFormDefaultValues(): ManifestationFormData {
  return {
    administrativeUnitId: '',
    campusId: '',
    description: '',
    involvedPeople: '',
    isAnonymous: false,
    type: '' as ManifestationFormData['type'],
  }
}

export interface CatalogLookup {
  campusExists: (campusId: string) => boolean
  administrativeUnitBelongsToCampus: (campusId: string, administrativeUnitId: string) => boolean
}

interface DraftDefaultsOptions {
  catalog: CatalogLookup
  isAuthenticated: boolean
}

function isManifestationType(value: ManifestationType | null): value is ManifestationType {
  return value !== null
}

export function getManifestationFormDefaultValuesFromDraft(
  draft: GuaraChatDraft,
  { catalog, isAuthenticated }: DraftDefaultsOptions,
): ManifestationFormData {
  const defaults = getManifestationFormDefaultValues()

  if (isManifestationType(draft.type)) {
    defaults.type = draft.type
  }

  if (typeof draft.campusId === 'string' && catalog.campusExists(draft.campusId)) {
    defaults.campusId = draft.campusId

    if (
      typeof draft.administrativeUnitId === 'string' &&
      catalog.administrativeUnitBelongsToCampus(draft.campusId, draft.administrativeUnitId)
    ) {
      defaults.administrativeUnitId = draft.administrativeUnitId
    }
  }

  if (typeof draft.description === 'string' && draft.description.trim().length > 0) {
    defaults.description = draft.description
  }

  if (typeof draft.involvedPeople === 'string' && draft.involvedPeople.trim().length > 0) {
    defaults.involvedPeople = draft.involvedPeople
  }

  defaults.isAnonymous = !isAuthenticated

  return defaults
}
