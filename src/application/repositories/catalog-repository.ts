import type {
  CatalogAdministrativeUnitRecordDTO,
  CatalogCampusRecordDTO,
  PublicCatalogDTO,
} from '../dto/catalog-dtos.js'

export interface CatalogRepository {
  listPublic(): Promise<PublicCatalogDTO>
  findCampusById(id: string): Promise<CatalogCampusRecordDTO | null>
  findAdministrativeUnitById(id: string): Promise<CatalogAdministrativeUnitRecordDTO | null>
}
