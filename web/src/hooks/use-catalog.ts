import { useContext } from 'react'

import { CatalogContext } from '../contexts/catalog-context'

export function useCatalog() {
  const catalog = useContext(CatalogContext)

  if (catalog === null) {
    throw new Error('CatalogProvider is required to use the institutional catalog.')
  }

  return catalog
}
