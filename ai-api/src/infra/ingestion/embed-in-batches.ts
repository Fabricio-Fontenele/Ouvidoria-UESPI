export interface EmbedInBatchesOptions {
  batchSize: number
  /** Number of extra retry attempts after the first batch attempt. */
  maxRetries: number
  dims: number
  logger?: { warn: (message: string) => void }
}

export interface IngestionEmbeddingsLike {
  embedDocuments: (texts: string[]) => Promise<number[][]>
}

const RETRY_BASE_DELAY_MS = 250

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

function assertCountMatches(received: number, expected: number): void {
  if (received !== expected) {
    throw new Error(`[ingest] embedding count mismatch: expected ${String(expected)}, got ${String(received)}`)
  }
}

function assertNonZeroDimensionMatches(vector: number[], dims: number, globalIndex: number): void {
  if (vector.length !== 0 && vector.length !== dims) {
    throw new Error(
      `[ingest] embedding dimension mismatch for item ${String(globalIndex)}: expected ${String(dims)}, got ${String(vector.length)}`,
    )
  }
}

export async function embedInBatches(
  embeddings: IngestionEmbeddingsLike,
  texts: string[],
  options: EmbedInBatchesOptions,
): Promise<number[][]> {
  const { batchSize, maxRetries, dims, logger } = options
  const vectors: number[][] = new Array<number[]>(texts.length)
  const pending: number[] = []

  for (let start = 0; start < texts.length; start += batchSize) {
    const end = Math.min(start + batchSize, texts.length)
    const batchTexts = texts.slice(start, end)
    const batchVectors = await embeddings.embedDocuments(batchTexts)
    assertCountMatches(batchVectors.length, batchTexts.length)

    for (let i = 0; i < batchTexts.length; i += 1) {
      const globalIndex = start + i
      const vector = batchVectors[i]
      if (vector === undefined) {
        throw new Error(`[ingest] missing embedding for item ${String(globalIndex)}`)
      }
      assertNonZeroDimensionMatches(vector, dims, globalIndex)
      if (vector.length === dims) {
        vectors[globalIndex] = vector
      } else {
        pending.push(globalIndex)
      }
    }
  }

  if (pending.length > 0 && logger !== undefined) {
    logger.warn(
      `[ingest] ${String(pending.length)} chunks returned empty embedding; retrying individually (up to ${String(maxRetries)} attempts each)`,
    )
  }

  const stillPending: number[] = []
  for (const globalIndex of pending) {
    const text = texts[globalIndex]
    if (text === undefined) {
      throw new Error(`[ingest] missing text for pending index ${String(globalIndex)}`)
    }
    let succeeded = false
    for (let attempt = 0; attempt < maxRetries; attempt += 1) {
      await sleep(RETRY_BASE_DELAY_MS * 2 ** attempt)
      const retryVectors = await embeddings.embedDocuments([text])
      assertCountMatches(retryVectors.length, 1)
      const vector = retryVectors[0]
      if (vector === undefined) {
        throw new Error(`[ingest] missing embedding on retry for item ${String(globalIndex)}`)
      }
      assertNonZeroDimensionMatches(vector, dims, globalIndex)
      if (vector.length === dims) {
        vectors[globalIndex] = vector
        succeeded = true
        break
      }
    }
    if (!succeeded) {
      stillPending.push(globalIndex)
    }
  }

  if (stillPending.length > 0) {
    throw new Error(
      `[ingest] failed to embed ${String(stillPending.length)} chunks after ${String(maxRetries)} retries (silent-fail). Reduce RAG_EMBEDDING_BATCH_SIZE or increase RAG_EMBEDDING_MAX_RETRIES.`,
    )
  }

  return vectors
}
