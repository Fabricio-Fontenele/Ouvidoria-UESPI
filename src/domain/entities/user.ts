import { Entity } from './entity.js'
import type { Email } from '../value-objects/email.js'
import type { Name } from '../value-objects/name.js'
import type { UniqueEntityId } from '../value-objects/unique-entity-id.js'

export enum UserRole {
  PROTESTER = 'protester',
  Ombudsman = 'ombudsman',
  ADMIN = 'admin',
}

interface UserProps {
  name: Name
  email: Email
  passwordHash: string
  role: UserRole
  createdAt: Date
}

interface CreateUserProps {
  name: Name
  email: Email
  passwordHash: string
  role: UserRole
  createdAt?: Date
}

export class User extends Entity<UserProps> {
  static create(props: CreateUserProps, id?: UniqueEntityId) {
    const createdAt = props.createdAt ?? new Date()
    return new User({ ...props, createdAt }, id)
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

  get createdAt(): Date {
    return this.props.createdAt
  }
}
