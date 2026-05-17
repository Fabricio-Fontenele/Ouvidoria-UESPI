import type { ManifestationSearchContract } from './manifestation-summary-contract'

export const manifestationSearchFields = ['protocol', 'manifestationType', 'area', 'description'] as const

type ManifestationSearchField = (typeof manifestationSearchFields)[number]

function normalizeSearchValue(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function getManifestationSearchValue<TManifestation extends ManifestationSearchContract>(
  manifestation: TManifestation,
  field: ManifestationSearchField,
) {
  return normalizeSearchValue(manifestation[field])
}

export function matchesManifestationSearch<TManifestation extends ManifestationSearchContract>(
  manifestation: TManifestation,
  search: string,
) {
  const normalizedSearch = normalizeSearchValue(search)

  if (normalizedSearch.length === 0) {
    return true
  }

  return manifestationSearchFields.some((field) =>
    getManifestationSearchValue(manifestation, field).includes(normalizedSearch),
  )
}

export function searchManifestations<TManifestation extends ManifestationSearchContract>(
  manifestations: TManifestation[],
  search: string,
) {
  return manifestations.filter((manifestation) => matchesManifestationSearch(manifestation, search))
}
