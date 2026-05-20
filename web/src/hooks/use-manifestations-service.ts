import { useContext } from 'react'

import { ManifestationsServiceContext } from '../contexts/manifestations-service-context'

export function useManifestationsService() {
  const service = useContext(ManifestationsServiceContext)

  if (service === null) {
    throw new Error('ManifestationsServiceProvider is required to use the manifestations service.')
  }

  return service
}
