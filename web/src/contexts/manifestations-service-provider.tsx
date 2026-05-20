import type { ReactNode } from 'react'

import type { ManifestationsService } from '../application/manifestations/manifestations-service'
import { ManifestationsServiceContext } from './manifestations-service-context'

export function ManifestationsServiceProvider({
  children,
  service,
}: {
  children: ReactNode
  service: ManifestationsService
}) {
  return <ManifestationsServiceContext.Provider value={service}>{children}</ManifestationsServiceContext.Provider>
}
