export interface CatalogCampus {
  id: string
  label: string
}

export interface CatalogAdministrativeUnit {
  id: string
  label: string
  campusId: string
  description: string | null
}

export interface CatalogContext {
  campuses: CatalogCampus[]
  administrativeUnits: CatalogAdministrativeUnit[]
}
