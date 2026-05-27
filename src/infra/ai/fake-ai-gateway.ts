import type { AiGateway, AiGatewayChatInput, AiGatewayChatResponse } from '#src/application/ai/ai-gateway.js'
import { ManifestationType } from '#src/domain/entities/manifestation.js'

export class FakeAiGateway implements AiGateway {
  async chat(input: AiGatewayChatInput): Promise<AiGatewayChatResponse> {
    const message = input.message
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')

    if (
      message.includes('reclamacao') ||
      message.includes('reclamar') ||
      message.includes('denuncia') ||
      message.includes('problema')
    ) {
      const campus = input.campuses[0] ?? null
      const administrativeUnit =
        campus === null ? null : (input.administrativeUnits.find((unit) => unit.campusId === campus.id) ?? null)

      return {
        answer: 'Entendi. Posso te ajudar a abrir uma manifestação com base nas informações fornecidas.',
        intent: 'manifestation_draft_ready',
        shouldOpenManifestationDraft: true,
        draft: {
          type: ManifestationType.COMPLAINT,
          campusId: campus?.id ?? null,
          administrativeUnitId: administrativeUnit?.id ?? null,
          description: input.message,
          involvedPeople: null,
        },
        missingFields: [],
        confidence: 0.8,
        suggestions: [
          { id: 'fake-confirm-open', label: 'Sim, quero abrir', message: 'Sim, pode abrir a manifestação.' },
          {
            id: 'fake-refine',
            label: 'Ajustar informações',
            message: 'Gostaria de ajustar algumas informações antes de abrir.',
          },
        ],
      }
    }

    if (message.includes('status') || message.includes('protocolo')) {
      return {
        answer: 'Para acompanhar uma manifestação, informe o protocolo e o código de acesso, caso ela seja anônima.',
        intent: 'institutional_question',
        shouldOpenManifestationDraft: false,
        draft: null,
        missingFields: [],
        confidence: 0.7,
        suggestions: [
          {
            id: 'fake-register',
            label: 'Quero registrar algo',
            message: 'Preciso de ajuda para registrar uma manifestação.',
          },
          {
            id: 'fake-types',
            label: 'Tipos de manifestação',
            message: 'Explique os tipos de manifestação disponíveis.',
          },
        ],
      }
    }

    return {
      answer: 'Posso ajudar com dúvidas institucionais ou orientar a abertura de uma manifestação.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.6,
      suggestions: [
        {
          id: 'fake-register',
          label: 'Quero registrar algo',
          message: 'Preciso de ajuda para registrar uma manifestação.',
        },
        { id: 'fake-help', label: 'Dúvida institucional', message: 'Tenho uma dúvida sobre a Ouvidoria.' },
      ],
    }
  }
}
