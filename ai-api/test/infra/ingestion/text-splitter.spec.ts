import { Document } from '@langchain/core/documents'
import { describe, expect, it } from 'vitest'

import { createTextSplitter } from '../../../src/infra/ingestion/text-splitter.js'

describe('createTextSplitter (header-aware)', () => {
  it('prepends the parent article header to every chunk produced from its body', async () => {
    const splitter = createTextSplitter({ chunkSize: 200, chunkOverlap: 0 })
    const md = [
      '#### Art. 15',
      '',
      'Os procedimentos administrativos relativos à análise das manifestações observarão os princípios da eficiência e da celeridade.',
      '',
      '§ 1º A Ouvidoria encaminhará a decisão administrativa final ao usuário, observado o prazo de trinta dias, prorrogável de forma justificada uma única vez, por igual período.',
    ].join('\n')

    const chunks = await splitter.splitDocuments([
      new Document({ pageContent: md, metadata: { source: 'resolucao.md' } }),
    ])

    expect(chunks.length).toBeGreaterThanOrEqual(1)
    for (const chunk of chunks) {
      expect(chunk.pageContent.startsWith('#### Art. 15')).toBe(true)
      expect(chunk.metadata).toStrictEqual({ source: 'resolucao.md' })
    }
    expect(chunks.some((chunk) => chunk.pageContent.includes('trinta dias'))).toBe(true)
  })

  it('preserves the full hierarchy of nested headers in the prefix', async () => {
    const splitter = createTextSplitter({ chunkSize: 400, chunkOverlap: 0 })
    const md = [
      '## Capítulo II - Do Procedimento',
      '',
      '### Seção II - Das denúncias',
      '',
      '#### Art. 6º',
      '',
      'A denúncia recebida será tratada caso contenha elementos mínimos descritivos da irregularidade.',
    ].join('\n')

    const chunks = await splitter.splitDocuments([
      new Document({ pageContent: md, metadata: { source: 'resolucao.md' } }),
    ])

    expect(chunks).toHaveLength(1)
    const prefix = chunks[0]?.pageContent ?? ''
    expect(prefix).toContain('## Capítulo II - Do Procedimento')
    expect(prefix).toContain('### Seção II - Das denúncias')
    expect(prefix).toContain('#### Art. 6º')
    expect(prefix).toContain('A denúncia recebida')
  })

  it('pops sibling headers when a new header at the same depth opens', async () => {
    const splitter = createTextSplitter({ chunkSize: 400, chunkOverlap: 0 })
    const md = [
      '#### Art. 13',
      '',
      'A manifestação conterá a identificação do requerente.',
      '',
      '#### Art. 14',
      '',
      'Em nenhuma hipótese, será recusado pela Ouvidoria o recebimento de manifestações.',
    ].join('\n')

    const chunks = await splitter.splitDocuments([
      new Document({ pageContent: md, metadata: { source: 'resolucao.md' } }),
    ])

    const art13Chunk = chunks.find((chunk) => chunk.pageContent.includes('identificação do requerente'))
    const art14Chunk = chunks.find((chunk) => chunk.pageContent.includes('recusado pela Ouvidoria'))

    expect(art13Chunk?.pageContent.startsWith('#### Art. 13')).toBe(true)
    expect(art13Chunk?.pageContent.includes('#### Art. 14')).toBe(false)
    expect(art14Chunk?.pageContent.startsWith('#### Art. 14')).toBe(true)
    expect(art14Chunk?.pageContent.includes('#### Art. 13')).toBe(false)
  })

  it('falls back to a plain recursive split when the document has no headers', async () => {
    const splitter = createTextSplitter({ chunkSize: 200, chunkOverlap: 0 })
    const md = [
      'This is a paragraph without any markdown header.',
      '',
      'And here is a second paragraph that should be split eventually.',
    ].join('\n')

    const chunks = await splitter.splitDocuments([new Document({ pageContent: md, metadata: { source: 'plain.txt' } })])

    expect(chunks.length).toBeGreaterThanOrEqual(1)
    for (const chunk of chunks) {
      expect(chunk.pageContent.startsWith('#')).toBe(false)
    }
  })
})
