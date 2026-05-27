import type { User } from '#src/domain/entities/user.js'

export interface AdministrativeUnitResponsiblesRepository {
  findUsersByAdministrativeUnitId(administrativeUnitId: string): Promise<User[]>
  findAdministrativeUnitIdsByUserId(userId: string): Promise<string[]>
  saveResponsible(userId: string, administrativeUnitId: string): Promise<void>
  removeResponsible(userId: string, administrativeUnitId: string): Promise<void>
}
