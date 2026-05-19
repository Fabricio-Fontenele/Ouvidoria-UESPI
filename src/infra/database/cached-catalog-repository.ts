import type {
  CatalogAdministrativeUnitRecordDTO,
  CatalogCampusRecordDTO,
  PublicCatalogDTO,
} from '#src/application/dto/catalog-dtos.js'
import type { CatalogRepository } from '#src/application/repositories/catalog-repository.js'

interface Clock {
  now: () => number
}

const DEFAULT_CLOCK: Clock = {
  now: () => Date.now(),
}

export class CachedCatalogRepository implements CatalogRepository {
  private cache: { data: PublicCatalogDTO; expiresAt: number } | null = null

  constructor(
    private readonly inner: CatalogRepository,
    private readonly ttlMs: number,
    private readonly clock: Clock = DEFAULT_CLOCK,
  ) {}

  async listPublic(): Promise<PublicCatalogDTO> {
    const now = this.clock.now()
    if (this.cache !== null && this.cache.expiresAt > now) {
      return this.cache.data
    }
    const data = await this.inner.listPublic()
    this.cache = { data, expiresAt: now + this.ttlMs }
    return data
  }

  async findCampusById(id: string): Promise<CatalogCampusRecordDTO | null> {
    return this.inner.findCampusById(id)
  }

  async findAdministrativeUnitById(id: string): Promise<CatalogAdministrativeUnitRecordDTO | null> {
    return this.inner.findAdministrativeUnitById(id)
  }

  invalidate(): void {
    this.cache = null
  }
}
