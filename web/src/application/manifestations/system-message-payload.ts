export interface SystemMessagePayload {
  kind: string
  [key: string]: unknown
}

export function parseSystemMessagePayload(content: string): SystemMessagePayload | null {
  try {
    const parsed: unknown = JSON.parse(content)

    if (typeof parsed !== 'object' || parsed === null) {
      return null
    }

    const kind = (parsed as { kind?: unknown }).kind

    if (typeof kind !== 'string' || kind.length === 0) {
      return null
    }

    return parsed as SystemMessagePayload
  } catch {
    return null
  }
}
