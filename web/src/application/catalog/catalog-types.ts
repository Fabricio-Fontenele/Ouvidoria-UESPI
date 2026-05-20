export interface AdministrativeUnit {
  id: string
  label: string
}

export interface Campus {
  administrativeUnits: AdministrativeUnit[]
  city: string | null
  id: string
  label: string
}

export interface Catalog {
  campuses: Campus[]
}
