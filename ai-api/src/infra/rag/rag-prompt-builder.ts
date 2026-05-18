import type { AiChatHistoryMessage } from '../../application/dtos/ai-chat-request.js'
import type { CatalogContext } from '../../application/ports/catalog-context.js'
import type { RetrievedChunk } from '../../application/ports/knowledge-retriever.js'

interface BuildPromptInput {
  history: AiChatHistoryMessage[]
  message: string
  contextChunks: RetrievedChunk[]
  catalog: CatalogContext
}

export class RagPromptBuilder {
  build({ history, message, contextChunks, catalog }: BuildPromptInput): {
    systemPrompt: string
    userPrompt: string
  } {
    const systemPrompt = [
      'Você é o assistente da Ouvidoria da UESPI. Sua função é (1) responder dúvidas institucionais com base estrita nos trechos oficiais fornecidos no CONTEXTO e (2) ajudar o manifestante a montar o rascunho (draft) de uma manifestação quando ele descrever um problema, sugestão, elogio ou denúncia.',
      '',
      'Regras invioláveis:',
      '- NUNCA registre uma manifestação você mesmo. Você apenas sugere um draft que a API principal vai validar.',
      '- Responda SEMPRE em português do Brasil.',
      '- Use o CONTEXTO apenas para responder dúvidas institucionais. Se a mensagem for uma descrição de problema/manifestação, ignore o contexto e foque em extrair o draft.',
      '- Se a informação institucional não estiver no CONTEXTO, diga claramente que não tem essa informação. Não invente.',
      '- Para preencher `draft.campusId` e `draft.administrativeUnitId`, USE EXCLUSIVAMENTE os ids listados em CATÁLOGO. Se não tiver certeza, devolva `null` para o campo correspondente.',
      '- Para `draft.type`, use apenas: `report` (denúncia), `complaint` (reclamação), `suggestion` (sugestão), `compliment` (elogio).',
      '- `missingFields` deve listar quais dos campos obrigatórios (`type`, `campusId`, `administrativeUnitId`, `description`) ainda faltam para abrir a manifestação. Se o intent não envolve manifestação, devolva [].',
      '- `shouldOpenManifestationDraft` só pode ser `true` quando o intent for `manifestation_draft_ready` E todos os campos obrigatórios estiverem preenchidos.',
      '- `confidence` é sua confiança no intent (0 a 1). Se baixa, prefira `unknown` ou `out_of_scope`.',
      '',
      'Classificação de intent (use exatamente um destes valores):',
      '- `institutional_question`: dúvida sobre regras, prazos, canais, regimento ou procedimentos da Ouvidoria/UESPI.',
      '- `manifestation_candidate`: o usuário descreveu um problema/sugestão/elogio, mas ainda faltam campos obrigatórios para abrir o draft.',
      '- `manifestation_draft_ready`: o draft tem todos os campos obrigatórios preenchidos e validados contra o catálogo.',
      '- `out_of_scope`: assunto fora da ouvidoria (ex.: matemática, política, conversa social).',
      '- `unknown`: você não conseguiu classificar com segurança.',
      '',
      this.renderCatalog(catalog),
      '',
      this.renderContext(contextChunks),
    ].join('\n')

    const userPrompt = [this.renderHistory(history), '', `MENSAGEM ATUAL DO USUÁRIO:\n${message.trim()}`].join('\n')

    return { systemPrompt, userPrompt }
  }

  private renderCatalog(catalog: CatalogContext): string {
    if (catalog.campuses.length === 0) {
      return 'CATÁLOGO: (vazio — informe ao usuário que o catálogo institucional não está disponível agora.)'
    }

    const lines: string[] = ['CATÁLOGO (use APENAS estes ids):']
    for (const campus of catalog.campuses) {
      lines.push(`- Campus id=${campus.id} label="${campus.label}"`)
      const units = catalog.administrativeUnits.filter((unit) => unit.campusId === campus.id)
      for (const unit of units) {
        lines.push(`  · Unidade administrativa id=${unit.id} label="${unit.label}"`)
      }
    }
    return lines.join('\n')
  }

  private renderContext(chunks: RetrievedChunk[]): string {
    if (chunks.length === 0) {
      return 'CONTEXTO: (nenhum trecho oficial recuperado para esta pergunta.)'
    }

    const blocks = chunks.map((chunk, index) => {
      const sourceTag = chunk.source === null ? '' : ` (fonte: ${chunk.source})`
      return `[Trecho ${index + 1}${sourceTag}]\n${chunk.content.trim()}`
    })

    return `CONTEXTO (trechos oficiais recuperados):\n${blocks.join('\n\n')}`
  }

  private renderHistory(history: AiChatHistoryMessage[]): string {
    if (history.length === 0) {
      return 'HISTÓRICO: (primeira mensagem da conversa.)'
    }

    const lines = history.map((entry) => {
      const speaker = entry.role === 'user' ? 'Usuário' : 'Assistente'
      return `${speaker}: ${entry.content.trim()}`
    })

    return `HISTÓRICO DA CONVERSA:\n${lines.join('\n')}`
  }
}
