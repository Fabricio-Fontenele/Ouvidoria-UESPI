// Espelha o enum `ManifestationCancellationReason` do backend. O catálogo é fixo;
// a UI renderiza estas opções para o ouvidor marcar antes de confirmar o cancelamento.
export const knownCancellationReasons = [
  'duplicate',
  'out_of_scope',
  'insufficient_information',
  'offensive_content',
  'spam_or_test',
  'requested_by_author',
  'other',
] as const

export type CancellationReason = (typeof knownCancellationReasons)[number]

export interface CancellationReasonOption {
  description: string
  label: string
  value: CancellationReason
}

export const cancellationReasonOptions: CancellationReasonOption[] = [
  {
    description: 'Já existe outra manifestação tratando do mesmo assunto.',
    label: 'Manifestação duplicada',
    value: 'duplicate',
  },
  {
    description: 'O assunto não compete à Ouvidoria.',
    label: 'Fora da competência da Ouvidoria',
    value: 'out_of_scope',
  },
  {
    description: 'Faltam dados essenciais para dar andamento à análise.',
    label: 'Informações insuficientes para análise',
    value: 'insufficient_information',
  },
  {
    description: 'O conteúdo é ofensivo, discriminatório ou impróprio.',
    label: 'Conteúdo ofensivo ou impróprio',
    value: 'offensive_content',
  },
  {
    description: 'Registro de teste, duplicado por engano ou spam.',
    label: 'Registro de teste ou spam',
    value: 'spam_or_test',
  },
  {
    description: 'O próprio autor pediu o cancelamento por outro canal.',
    label: 'Cancelamento solicitado pelo autor',
    value: 'requested_by_author',
  },
  {
    description: 'Outro motivo — descreva na justificativa.',
    label: 'Outro motivo',
    value: 'other',
  },
]

const cancellationReasonLabelByValue = Object.fromEntries(
  cancellationReasonOptions.map((option) => [option.value, option.label]),
) as Record<CancellationReason, string>

export function describeCancellationReason(value: string): string {
  return cancellationReasonLabelByValue[value as CancellationReason] ?? value
}

// O backend exige justificativa quando o motivo é "outro"; a UI espelha essa regra
// para bloquear o envio antes de uma resposta de erro.
export function cancellationReasonRequiresNote(value: CancellationReason): boolean {
  return value === 'other'
}
