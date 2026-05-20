import { createContext } from 'react'

import type { ManifestationsService } from '../application/manifestations/manifestations-service'

export const ManifestationsServiceContext = createContext<ManifestationsService | null>(null)
