import { Entity } from './entity.js'
import type { Email } from '../value-objects/email.js'
import type { Name } from '../value-objects/name.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

export enum UserRole {
  MANIFESTANT = 'manifestant',
  OMBUDSMAN = 'ombudsman',
  ADMIN = 'admin',
}

interface UserProps {
  name: Name
  email: Email
  passwordHash: string
  role: UserRole
  emailVerifiedAt: Date | null
  emailVerificationCodeHash: string | null
  emailVerificationCodeExpiresAt: Date | null
  passwordResetCodeHash: string | null
  passwordResetCodeExpiresAt: Date | null
  createdAt: Date
}

interface CreateUserProps {
  name: Name
  email: Email
  passwordHash: string
  role: UserRole
  emailVerifiedAt?: Date | null
  emailVerificationCodeHash?: string | null
  emailVerificationCodeExpiresAt?: Date | null
  passwordResetCodeHash?: string | null
  passwordResetCodeExpiresAt?: Date | null
  createdAt?: Date
}

export class User extends Entity<UserProps> {
  static create(props: CreateUserProps, id?: UniqueEntityId) {
    const createdAt = props.createdAt ?? new Date()
    return new User(
      {
        ...props,
        emailVerifiedAt: props.emailVerifiedAt ?? null,
        emailVerificationCodeHash: props.emailVerificationCodeHash ?? null,
        emailVerificationCodeExpiresAt: props.emailVerificationCodeExpiresAt ?? null,
        passwordResetCodeHash: props.passwordResetCodeHash ?? null,
        passwordResetCodeExpiresAt: props.passwordResetCodeExpiresAt ?? null,
        createdAt,
      },
      id,
    )
  }

  get name(): Name {
    return this.props.name
  }

  get email(): Email {
    return this.props.email
  }

  get passwordHash(): string {
    return this.props.passwordHash
  }

  get role(): UserRole {
    return this.props.role
  }

  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt
  }

  get emailVerificationCodeHash(): string | null {
    return this.props.emailVerificationCodeHash
  }

  get emailVerificationCodeExpiresAt(): Date | null {
    return this.props.emailVerificationCodeExpiresAt
  }

  get passwordResetCodeHash(): string | null {
    return this.props.passwordResetCodeHash
  }

  get passwordResetCodeExpiresAt(): Date | null {
    return this.props.passwordResetCodeExpiresAt
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get isEmailVerified(): boolean {
    return this.props.emailVerifiedAt !== null
  }

  startEmailVerification(codeHash: string, expiresAt: Date): void {
    this.props.emailVerificationCodeHash = codeHash
    this.props.emailVerificationCodeExpiresAt = expiresAt
  }

  startPasswordReset(codeHash: string, expiresAt: Date): void {
    this.props.passwordResetCodeHash = codeHash
    this.props.passwordResetCodeExpiresAt = expiresAt
  }

  verifyEmail(verifiedAt = new Date()): void {
    this.props.emailVerifiedAt = verifiedAt
    this.props.emailVerificationCodeHash = null
    this.props.emailVerificationCodeExpiresAt = null
  }

  changePassword(passwordHash: string): void {
    this.props.passwordHash = passwordHash
  }

  clearPasswordReset(): void {
    this.props.passwordResetCodeHash = null
    this.props.passwordResetCodeExpiresAt = null
  }
}
