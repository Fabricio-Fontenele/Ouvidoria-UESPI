import { describe, expect, it } from 'vitest'

import { parseSystemMessagePayload } from './system-message-payload'

describe('parseSystemMessagePayload', () => {
  it('parses a valid payload with kind and arbitrary extra fields', () => {
    const content = JSON.stringify({ fromStatus: 'in_analysis', kind: 'status_changed', toStatus: 'answered' })
    const payload = parseSystemMessagePayload(content)

    expect(payload).not.toBeNull()
    expect(payload?.kind).toBe('status_changed')
    expect(payload?.['fromStatus']).toBe('in_analysis')
    expect(payload?.['toStatus']).toBe('answered')
  })

  it('returns null when the payload has no kind', () => {
    expect(parseSystemMessagePayload(JSON.stringify({ foo: 'bar' }))).toBeNull()
  })

  it('returns null when the payload has an empty kind', () => {
    expect(parseSystemMessagePayload(JSON.stringify({ kind: '' }))).toBeNull()
  })

  it('returns null when content is not valid JSON', () => {
    expect(parseSystemMessagePayload('not a json {')).toBeNull()
  })

  it('returns null when the parsed JSON is not an object', () => {
    expect(parseSystemMessagePayload('null')).toBeNull()
    expect(parseSystemMessagePayload('"a string"')).toBeNull()
    expect(parseSystemMessagePayload('42')).toBeNull()
  })

  it('never throws', () => {
    expect(() => parseSystemMessagePayload('')).not.toThrow()
    expect(() => parseSystemMessagePayload('{')).not.toThrow()
    expect(() => parseSystemMessagePayload('{"kind": null}')).not.toThrow()
  })
})
