import type { GuaraChatMode, GuaraChatSuggestion, GuaraMessage } from './guara-chat-types'

type GuaraChatContent = Record<
  GuaraChatMode,
  {
    initialMessages: GuaraMessage[]
    suggestions: GuaraChatSuggestion[]
  }
>

const guaraChatContent: GuaraChatContent = {
  general: {
    initialMessages: [
      {
        author: 'guara',
        id: 'general-welcome',
        text: 'Olá, eu sou o Guará. Posso ajudar você a registrar uma manifestação, consultar orientações ou entender o andamento de um chamado.',
      },
    ],
    suggestions: [
      {
        id: 'general-register-manifestation',
        label: 'Registrar manifestação',
        message: 'Quero registrar uma manifestação e preciso de ajuda para organizar as informações.',
      },
      {
        id: 'general-manifestation-types',
        label: 'Tipos de manifestação',
        message: 'Explique os tipos de manifestação disponíveis na Ouvidoria.',
      },
      {
        id: 'general-anonymous-report',
        label: 'Falar anonimamente',
        message: 'Quero entender como funciona uma manifestação anônima.',
      },
    ],
  },
  'manifestation-detail': {
    initialMessages: [
      {
        author: 'guara',
        id: 'detail-welcome',
        text: 'Encontrei este chamado. Você pode me perguntar sobre o histórico, próximos passos ou pedir ajuda para escrever uma nova mensagem para a Ouvidoria.',
      },
      {
        author: 'user',
        id: 'detail-user-example',
        text: 'Quero entender o que ainda falta para a resposta final.',
      },
      {
        author: 'guara',
        id: 'detail-answer-example',
        text: 'Pelo status atual, a manifestação ainda está em análise pela área responsável. Quando houver resposta, ela aparecerá no histórico do protocolo.',
      },
    ],
    suggestions: [
      {
        id: 'detail-summarize-progress',
        label: 'Resumir andamento',
        message: 'Resuma o andamento desta manifestação.',
      },
      {
        id: 'detail-prepare-message',
        label: 'Preparar mensagem',
        message: 'Ajude-me a preparar uma nova mensagem para complementar esta manifestação.',
      },
      {
        id: 'detail-explain-status',
        label: 'Explicar status',
        message: 'Explique o status atual desta manifestação e quais são os próximos passos.',
      },
    ],
  },
  'new-manifestation': {
    initialMessages: [
      {
        author: 'guara',
        id: 'new-manifestation-welcome',
        text: 'Olá, eu sou o Guará. Posso ajudar você a organizar as informações antes de registrar uma manifestação na Ouvidoria.',
      },
    ],
    suggestions: [
      {
        id: 'new-start-registration',
        label: 'Registrar manifestação',
        message: 'Quero registrar uma manifestação e preciso de ajuda para começar.',
      },
      {
        id: 'new-choose-type',
        label: 'Escolher tipo',
        message: 'Ajude-me a escolher o tipo correto para a minha manifestação.',
      },
      {
        id: 'new-describe-problem',
        label: 'Organizar relato',
        message: 'Ajude-me a organizar o relato da minha manifestação.',
      },
    ],
  },
}

export function getGuaraInitialMessages(mode: GuaraChatMode) {
  return guaraChatContent[mode].initialMessages
}

export function getGuaraSuggestions(mode: GuaraChatMode) {
  return guaraChatContent[mode].suggestions
}
