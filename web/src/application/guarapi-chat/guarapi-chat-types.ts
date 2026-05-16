export type GuarapiChatMode = 'general' | 'new-manifestation' | 'manifestation-detail'

export type GuarapiMessageAuthor = 'guarapi' | 'user'

export interface GuarapiMessage {
  author: GuarapiMessageAuthor
  id: string
  text: string
}

export interface GuarapiChatContext {
  mode: GuarapiChatMode
  protocol: string | null
}

export interface SendGuarapiMessageInput {
  context: GuarapiChatContext
  message: string
  previousMessages: GuarapiMessage[]
}

export interface SendGuarapiMessageOutput {
  message: GuarapiMessage
}
