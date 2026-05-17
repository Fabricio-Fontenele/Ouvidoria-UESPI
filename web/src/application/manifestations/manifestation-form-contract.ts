import { z } from 'zod'

export const manifestationTypes = ['Denúncia', 'Reclamação', 'Solicitação', 'Sugestão', 'Elogio'] as const

export const manifestationAreas = [
  'Administração Superior',
  'Coordenação de Curso',
  'Biblioteca',
  'Assistência Estudantil',
  'Outro setor',
] as const

export const manifestationIdentificationOptions = [
  { label: 'Manifestação identificada', value: 'identified' },
  { label: 'Manifestação anônima', value: 'anonymous' },
] as const

export const manifestationAttachmentLimits = {
  maxFileSizeInBytes: 5 * 1024 * 1024,
  maxFiles: 5,
}

export const manifestationFormSchema = z.object({
  area: z
    .string()
    .min(1, 'Selecione a área responsável.')
    .refine(
      (value) => manifestationAreas.includes(value as (typeof manifestationAreas)[number]),
      'Selecione uma área válida.',
    ),
  attachments: z
    .custom<FileList>()
    .optional()
    .refine((files) => files === undefined || files.length <= manifestationAttachmentLimits.maxFiles, {
      message: `Envie no máximo ${manifestationAttachmentLimits.maxFiles} arquivos.`,
    })
    .refine(
      (files) =>
        files === undefined ||
        Array.from(files).every((file) => file.size <= manifestationAttachmentLimits.maxFileSizeInBytes),
      'Cada arquivo deve ter até 5 MB.',
    ),
  description: z
    .string()
    .trim()
    .min(20, 'Descreva a manifestação com pelo menos 20 caracteres.')
    .max(4000, 'A descrição deve ter no máximo 4000 caracteres.'),
  identification: z
    .string()
    .min(1, 'Selecione a forma de identificação.')
    .refine((value) => manifestationIdentificationOptions.some((option) => option.value === value), {
      message: 'Selecione uma forma de identificação válida.',
    }),
  manifestationType: z
    .string()
    .min(1, 'Selecione o tipo de manifestação.')
    .refine(
      (value) => manifestationTypes.includes(value as (typeof manifestationTypes)[number]),
      'Selecione um tipo válido.',
    ),
  title: z
    .string()
    .trim()
    .min(5, 'Informe um título com pelo menos 5 caracteres.')
    .max(120, 'O título deve ter no máximo 120 caracteres.'),
})

export type ManifestationFormData = z.infer<typeof manifestationFormSchema>

export function getManifestationFormDefaultValues(isEditing: boolean): ManifestationFormData {
  if (isEditing) {
    return {
      area: 'Administração Superior',
      attachments: undefined,
      description:
        'Solicito a avaliação da possibilidade de ampliação dos horários de funcionamento da Biblioteca Central.',
      identification: 'identified',
      manifestationType: 'Sugestão',
      title: 'Solicitação de Ampliação de Horários na Biblioteca Central',
    }
  }

  return {
    area: '',
    attachments: undefined,
    description: '',
    identification: 'identified',
    manifestationType: '',
    title: '',
  }
}
