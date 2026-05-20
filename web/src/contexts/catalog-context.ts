import { createContext } from 'react'

import type { Catalog } from '../application/catalog/catalog-types'

export type CatalogStatus = 'idle' | 'loading' | 'ready' | 'error'

export interface CatalogContextValue {
  catalog: Catalog | null
  error: string | null
  reload: () => void
  status: CatalogStatus
}

export const CatalogContext = createContext<CatalogContextValue | null>(null)
