import type {
  ManifestationHistoryEntry,
  ManifestationHistoryEntryType,
} from '../../application/manifestations/manifestation-detail-contract'
import { getManifestationStatusContract } from '../../application/manifestations/manifestation-status-contract'
import { Icon } from '../icons/icon'
import type { IconName } from '../icons/icon'
import { formatBrDateTime } from '../../utils/format-date'

const historyIconByType: Record<ManifestationHistoryEntryType, IconName> = {
  administrative_answered: 'message-circle',
  evaluation_recorded: 'star',
  finalized_by_author: 'check-circle',
  registered: 'file-text',
  status_changed: 'info',
  unknown: 'info',
}

function describeHistoryEntry(entry: ManifestationHistoryEntry): string {
  switch (entry.type) {
    case 'registered':
      return 'Manifestação registrada.'
    case 'administrative_answered':
      return 'A Ouvidoria respondeu à manifestação.'
    case 'status_changed':
      return 'Status atualizado.'
    case 'finalized_by_author':
      return 'Manifestação encerrada pelo autor.'
    case 'evaluation_recorded':
      return 'Avaliação do atendimento registrada.'
    default:
      return entry.description.length > 0 ? entry.description : 'Atualização do sistema.'
  }
}

interface ManifestationTimelineCardProps {
  history: ManifestationHistoryEntry[]
}

export function ManifestationTimelineCard({ history }: ManifestationTimelineCardProps) {
  return (
    <section
      aria-labelledby="manifestation-timeline-title"
      className="rounded-[32px] border border-login-brown/10 bg-white p-5 shadow-login-frame sm:p-6"
    >
      <h2 className="text-2xl font-black text-home-text" id="manifestation-timeline-title">
        Linha do tempo
      </h2>

      {history.length === 0 ? (
        <p className="mt-5 rounded-2xl bg-home-chip/60 px-4 py-3 text-sm leading-6 text-home-brown">
          Nenhuma atualização registrada ainda.
        </p>
      ) : (
        <ol className="mt-5 space-y-4">
          {history.map((entry, index) => {
            const icon = historyIconByType[entry.type]
            const description = describeHistoryEntry(entry)
            const detailLine =
              entry.type === 'status_changed' && entry.fromStatus !== null && entry.toStatus !== null
                ? `${getManifestationStatusContract(entry.fromStatus).viewLabel} → ${getManifestationStatusContract(entry.toStatus).viewLabel}`
                : entry.type === 'evaluation_recorded' && entry.rating !== null
                  ? `Nota: ${entry.rating}/5`
                  : null

            return (
              <li className="flex items-start gap-4" key={`${entry.createdAt}-${index}`}>
                <span className="mt-1 grid size-9 shrink-0 place-items-center rounded-full bg-home-blue/10 text-home-blue">
                  <Icon className="size-4" name={icon} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm leading-6 font-semibold text-home-text">{description}</p>
                  {detailLine !== null ? <p className="mt-1 text-sm leading-5 text-home-brown">{detailLine}</p> : null}
                  <p className="mt-1 text-xs leading-5 text-home-brown/80">{formatBrDateTime(entry.createdAt)}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </section>
  )
}
