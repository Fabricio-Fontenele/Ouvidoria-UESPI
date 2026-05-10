import type { User } from '#src/domain/entities/user.js'

export interface UsersRepository {
  findByEmail(email: string): Promise<User | null>
  save(user: User): Promise<void>
}
