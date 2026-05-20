import { type FormEvent, useMemo, useState } from 'react'

import { getSearchParams, normalizeProtocol, routes } from '../app/routes'
import { ombudsmanAreaRoles } from '../app/access-policy'
import {
  getOmbudsmanManifestationStatusContract,
  type OmbudsmanManifestationStatus,
} from '../application/ombudsman/ombudsman-manifestation-contract'
import type {
  OmbudsmanManifestationDetailViewModel,
  OmbudsmanManifestationReply,
} from '../application/ombudsman/ombudsman-manifestation-detail-contract'
import { ombudsmanReplyLimits } from '../application/ombudsman/ombudsman-manifestation-detail-contract'
import { Icon } from '../components/icons/icon'
import { AuthenticatedAppShell } from '../components/layout/authenticated-app-shell'
import { SiteFooter } from '../components/layout/site-footer'
import { cx } from '../utils/cx'

interface DetailItem {
  label: string
  value: string
}

type ReplyStatus = 'idle' | 'sent'

type LocalReply = OmbudsmanManifestationReply & { attachments?: string[] }

const manifestationDetails: OmbudsmanManifestationDetailViewModel[] = [
  {
    area: 'Administração Superior',
    createdAt: '01 Set, 2024',
    description:
      'Gostaria de sugerir a implementação de um sistema de agendamento online para os serviços da ouvidoria. Isso facilitaria muito para os cidadãos e evitaria filas e esperas desnecessárias.',
    manifestationType: 'Sugestão',
    protocol: '#2024-0775',
    replies: [],
    status: 'in_analysis',
    title: 'Sistema de agendamento online para atendimento',
    updatedAt: '02 Set, 2024',
  },
  {
    area: 'Infraestrutura e TI',
    createdAt: '01 Set, 2024',
    description: 'Relato de instabilidade nos sistemas institucionais durante o atendimento ao discente.',
    manifestationType: 'Reclamação',
    protocol: '#2024-0776',
    replies: [],
    status: 'pending',
    title: 'Instabilidade nos sistemas institucionais',
    updatedAt: '01 Set, 2024',
  },
]

const statusBadgeClassNames: Record<OmbudsmanManifestationStatus, string> = {
  in_analysis: 'bg-home-warning-strong text-home-brown',
  pending: 'bg-home-blue text-white',
  resolved: 'bg-home-success text-white',
}

function resolveProtocol() {
  const protocol = getSearchParams().get('protocol')?.trim()

  if (!protocol) {
    return null
  }

  return normalizeProtocol(protocol)
}

function getManifestationDetails(protocol: string) {
  return manifestationDetails.find((manifestation) => manifestation.protocol === protocol) ?? null
}

function StatusBadge({ status }: { status: OmbudsmanManifestationStatus }) {
  const statusContract = getOmbudsmanManifestationStatusContract(status)

  return (
    <span
      className={cx(
        'inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-base leading-6 font-black tracking-[0.04em] uppercase sm:min-h-12 sm:px-5 sm:text-lg',
        statusBadgeClassNames[status],
      )}
    >
      {statusContract.viewLabel}
    </span>
  )
}

function ManifestationSummaryCard({ manifestation }: { manifestation: OmbudsmanManifestationDetailViewModel }) {
  const statusContract = getOmbudsmanManifestationStatusContract(manifestation.status)
  const detailItems: DetailItem[] = [
    { label: 'Protocolo', value: manifestation.protocol },
    { label: 'Tipo', value: manifestation.manifestationType },
    { label: 'Área', value: manifestation.area },
    { label: 'Última atualização', value: manifestation.updatedAt },
    { label: 'Status', value: statusContract.viewLabel },
  ]

  return (
    <article
      aria-labelledby="manifestation-detail-title"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-4 rounded-[24px] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-home-blue">Manifestação</p>
          <h1 className="mt-3 text-2xl font-black leading-9 text-home-text" id="manifestation-detail-title">
            {manifestation.protocol}
          </h1>
          <p className="mt-2 text-sm leading-6 text-home-brown">{manifestation.title}</p>
        </div>

        <StatusBadge status={manifestation.status} />
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2">
        {detailItems.map((item) => (
          <div key={item.label} className="rounded-3xl bg-home-action/50 p-4">
            <dt className="text-xs font-bold uppercase tracking-[0.14em] text-home-brown/70">{item.label}</dt>
            <dd className="mt-2 text-lg font-semibold leading-7 text-home-text">{item.value}</dd>
          </div>
        ))}
      </dl>
    </article>
  )
}

