export const MANIFESTATIONS_PAGE_SIZE = 20

export interface PaginationParams {
  page: number
}

export interface PaginationMetadata {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export function buildManifestationsPaginationMetadata(page: number, totalItems: number): PaginationMetadata {
  return {
    page,
    pageSize: MANIFESTATIONS_PAGE_SIZE,
    totalItems,
    totalPages: Math.ceil(totalItems / MANIFESTATIONS_PAGE_SIZE),
  }
}
