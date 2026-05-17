import { InvalidRatingError, Rating } from '#src/domain/value-objects/rating.js'

describe('Rating', () => {
  it.each([1, 2, 3, 4, 5])('accepts integer %i', (value) => {
    expect(Rating.create(value).getValue()).toBe(value)
  })

  it.each([0, 6, -1, 100, 1.5, 3.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects %s', (value) => {
    expect(() => {
      Rating.create(value)
    }).toThrow(InvalidRatingError)
  })
})