function DescriptionCard({ description }: { description: string }) {
  return (
    <section
      aria-labelledby="manifestation-description-title"
      className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-home-text" id="manifestation-description-title">
          Descrição da manifestação
        </h2>
        <span className="rounded-full bg-home-chip px-4 py-2 text-sm font-bold text-home-brown">
          Mensagem registrada
        </span>
      </div>
      <p className="mt-5 text-lg leading-7 text-home-text sm:text-xl">{description}</p>
    </section>
  )
}

function ChatBubble({ reply }: { reply: LocalReply }) {
  return (
    <li className="flex justify-end">
      <div className="max-w-[85%] rounded-[28px] bg-home-blue px-5 py-4 text-base leading-7 text-white shadow-sm">
        <p>{reply.message}</p>
        {reply.attachments !== undefined && reply.attachments.length > 0 ? (
          <div className="mt-4 space-y-2 rounded-3xl bg-home-action/20 p-3 text-sm text-white/90">
            <p className="font-bold uppercase tracking-[0.14em] text-white/80">Anexos</p>
            <ul className="space-y-2">
              {reply.attachments.map((name) => (
                <li key={name} className="truncate">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <span className="mt-3 block text-xs font-semibold uppercase tracking-[0.12em] text-home-blue/10">
          {reply.createdAt}
        </span>
      </div>
    </li>
  )
}

function ConversationCard({
  replies,
  draft,
  attachments,
  onAttachmentChange,
  onRemoveAttachment,
  onDraftChange,
  onSubmit,
  status,
}: {
  replies: LocalReply[]
  draft: string
  attachments: File[]
  onAttachmentChange: (files: FileList | null) => void
  onRemoveAttachment: (index: number) => void
  onDraftChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  status: ReplyStatus
}) {
  const message = draft.trim()
  const isSubmitDisabled = message.length === 0 && attachments.length === 0
  const feedbackId = 'reply-form-feedback'

  return (
    <section
      aria-labelledby="conversation-title"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-home-blue">Chat do ouvidor</p>
          <h2 className="mt-2 text-2xl font-black text-home-text" id="conversation-title">
            Histórico de interações
          </h2>
        </div>
        <span className="rounded-full bg-home-chip px-4 py-2 text-sm font-bold text-home-brown">
          {replies.length} mensagem{replies.length === 1 ? '' : 's'}
        </span>
      </div>

      <div className="mt-5 rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm">
        <ul className="space-y-4">
          {replies.length === 0 ? (
            <li className="rounded-[24px] border border-home-chip bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
              Nenhuma resposta registrada ainda. Envie uma mensagem para iniciar o atendimento.
            </li>
          ) : (
            replies.map((reply) => <ChatBubble key={reply.id} reply={reply} />)
          )}
        </ul>
      </div>

      <form className="mt-6 grid gap-4" onSubmit={onSubmit}>
        <label className="sr-only" htmlFor="ombudsman-reply-message">
          Mensagem do ouvidor
        </label>
        <textarea
          aria-describedby={feedbackId}
          className="min-h-[100px] w-full rounded-[26px] border border-login-brown/10 bg-home-action/35 px-4 py-3 text-sm leading-6 text-home-text outline-none placeholder:text-home-brown/70 focus:border-home-blue focus:ring-2 focus:ring-home-blue/20"
          id="ombudsman-reply-message"
          maxLength={ombudsmanReplyLimits.maxLength}
          onChange={(event) => onDraftChange(event.target.value)}
          placeholder="Digite sua resposta"
          value={draft}
        />

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label
            className="flex min-h-14 cursor-pointer items-center gap-2 rounded-full border border-login-brown/10 bg-white px-4 py-2 text-sm font-semibold text-home-brown transition duration-150 hover:border-home-blue hover:text-home-text focus-within:outline-2 focus-within:outline-offset-3 focus-within:outline-home-blue"
            htmlFor="ombudsman-attachments"
          >
            <Icon className="size-5 text-home-blue" name="upload-cloud" />
            Anexar arquivo
            <input
              accept="image/*,.pdf,.doc,.docx"
              className="sr-only"
              id="ombudsman-attachments"
              multiple
              type="file"
              onChange={(event) => onAttachmentChange(event.target.files)}
            />
          </label>

          <button
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-home-blue px-5 text-sm font-bold text-white transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue disabled:cursor-not-allowed disabled:bg-home-muted disabled:opacity-70"
            disabled={isSubmitDisabled}
            type="submit"
          >
            Enviar resposta
          </button>
        </div>

        {attachments.length > 0 ? (
          <div className="rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.14em] text-home-blue">Anexos</p>
            <ul className="mt-3 space-y-2">
              {attachments.map((file, index) => (
                <li
                  key={`${file.name}-${file.size}`}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-home-chip bg-home-action/40 px-3 py-2 text-sm text-home-text"
                >
                  <span className="truncate">{file.name}</span>
                  <button
                    className="grid size-8 place-items-center rounded-full bg-home-chip text-home-brown transition duration-150 hover:bg-home-blue/10 hover:text-home-blue focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-blue"
                    onClick={() => onRemoveAttachment(index)}
                    type="button"
                  >
                    <Icon className="size-4" name="x" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <p aria-live="polite" className="text-sm font-semibold text-home-brown" id={feedbackId}>
          {status === 'sent' ? 'Resposta registrada.' : 'Digite a mensagem e envie para o manifestante.'}
        </p>
      </form>
    </section>
  )
}

function ManifestationNotFound({ protocol }: { protocol: string | null }) {
  return (
    <section className="rounded-lg bg-home-surface px-6 py-8 shadow-login-frame">
      <h1 className="text-3xl leading-9 font-black text-home-text">Manifestação não encontrada</h1>
      <p className="mt-3 max-w-xl text-base leading-7 text-home-brown">
        Não encontramos uma demanda com o protocolo {protocol ?? 'informado'}. Volte para a lista e abra uma
        manifestação disponível.
      </p>
      <a
        className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-home-blue px-5 text-sm leading-5 font-bold text-white no-underline transition duration-150 hover:bg-home-blue/90 active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
        href={routes.ombudsmanHome}
      >
        Voltar para demandas
        <Icon className="size-4" name="chevron-right" />
      </a>
    </section>
  )
}

export function OmbudsmanManifestationDetailsPage() {
  const protocol = resolveProtocol()
  const manifestation = useMemo(() => (protocol === null ? null : getManifestationDetails(protocol)), [protocol])
  const [draft, setDraft] = useState('')
  const [replyStatus, setReplyStatus] = useState<ReplyStatus>('idle')
  const [attachments, setAttachments] = useState<File[]>([])
  const [replies, setReplies] = useState<LocalReply[]>(manifestation?.replies ?? [])

  const handleAttachmentChange = (files: FileList | null) => {
    if (files === null) {
      setAttachments([])
      return
    }

    setAttachments(Array.from(files))
  }

  const handleRemoveAttachment = (indexToRemove: number) => {
    setAttachments((currentAttachments) => currentAttachments.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const message = draft.trim()

    if (message.length === 0 && attachments.length === 0) {
      return
    }

    setReplies((currentReplies) => [
      ...currentReplies,
      {
        createdAt: 'Agora',
        id: `reply-${currentReplies.length + 1}`,
        message: message || 'Mensagem com anexo',
        attachments: attachments.map((file) => file.name),
      },
    ])
    setDraft('')
    setAttachments([])
    setReplyStatus('sent')
  }

  return (
    <div className="min-h-svh bg-login-bg font-sans text-home-text">
      <AuthenticatedAppShell allowedRoles={ombudsmanAreaRoles}>
        <main className="mx-auto w-full max-w-4xl px-5 pt-8 pb-12 sm:px-8 md:pt-12 lg:px-12">
          <a
            className="inline-flex min-h-10 items-center gap-2 rounded-lg text-sm leading-5 font-bold text-home-blue no-underline transition duration-150 hover:text-home-blue/80 focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-home-blue"
            href={routes.ombudsmanHome}
          >
            <Icon className="size-4" name="chevron-left" />
            Voltar para demandas
          </a>

          {manifestation === null ? (
            <div className="mt-8">
              <ManifestationNotFound protocol={protocol} />
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              <ManifestationSummaryCard manifestation={manifestation} />
              <DescriptionCard description={manifestation.description} />
              <ConversationCard
                replies={replies}
                draft={draft}
                attachments={attachments}
                onAttachmentChange={handleAttachmentChange}
                onRemoveAttachment={handleRemoveAttachment}
                onDraftChange={(value) => {
                  setDraft(value)
                  setReplyStatus('idle')
                }}
                onSubmit={handleSubmit}
                status={replyStatus}
              />
            </div>
          )}
        </main>

        <SiteFooter variant="ombudsman" />
      </AuthenticatedAppShell>
    </div>
  )
}
