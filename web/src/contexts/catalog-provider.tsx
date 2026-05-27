import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import type { CatalogService } from '../application/catalog/catalog-service'
import type { Catalog } from '../application/catalog/catalog-types'
import { resolveApiErrorMessage } from '../infrastructure/http/resolve-api-error-message'
import { CatalogContext } from './catalog-context'
import type { CatalogStatus } from './catalog-context'

function resolveCatalogError(error: unknown) {
  return resolveApiErrorMessage(error, 'Não foi possível carregar o catálogo institucional.')
}

export function CatalogProvider({ children, service }: { children: ReactNode; service: CatalogService }) {
  const [catalog, setCatalog] = useState<Catalog | null>(null)
  const [status, setStatus] = useState<CatalogStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((current) => current + 1)
  }, [])

  useEffect(() => {
    let isMounted = true

    async function loadCatalog() {
      setStatus('loading')
      setError(null)

      try {
        const nextCatalog = await service.getCatalog()

        if (!isMounted) {
          return
        }

        setCatalog(nextCatalog)
        setStatus('ready')
      } catch (catalogError) {
        if (!isMounted) {
          return
        }

        setCatalog(null)
        setError(resolveCatalogError(catalogError))
        setStatus('error')
      }
    }

    void loadCatalog()

    return () => {
      isMounted = false
    }
  }, [service, reloadToken])

  const value = useMemo(
    () => ({
      catalog,
      error,
      reload,
      status,
    }),
    [catalog, error, reload, status],
  )

  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>
}
