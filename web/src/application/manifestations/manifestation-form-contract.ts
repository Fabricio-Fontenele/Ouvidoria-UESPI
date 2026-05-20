import { z } from 'zod'

import { manifestationTypeValues } from './manifestation-type-contract'

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
