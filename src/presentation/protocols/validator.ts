export type ValidationResult<T> = { success: true; data: T } | { success: false; error: Error }

export interface Validator<T = unknown> {
  validate(input: unknown): ValidationResult<T>
}
