/**
 * RAG regression harness — issue #37.
 *
 * Fires a fixed set of normative queries against a running `ai-api` instance and
 * checks (a) the intent classification is `institutional_question` and (b) the
 * answer carries the expected institutional INFORMATION (e.g. the 30-day deadline,
 * the four manifestation types). Literal article citations (e.g. "Art. 15") are
 * `desired`, not `required`: the current prompt deliberately avoids enumerating
 * articles ("sem juridiquês"), so requiring them produced false negatives.
 *
 * Definition of "stable" (issue acceptance criterion):
 *   all 6 queries × 3 rounds = 18 executions must PASS, with zero FAIL/UNSTABLE.
 *
 * Usage:
 *   AI_API_KEY=<key> [AI_API_BASE_URL=http://localhost:4000] [ROUNDS=3] \
 *     pnpm --filter @ouvidoria/ai-api tsx scripts/rag-regression.ts
 *
 * Exit codes:
 *   0 — all 18 PASS (stable)
 *   1 — at least one FAIL (not stable)
 *   2 — configuration error (missing AI_API_KEY, transport error)
 */

import process from 'node:process'

interface RegressionQuery {
  id: string
  question: string
  /** All regexes must match the `answer` for the run to PASS. */
  required: RegExp[]
  /** Logged when missing, but does not flip the verdict. */
  desired?: RegExp[]
  source: string
}

const QUERIES: RegressionQuery[] = [
  {
    id: 'prazo-resposta',
    question: 'Qual o prazo da Ouvidoria responder uma manifestação na UESPI?',
    required: [/trinta dias|30 dias/i],
    desired: [/prorrog/i, /Art\.?\s*15/i],
    source: 'Resolução CONSUN 005/2018 Art. 15 §1º',
  },
  {
    id: 'anonimato-sigilo',
    question: 'A Ouvidoria garante anonimato ou sigilo de quem registra uma manifestação?',
    required: [/anonimat/i, /sigilo/i],
    desired: [/protegid|preservaç|restrit/i, /Art\.?\s*13/i],
    source: 'Resolução CONSUN 005/2018 Art. 13 §1º',
  },
  {
    id: 'tipos-manifestacao',
    question: 'Quais tipos de manifestação a Ouvidoria da UESPI aceita?',
    required: [/denúnci/i, /reclama/i, /sugest/i, /elogi/i],
    desired: [/Art\.?\s*2/i],
    source: 'Resolução CONSUN 005/2018 Art. 2º IV / Lei 13.460/2017',
  },
  {
    id: 'decisao-administrativa-final',
    question: 'O que é a decisão administrativa final em uma manifestação?',
    required: [/final|conclusiv|oficial/i, /decisão|resposta|posiciona|providência|solução/i],
    desired: [/ato administrativo|procedência|improcedência/i, /Art\.?\s*2/i],
    source: 'Resolução CONSUN 005/2018 Art. 2º V',
  },
  {
    id: 'direitos-usuario',
    question: 'Quais são os direitos do usuário de serviço público?',
    required: [/prestação|participa|liberdade de escolha|qualidade|acompanha|não sofrer discrimina/i],
    desired: [/Lei[\s.nº°]*13\.?460/i, /Art\.?\s*6/i],
    source: 'Lei nº 13.460/2017 Art. 6º',
  },
  {
    id: 'acesso-informacao',
    question: 'Como faço para pedir acesso à informação na UESPI?',
    required: [/SIC|Serviço de Informações ao Cidadão|acesso à informação|transparência/i],
    desired: [/Lei[\s.nº°]*12\.?527|Decreto[\s.nº°]*15\.?188/i],
    source: 'Decreto Estadual 15.188/2013 + Lei 12.527/2011',
  },
]

interface AiResponse {
  intent: string
  answer: string
  [key: string]: unknown
}

