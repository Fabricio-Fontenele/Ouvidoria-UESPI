import { randomUUID } from 'node:crypto'

export class UniqueEntityId {
  private value: string

  equals(other: UniqueEntityId): boolean {
    return this.value === other.toValue()
  }

  toString() {
    return this.value
  }

  toValue() {
    return this.value
  }

  constructor(value?: string) {
    this.value = value ?? randomUUID()
  }
}
