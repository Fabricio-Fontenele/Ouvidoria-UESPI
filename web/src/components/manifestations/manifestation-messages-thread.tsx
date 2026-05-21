import type {
  ManifestationMessageEntry,
  ManifestationMessageSenderType,
} from '../../application/manifestations/manifestation-detail-contract'
import { parseSystemMessagePayload } from '../../application/manifestations/system-message-payload'
import { cx } from '../../utils/cx'
import { formatBrDateTime } from '../../utils/format-date'

export type MessagesPerspective = 'manifestant' | 'institutional'

function isManifestantSender(senderType: ManifestationMessageSenderType): boolean {
  return senderType === 'manifestant' || senderType === 'anonymous_manifestant'
}

function isInstitutionalSender(senderType: ManifestationMessageSenderType): boolean {
  return senderType === 'ombudsman' || senderType === 'admin'
}

function isSystemSender(senderType: ManifestationMessageSenderType): boolean {
  return !isManifestantSender(senderType) && !isInstitutionalSender(senderType)
}

function getSenderLabel(senderType: ManifestationMessageSenderType, perspective: MessagesPerspective): string {
  if (perspective === 'manifestant' && isManifestantSender(senderType)) {
    return 'Você'
  }

  if (perspective === 'institutional' && isInstitutionalSender(senderType)) {
    return 'Você'
  }

  switch (senderType) {
    case 'manifestant':
      return 'Manifestante'
    case 'anonymous_manifestant':
      return 'Manifestante anônimo'
    case 'ombudsman':
      return 'Ouvidoria'
    case 'admin':
      return 'Administração'
    case 'system':
      return 'Sistema'
    default:
      return 'Atualização do sistema'
  }
}

function MessageBubble({
  message,
  perspective,
}: {
  message: ManifestationMessageEntry
  perspective: MessagesPerspective
}) {
  const isOwn =
    perspective === 'manifestant' ? isManifestantSender(message.senderType) : isInstitutionalSender(message.senderType)
  const isCounterpart =
    perspective === 'manifestant' ? isInstitutionalSender(message.senderType) : isManifestantSender(message.senderType)
  const isSystem = isSystemSender(message.senderType)
  const senderLabel = getSenderLabel(message.senderType, perspective)
  const systemPayload = isSystem ? parseSystemMessagePayload(message.content) : null
  const contentToRender =
    isSystem && systemPayload !== null ? `Atualização do sistema (${systemPayload.kind}).` : message.content

  return (
    <li className={cx('flex', isOwn ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start')}>
      <div
        className={cx(
          'max-w-[85%] rounded-[28px] px-5 py-4 text-base leading-7 shadow-sm',
          isOwn && 'bg-home-blue text-white',
          isCounterpart && 'bg-home-action/60 text-home-text',
          isSystem && 'bg-home-chip/70 text-home-brown text-sm',
        )}
      >
        <p
          className={cx(
            'text-xs font-bold tracking-[0.14em] uppercase',
            isOwn ? 'text-white/80' : 'text-home-brown/80',
          )}
        >
          {senderLabel}
        </p>
        <p className="mt-1 whitespace-pre-line break-words">{contentToRender}</p>
        <p
          className={cx(
            'mt-3 text-xs font-semibold tracking-[0.12em] uppercase',
            isOwn ? 'text-white/70' : 'text-home-brown/70',
          )}
        >
          {formatBrDateTime(message.createdAt)}
        </p>
      </div>
    </li>
  )
}

interface ManifestationMessagesThreadProps {
  emptyMessage?: string
  messages: ManifestationMessageEntry[]
  perspective: MessagesPerspective
}

export function ManifestationMessagesThread({ emptyMessage, messages, perspective }: ManifestationMessagesThreadProps) {
  const resolvedEmptyMessage =
    emptyMessage ??
    (perspective === 'manifestant'
      ? 'Nenhuma mensagem trocada ainda. Quando a Ouvidoria responder, a conversa aparece aqui.'
      : 'Nenhuma mensagem trocada ainda. Envie uma resposta para iniciar o atendimento.')

  return (
    <section
      aria-labelledby="manifestation-messages-title"
      className="rounded-[32px] border border-login-brown/10 bg-home-surface p-5 shadow-login-frame sm:p-6"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-2xl font-black text-home-text" id="manifestation-messages-title">
          Mensagens
        </h2>
        <span className="rounded-full bg-home-chip px-4 py-2 text-sm font-bold text-home-brown">
          {messages.length} mensage{messages.length === 1 ? 'm' : 'ns'}
        </span>
      </div>

      <div className="mt-5 rounded-[28px] border border-login-brown/10 bg-white p-4 shadow-sm">
        {messages.length === 0 ? (
          <p className="rounded-[24px] border border-home-chip bg-home-chip/70 px-5 py-4 text-sm leading-6 text-home-brown">
            {resolvedEmptyMessage}
          </p>
        ) : (
          <ul className="space-y-4">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} perspective={perspective} />
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
