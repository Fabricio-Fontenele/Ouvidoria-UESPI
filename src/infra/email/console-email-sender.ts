import type { EmailSender, SendEmailInput } from '#src/application/email/email-sender.js'

export class ConsoleEmailSender implements EmailSender {
  async send({ subject, text, to }: SendEmailInput): Promise<void> {
    console.warn(`[email] to=${to} subject=${subject}\n${text}`)
  }
}
