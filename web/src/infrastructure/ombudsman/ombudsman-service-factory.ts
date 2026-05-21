import type { OmbudsmanService } from '../../application/ombudsman/ombudsman-service'

import { HttpOmbudsmanService } from './http-ombudsman-service'

export function makeOmbudsmanService(): OmbudsmanService {
  return new HttpOmbudsmanService()
}
