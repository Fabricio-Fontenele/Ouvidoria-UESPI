import { readdir, readFile, stat } from 'node:fs/promises'
import { extname, join, relative, resolve } from 'node:path'

import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf'
import { Document } from '@langchain/core/documents'

export interface LoadedDocument {
  document: Document
  source: string
}

export async function loadKnowledgeBaseDocuments(kbDir: string): Promise<LoadedDocument[]> {
  const absoluteRoot = resolve(kbDir)
  const files = await collectSupportedFiles(absoluteRoot)
  const loaded: LoadedDocument[] = []

  for (const filePath of files) {
    const sourceLabel = relative(absoluteRoot, filePath)
    const ext = extname(filePath).toLowerCase()

    if (ext === '.pdf') {
      const docs = await new PDFLoader(filePath).load()
      for (const doc of docs) {
        loaded.push({
          document: stampSource(doc, sourceLabel),
          source: sourceLabel,
        })
      }
      continue
    }

    if (ext === '.md' || ext === '.txt') {
      const content = await readFile(filePath, 'utf-8')
      const doc = new Document({ pageContent: content, metadata: { source: sourceLabel } })
      loaded.push({ document: doc, source: sourceLabel })
      continue
    }
  }

  return loaded
}

async function collectSupportedFiles(rootDir: string): Promise<string[]> {
  const stack: string[] = [rootDir]
  const files: string[] = []

  while (stack.length > 0) {
    const dir = stack.pop()
    if (dir === undefined) {
      continue
    }
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
        continue
      }
      if (!entry.isFile()) {
        continue
      }
      const ext = extname(entry.name).toLowerCase()
      if (ext === '.pdf' || ext === '.md' || ext === '.txt') {
        files.push(full)
      }
    }
  }

  files.sort()
  return files
}

function stampSource(document: Document, source: string): Document {
  const metadata = { ...(document.metadata ?? {}), source }
  return new Document({ pageContent: document.pageContent, metadata })
}

export async function knowledgeBaseDirectoryExists(kbDir: string): Promise<boolean> {
  try {
    const info = await stat(kbDir)
    return info.isDirectory()
  } catch {
    return false
  }
}
