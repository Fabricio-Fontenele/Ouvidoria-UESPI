import { describe, expect, it } from 'vitest'

import {
  buildLocalDateRangeBounds,
  buildLocalDayRange,
  formatBrazilianShortDate,
  isLocalDateRangeInOrder,
  parseBrazilianShortDateLabel,
} from './date-utils'

describe('date-utils', () => {
  describe('parseBrazilianShortDateLabel', () => {
    it('parses a Brazilian short date label into ISO YYYY-MM-DD', () => {
      expect(parseBrazilianShortDateLabel('02 Set, 2024')).toBe('2024-09-02')
    })

    it('returns null when the label is malformed', () => {
      expect(parseBrazilianShortDateLabel('invalid')).toBeNull()
    })
  })

  describe('formatBrazilianShortDate', () => {
    it('formats an ISO date into the Brazilian short label', () => {
      const formatted = formatBrazilianShortDate('2024-09-02T12:00:00.000Z')
      expect(formatted).toMatch(/^\d{2} Set, 2024$/)
    })

    it('returns the original string when the ISO date is invalid', () => {
      expect(formatBrazilianShortDate('not-a-date')).toBe('not-a-date')
    })
  })

  describe('buildLocalDayRange', () => {
    it('returns ISO bounds that cover the full local day', () => {
      const range = buildLocalDayRange('2024-09-02')

      expect(range).not.toBeNull()
      if (range === null) return

      const from = new Date(range.from)
      const to = new Date(range.to)

      expect(from.getFullYear()).toBe(2024)
      expect(from.getMonth()).toBe(8)
      expect(from.getDate()).toBe(2)
      expect(from.getHours()).toBe(0)
      expect(from.getMinutes()).toBe(0)
      expect(from.getSeconds()).toBe(0)
      expect(from.getMilliseconds()).toBe(0)

      expect(to.getFullYear()).toBe(2024)
      expect(to.getMonth()).toBe(8)
      expect(to.getDate()).toBe(2)
      expect(to.getHours()).toBe(23)
      expect(to.getMinutes()).toBe(59)
      expect(to.getSeconds()).toBe(59)
      expect(to.getMilliseconds()).toBe(999)
    })

    it('keeps the from/to within the same local day even across UTC boundaries', () => {
      const range = buildLocalDayRange('2024-05-15')

      expect(range).not.toBeNull()
      if (range === null) return

      const from = new Date(range.from)
      const to = new Date(range.to)

      expect(from.getDate()).toBe(15)
      expect(to.getDate()).toBe(15)
      expect(to.getTime() - from.getTime()).toBe(86_399_999)
    })

    it('returns null for malformed local date strings', () => {
      expect(buildLocalDayRange('15/05/2024')).toBeNull()
      expect(buildLocalDayRange('')).toBeNull()
      expect(buildLocalDayRange('2024-13-40')).not.toBeNull()
    })
  })

  describe('buildLocalDateRangeBounds', () => {
    it('returns the start of the initial day and the end of the final day', () => {
      const bounds = buildLocalDateRangeBounds({ from: '2024-09-02', to: '2024-09-05' })

      expect(bounds).not.toBeNull()
      if (bounds === null) return

      const from = bounds.from === undefined ? null : new Date(bounds.from)
      const to = bounds.to === undefined ? null : new Date(bounds.to)

      expect(from).not.toBeNull()
      expect(to).not.toBeNull()
      expect(from?.getFullYear()).toBe(2024)
      expect(from?.getMonth()).toBe(8)
      expect(from?.getDate()).toBe(2)
      expect(from?.getHours()).toBe(0)
      expect(from?.getMinutes()).toBe(0)
      expect(to?.getFullYear()).toBe(2024)
      expect(to?.getMonth()).toBe(8)
      expect(to?.getDate()).toBe(5)
      expect(to?.getHours()).toBe(23)
      expect(to?.getMinutes()).toBe(59)
    })

    it('allows open-ended ranges', () => {
      expect(buildLocalDateRangeBounds({ from: '2024-09-02', to: '' })).toStrictEqual({
        from: buildLocalDayRange('2024-09-02')?.from,
      })
      expect(buildLocalDateRangeBounds({ from: '', to: '2024-09-05' })).toStrictEqual({
        to: buildLocalDayRange('2024-09-05')?.to,
      })
    })

    it('returns null when one of the filled dates is malformed', () => {
      expect(buildLocalDateRangeBounds({ from: '02/09/2024', to: '2024-09-05' })).toBeNull()
      expect(buildLocalDateRangeBounds({ from: '2024-09-02', to: '05/09/2024' })).toBeNull()
    })
  })

  describe('isLocalDateRangeInOrder', () => {
    it('accepts empty and chronologically ordered ranges', () => {
      expect(isLocalDateRangeInOrder({ from: '', to: '' })).toBe(true)
      expect(isLocalDateRangeInOrder({ from: '2024-09-02', to: '' })).toBe(true)
      expect(isLocalDateRangeInOrder({ from: '', to: '2024-09-05' })).toBe(true)
      expect(isLocalDateRangeInOrder({ from: '2024-09-02', to: '2024-09-05' })).toBe(true)
      expect(isLocalDateRangeInOrder({ from: '2024-09-05', to: '2024-09-05' })).toBe(true)
    })

    it('rejects a final date before the initial date', () => {
      expect(isLocalDateRangeInOrder({ from: '2024-09-05', to: '2024-09-02' })).toBe(false)
    })
  })
})
