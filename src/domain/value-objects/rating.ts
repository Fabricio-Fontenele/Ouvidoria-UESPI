export class InvalidRatingError extends Error {
  constructor() {
    super('Rating must be an integer between 1 and 5.')
    this.name = 'InvalidRatingError'
  }
}

export class Rating {
  private constructor(private readonly value: number) {}

  static create(value: number): Rating {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
      throw new InvalidRatingError()
    }

    return new Rating(value)
  }

  getValue(): number {
    return this.value
  }
}
