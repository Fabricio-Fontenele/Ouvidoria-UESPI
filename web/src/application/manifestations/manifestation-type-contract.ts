export const manifestationTypeValues = ['report', 'complaint', 'suggestion', 'compliment'] as const

export type ManifestationType = (typeof manifestationTypeValues)[number]

export interface ManifestationTypeContract {
  description: string
  label: string
  value: ManifestationType
}

export const manifestationTypeContracts: ManifestationTypeContract[] = [
  {
    description: 'Relato de irregularidades ou condutas inadequadas.',
    label: 'Denúncia',
    value: 'report',
  },
  {
    description: 'Insatisfação com serviços ou atendimentos prestados.',
    label: 'Reclamação',
    value: 'complaint',
  },
  {
    description: 'Ideia ou recomendação para melhoria institucional.',
    label: 'Sugestão',
    value: 'suggestion',
  },
  {
    description: 'Reconhecimento de atendimentos ou serviços positivos.',
    label: 'Elogio',
    value: 'compliment',
  },
]

const manifestationTypeContractByValue = Object.fromEntries(
  manifestationTypeContracts.map((type) => [type.value, type]),
) as Record<ManifestationType, ManifestationTypeContract>

export function getManifestationTypeContract(value: ManifestationType): ManifestationTypeContract {
  return manifestationTypeContractByValue[value]
}

export function getManifestationTypeLabel(value: ManifestationType): string {
  return manifestationTypeContractByValue[value].label
}
