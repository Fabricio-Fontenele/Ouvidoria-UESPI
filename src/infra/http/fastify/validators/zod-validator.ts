import type { ZodType } from 'zod'

import type { ValidationResult, Validator } from '#src/presentation/protocols/validator.js'

export class ValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class ZodValidator<T> implements Validator<T> {
  constructor(private readonly schema: ZodType<T>) {}

  validate(input: unknown): ValidationResult<T> {
    const result = this.schema.safeParse(input)

    if (result.success) {
      return { success: true, data: result.data }
    }

    const message = result.error.issues
      .map((issue) => `${issue.path.join('.') || '<root>'}: ${issue.message}`)
      .join('; ')

    return { success: false, error: new ValidationError(message) }
  }
}
