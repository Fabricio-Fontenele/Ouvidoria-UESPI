export interface CatalogCampusItemDTO {
  id: string
  label: string
}

export interface CatalogAdministrativeUnitItemDTO extends CatalogCampusItemDTO {
  campusId: string
  description: string | null
}

export interface PublicCatalogAdministrativeUnitDTO {
  id: string
  label: string
  description: string | null
}

export interface PublicCatalogCampusDTO {
  id: string
  label: string
  city: string | null
  administrativeUnits: PublicCatalogAdministrativeUnitDTO[]
}

export interface PublicCatalogDTO {
  campuses: PublicCatalogCampusDTO[]
}

export interface CatalogCampusRecordDTO {
  id: string
  name: string
  city: string | null
  isActive: boolean
}

export interface CatalogAdministrativeUnitRecordDTO {
  id: string
  name: string
  description: string | null
  campusId: string
  isActive: boolean
}
