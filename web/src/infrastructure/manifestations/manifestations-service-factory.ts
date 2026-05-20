import type { ManifestationsService } from '../../application/manifestations/manifestations-service'
import { HttpManifestationsService } from './http-manifestations-service'

export function makeManifestationsService(): ManifestationsService {
  return new HttpManifestationsService()
}
