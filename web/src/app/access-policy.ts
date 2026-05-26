import type { AuthenticatedUserRole } from '../application/auth/auth-types'

export const ombudsmanAreaRoles = ['ombudsman', 'admin'] as const satisfies readonly AuthenticatedUserRole[]
export const manifestantOnlyRoles = ['manifestant'] as const satisfies readonly AuthenticatedUserRole[]

export type OmbudsmanAreaRole = (typeof ombudsmanAreaRoles)[number]
export type ManifestantOnlyRole = (typeof manifestantOnlyRoles)[number]

export const FILTER_ALL_VALUE = 'all' as const
export type FilterAllValue = typeof FILTER_ALL_VALUE