async function callApi(baseUrl: string, apiKey: string, question: string): Promise<AiResponse> {
  const response = await fetch(`${baseUrl}/ai/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      history: [],
      message: question,
      campuses: [],
      administrativeUnits: [],
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`HTTP ${response.status}: ${text.slice(0, 300)}`)
  }

  return (await response.json()) as AiResponse
}

interface Verdict {
  ok: boolean
  reason: string
  missingRequired: string[]
  missingDesired: string[]
}

function evaluate(result: AiResponse, query: RegressionQuery): Verdict {
  if (result.intent !== 'institutional_question') {
    return {
      ok: false,
      reason: `wrong intent: ${result.intent}`,
      missingRequired: [],
      missingDesired: [],
    }
  }
  const missingRequired = query.required.filter((re) => !re.test(result.answer)).map((re) => re.source)
  const missingDesired = (query.desired ?? []).filter((re) => !re.test(result.answer)).map((re) => re.source)

  if (missingRequired.length > 0) {
    return {
      ok: false,
      reason: `missing required pattern(s): ${missingRequired.join(', ')}`,
      missingRequired,
      missingDesired,
    }
  }
  return { ok: true, reason: 'OK', missingRequired: [], missingDesired }
}

interface RunRecord {
  round: number
  query: RegressionQuery
  verdict: Verdict
  answerExcerpt: string
}

async function runRound(baseUrl: string, apiKey: string, round: number): Promise<RunRecord[]> {
  const records: RunRecord[] = []
  console.log(`--- Round ${round} ---`)
  for (const query of QUERIES) {
    let result: AiResponse
    try {
      result = await callApi(baseUrl, apiKey, query.question)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      records.push({
        round,
        query,
        verdict: { ok: false, reason: `transport error: ${message}`, missingRequired: [], missingDesired: [] },
        answerExcerpt: '',
      })
      console.error(`  ✗ ${query.id} — transport error: ${message}`)
      continue
    }

    const verdict = evaluate(result, query)
    const answerExcerpt = result.answer.slice(0, 220).replace(/\s+/g, ' ').trim()

    records.push({ round, query, verdict, answerExcerpt })

    if (verdict.ok) {
      const desiredNote =
        verdict.missingDesired.length > 0 ? ` (desired missing: ${verdict.missingDesired.join(', ')})` : ''
      console.log(`  ✓ ${query.id}${desiredNote}`)
    } else {
      console.log(`  ✗ ${query.id} — ${verdict.reason}`)
      console.log(`      answer: "${answerExcerpt}${result.answer.length > 220 ? '…' : ''}"`)
    }
  }
  console.log('')
  return records
}

async function main(): Promise<void> {
  const baseUrl = process.env['AI_API_BASE_URL'] ?? 'http://localhost:4000'
  const apiKey = process.env['AI_API_KEY']
  if (apiKey === undefined || apiKey.trim() === '') {
    console.error('AI_API_KEY env var is required (must match the value the ai-api server boots with).')
    process.exit(2)
  }
  const roundsRaw = process.env['ROUNDS'] ?? '3'
  const rounds = Number.parseInt(roundsRaw, 10)
  if (Number.isNaN(rounds) || rounds < 1) {
    console.error(`ROUNDS must be a positive integer, got "${roundsRaw}"`)
    process.exit(2)
  }

  const expectedPass = QUERIES.length * rounds
  console.log(`Target:   ${baseUrl}`)
  console.log(`Queries:  ${QUERIES.length}`)
  console.log(`Rounds:   ${rounds}`)
  console.log(`Stable =  ${expectedPass}/${expectedPass} PASS (no FAIL allowed)`)
  console.log('')

  const allRecords: RunRecord[] = []
  for (let round = 1; round <= rounds; round++) {
    const records = await runRound(baseUrl, apiKey, round)
    allRecords.push(...records)
  }

  const passed = allRecords.filter((record) => record.verdict.ok).length
  const failures = allRecords.filter((record) => !record.verdict.ok)

  console.log('=== Summary ===')
  console.log(`Passed: ${passed}/${expectedPass}`)
  if (failures.length === 0) {
    console.log('STABLE ✓')
    process.exit(0)
  }

  console.log(`Failures (${failures.length}):`)
  for (const failure of failures) {
    console.log(`  - [round ${failure.round}] ${failure.query.id} (${failure.query.source}): ${failure.verdict.reason}`)
  }
  console.log('NOT STABLE ✗')
  process.exit(1)
}

main().catch((error: unknown) => {
  console.error('Unexpected harness error:', error)
  process.exit(2)
})
