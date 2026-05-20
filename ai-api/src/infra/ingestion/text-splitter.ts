import { Document } from '@langchain/core/documents'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'

export interface TextSplitterConfig {
  chunkSize: number
  chunkOverlap: number
}

const HEADER_LINE_REGEX = /^(#{1,6})\s+(.+?)\s*$/

interface ParsedHeader {
  depth: number
  text: string
}

interface MarkdownSection {
  headerPath: ParsedHeader[]
  body: string
}

function parseMarkdownSections(text: string): MarkdownSection[] {
  const lines = text.split(/\r?\n/)
  const sections: MarkdownSection[] = []
  const stack: ParsedHeader[] = []
  let buffer: string[] = []

  const flush = (): void => {
    const body = buffer.join('\n').trim()
    if (body.length > 0) {
      sections.push({ headerPath: [...stack], body })
    }
    buffer = []
  }

  for (const line of lines) {
    const match = HEADER_LINE_REGEX.exec(line)
    if (match !== null) {
      flush()
      const depth = match[1]?.length ?? 0
      const headerText = `${match[1] ?? ''} ${match[2] ?? ''}`
      while (stack.length > 0 && (stack[stack.length - 1]?.depth ?? 0) >= depth) {
        stack.pop()
      }
      stack.push({ depth, text: headerText })
    } else {
      buffer.push(line)
    }
  }
  flush()
  return sections
}

function renderHeaderPrefix(headerPath: ParsedHeader[]): string {
  if (headerPath.length === 0) {
    return ''
  }
  return headerPath.map((entry) => entry.text).join('\n') + '\n\n'
}

class HeaderAwareTextSplitter {
  constructor(private readonly base: RecursiveCharacterTextSplitter) {}

  async splitDocuments(documents: Document[]): Promise<Document[]> {
    const out: Document[] = []
    for (const doc of documents) {
      const sections = parseMarkdownSections(doc.pageContent)
      if (sections.length === 0) {
        const plainChunks = await this.base.splitText(doc.pageContent)
        for (const content of plainChunks) {
          out.push(
            new Document({
              pageContent: content,
              metadata: { ...doc.metadata },
            }),
          )
        }
        continue
      }
      for (const section of sections) {
        const subChunks = await this.base.splitText(section.body)
        const prefix = renderHeaderPrefix(section.headerPath)
        for (const sub of subChunks) {
          out.push(
            new Document({
              pageContent: prefix + sub,
              metadata: { ...doc.metadata },
            }),
          )
        }
      }
    }
    return out
  }
}

export function createTextSplitter(
  config: TextSplitterConfig = { chunkSize: 400, chunkOverlap: 0 },
): HeaderAwareTextSplitter {
  const base = new RecursiveCharacterTextSplitter({
    chunkSize: config.chunkSize,
    chunkOverlap: config.chunkOverlap,
    separators: ['\n\n', '\n', ' ', ''],
  })
  return new HeaderAwareTextSplitter(base)
}
