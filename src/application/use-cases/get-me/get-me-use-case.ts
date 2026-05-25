import type {
  AttendantRatingSummary,
  ManifestationEvaluationsRepository,
} from '#src/application/repositories/manifestation-evaluations-repository.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { UserRole } from '#src/domain/entities/user.js'

import type { UseCase } from '../use-case.js'
import { UserNotFoundError } from './errors/user-not-found-error.js'

interface GetMeInput {
  userId: string
}

interface GetMeOutput {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    createdAt: Date
    attendanceRating: AttendantRatingSummary | null
  }
}

const ATTENDANT_ROLES: ReadonlySet<UserRole> = new Set([UserRole.OMBUDSMAN, UserRole.ADMIN])

export class GetMeUseCase implements UseCase<GetMeInput, GetMeOutput> {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly manifestationEvaluationsRepository: ManifestationEvaluationsRepository,
  ) {}

  async execute({ userId }: GetMeInput): Promise<GetMeOutput> {
    const user = await this.usersRepository.findById(userId)

    if (user === null) {
      throw new UserNotFoundError()
    }

    const attendanceRating = ATTENDANT_ROLES.has(user.role)
      ? await this.manifestationEvaluationsRepository.getRatingSummaryByAttendantUserId(user.id.toString())
      : null

    return {
      user: {
        id: user.id.toString(),
        name: user.name.getValue(),
        email: user.email.getValue(),
        role: user.role,
        createdAt: user.createdAt,
        attendanceRating,
      },
    }
  }
}
