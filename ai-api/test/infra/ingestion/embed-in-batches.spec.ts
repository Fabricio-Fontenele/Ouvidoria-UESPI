import { describe, expect, it, vi } from 'vitest'

import { embedInBatches } from '../../../src/infra/ingestion/embed-in-batches.js'

const DIMS = 3

function makeTexts(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `text-${String(i)}`)
}

function indexOf(text: string): number {
  return Number(text.replace('text-', ''))
}

describe('embedInBatches', () => {
  it('preserves global order across batches and emits no warn on a clean run', async () => {
    const texts = makeTexts(50)
    const embedDocuments = vi.fn(async (batchTexts: string[]) =>
      batchTexts.map((t) => {
        const i = indexOf(t)
        return [i, i, i]
      }),
    )
    const logger = { warn: vi.fn() }

    const vectors = await embedInBatches({ embedDocuments }, texts, {
      batchSize: 20,
      maxRetries: 3,
      dims: DIMS,
      logger,
    })

    expect(vectors).toHaveLength(50)
    for (let k = 0; k < 50; k += 1) {
      expect(vectors[k]).toEqual([k, k, k])
    }
    expect(embedDocuments).toHaveBeenCalledTimes(3)
    expect(embedDocuments.mock.calls[0]?.[0]).toHaveLength(20)
    expect(embedDocuments.mock.calls[1]?.[0]).toHaveLength(20)
    expect(embedDocuments.mock.calls[2]?.[0]).toHaveLength(10)
    expect(logger.warn).not.toHaveBeenCalled()
  })

  it('retries items that come back with dim=0 and writes the retry result to the original slot', async () => {
    const texts = makeTexts(10)
    let firstBatchSeen = false
    const embedDocuments = vi.fn(async (batchTexts: string[]) => {
      if (!firstBatchSeen) {
        firstBatchSeen = true
        return batchTexts.map((t) => {
          const i = indexOf(t)
          if (i === 5) return [] as number[]
          return [i, i, i]
        })
      }
      return batchTexts.map((t) => {
        const i = indexOf(t)
        return [i, i, i]
      })
    })
    const logger = { warn: vi.fn() }

    const vectors = await embedInBatches({ embedDocuments }, texts, {
      batchSize: 10,
      maxRetries: 3,
      dims: DIMS,
      logger,
    })

    expect(vectors).toHaveLength(10)
    expect(vectors[5]).toEqual([5, 5, 5])
    for (let k = 0; k < 10; k += 1) {
      expect(vectors[k]).toEqual([k, k, k])
    }
    expect(embedDocuments).toHaveBeenCalledTimes(2)
    expect(embedDocuments.mock.calls[1]?.[0]).toEqual(['text-5'])
    expect(logger.warn).toHaveBeenCalledTimes(1)
  })

  it('aborts with a clear error when an item keeps failing after maxRetries', async () => {
    const texts = makeTexts(10)
    const embedDocuments = vi.fn(async (batchTexts: string[]) =>
      batchTexts.map((t) => {
        const i = indexOf(t)
        if (i === 7) return [] as number[]
        return [i, i, i]
      }),
    )

    await expect(
      embedInBatches({ embedDocuments }, texts, {
        batchSize: 10,
        maxRetries: 2,
        dims: DIMS,
      }),
    ).rejects.toThrow(/failed to embed 1 chunks after 2 retries/)

    expect(embedDocuments).toHaveBeenCalledTimes(3)
    expect(embedDocuments.mock.calls[1]?.[0]).toEqual(['text-7'])
    expect(embedDocuments.mock.calls[2]?.[0]).toEqual(['text-7'])
  })

  it('fails immediately when a vector returns with a non-zero wrong dimension', async () => {
    const texts = makeTexts(5)
    const embedDocuments = vi.fn(async (batchTexts: string[]) =>
      batchTexts.map((t) => {
        const i = indexOf(t)
        if (i === 2) return [0, 1]
        return [i, i, i]
      }),
    )

    await expect(
      embedInBatches({ embedDocuments }, texts, {
        batchSize: 5,
        maxRetries: 3,
        dims: DIMS,
      }),
    ).rejects.toThrow(/dimension mismatch for item 2: expected 3, got 2/)

    expect(embedDocuments).toHaveBeenCalledTimes(1)
  })

  it('fails immediately when the provider returns a different number of vectors than texts sent', async () => {
    const texts = makeTexts(20)
    const embedDocuments = vi.fn(async (batchTexts: string[]) =>
      batchTexts.slice(0, batchTexts.length - 1).map((t) => {
        const i = indexOf(t)
        return [i, i, i]
      }),
    )

    await expect(
      embedInBatches({ embedDocuments }, texts, {
        batchSize: 20,
        maxRetries: 3,
        dims: DIMS,
      }),
    ).rejects.toThrow(/embedding count mismatch: expected 20, got 19/)

    expect(embedDocuments).toHaveBeenCalledTimes(1)
  })
})
