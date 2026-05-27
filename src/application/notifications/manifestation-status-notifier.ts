import type { EmailSender } from '#src/application/email/email-sender.js'
import type { UsersRepository } from '#src/application/repositories/users-repository.js'
import { ManifestationStatus, type Manifestation } from '#src/domain/entities/manifestation.js'

export interface ManifestationStatusNotifier {
  notify(manifestation: Manifestation): Promise<void>
}

const ANSWERED_NOTIFICATION_COOLDOWN_MS = 5 * 60 * 1000

const statusLabels: Record<ManifestationStatus, string> = {
  in_analysis: 'colocada em análise',
  awaiting_unit: 'encaminhada ao setor responsável',
  answered: 'respondida',
  canceled: 'cancelada',
  finalized: 'finalizada',
}

export class ManifestationStatusEmailNotifier implements ManifestationStatusNotifier {
  private readonly answeredNotificationSentAtByKey = new Map<string, number>()

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly emailSender: EmailSender,
    private readonly now: () => number = () => Date.now(),
  ) {}

  async notify(manifestation: Manifestation): Promise<void> {
    const authorUserId = manifestation.authorUserId?.toString()

    if (authorUserId === undefined) {
      return
    }

    const author = await this.usersRepository.findById(authorUserId)

    if (author === null) {
      return
    }

    if (!this.canSendAnsweredNotification(manifestation, authorUserId)) {
      return
    }

    const protocol = manifestation.protocol.getValue()
    const statusLabel = statusLabels[manifestation.status]

    await this.emailSender.send({
      to: author.email.getValue(),
      subject: `Manifestação ${protocol} atualizada`,
      text: `A manifestação ${protocol} foi ${statusLabel}! Verifique o sistema.`,
    })

    this.registerAnsweredNotification(manifestation, authorUserId)
  }

  private canSendAnsweredNotification(manifestation: Manifestation, authorUserId: string): boolean {
    if (manifestation.status !== ManifestationStatus.ANSWERED) {
      return true
    }

    const notificationKey = this.buildAnsweredNotificationKey(manifestation, authorUserId)
    const lastSentAt = this.answeredNotificationSentAtByKey.get(notificationKey)

    return lastSentAt === undefined || this.now() - lastSentAt >= ANSWERED_NOTIFICATION_COOLDOWN_MS
  }

  private registerAnsweredNotification(manifestation: Manifestation, authorUserId: string): void {
    if (manifestation.status !== ManifestationStatus.ANSWERED) {
      return
    }

    this.answeredNotificationSentAtByKey.set(this.buildAnsweredNotificationKey(manifestation, authorUserId), this.now())
  }

  private buildAnsweredNotificationKey(manifestation: Manifestation, authorUserId: string): string {
    return `${authorUserId}:${manifestation.id.toString()}:answered`
  }
}
