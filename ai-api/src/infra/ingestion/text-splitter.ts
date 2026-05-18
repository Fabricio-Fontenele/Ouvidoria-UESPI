import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export interface TextSplitterConfig {
  chunkSize: number
  chunkOverlap: number
}

export function createTextSplitter(
  config: TextSplitterConfig = { chunkSize: 400, chunkOverlap: 0 },
): RecursiveCharacterTextSplitter {
  return new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ['\n\n', '\n', ' ', ''],
  })
}
