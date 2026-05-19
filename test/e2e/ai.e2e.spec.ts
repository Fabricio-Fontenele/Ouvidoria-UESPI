import { afterEach, beforeAll, describe, expect, it } from 'vitest'

import { getApp, resetDatabase } from './utils/app.js'

describe('AI messages (e2e)', () => {
  beforeAll(async () => {
    await getApp()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('returns a manifestation draft when the message expresses a complaint', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      payload: {
        history: [],
        message: 'Quero fazer uma reclamação sobre o atendimento.',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({
      answer: 'Entendi. Posso te ajudar a abrir uma manifestação com base nas informações fornecidas.',
      intent: 'manifestation_draft_ready',
      shouldOpenManifestationDraft: true,
      draft: {
        type: 'complaint',
        campusId: 'campus-poeta-torquato-neto',
        administrativeUnitId: 'unit-prad-teresina',
        description: 'Quero fazer uma reclamação sobre o atendimento.',
        involvedPeople: null,
      },
      missingFields: [],
      confidence: 0.8,
    })
  })

  it('answers institutional questions without opening a draft', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      payload: {
        history: [],
        message: 'Como acompanho o status do meu protocolo?',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toStrictEqual({
      answer: 'Para acompanhar uma manifestação, informe o protocolo e o código de acesso, caso ela seja anônima.',
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
      missingFields: [],
      confidence: 0.7,
    })
  })

  it('falls back to a generic institutional reply for unrecognized intents', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      payload: {
        history: [],
        message: 'Olá, tudo bem?',
      },
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toMatchObject({
      intent: 'institutional_question',
      shouldOpenManifestationDraft: false,
      draft: null,
    })
  })

  it('rejects empty messages with 400', async () => {
    const app = await getApp()

    const response = await app.inject({
      method: 'POST',
      url: '/ai/messages',
      payload: {
        history: [],
        message: '',
      },
    })

    expect(response.statusCode).toBe(400)
    expect(response.json()).toMatchObject({ error: 'ValidationError' })
  })
})
