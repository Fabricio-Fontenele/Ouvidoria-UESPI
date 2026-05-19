export type GuaraChatMode = 'general' | 'new-manifestation' | 'manifestation-detail'

export type GuaraMessageAuthor = 'guara' | 'user'

export interface GuaraMessage {
  author: GuaraMessageAuthor
  id: string
  text: string
}

export interface GuaraChatContext {
  mode: GuaraChatMode
  protocol: string | null
}

export interface SendGuaraMessageInput {
  context: GuaraChatContext
  message: string
  previousMessages: GuaraMessage[]
}

export interface SendGuaraMessageOutput {
  message: GuaraMessage
}
