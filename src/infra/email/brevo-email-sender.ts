import type { EmailSender, SendEmailInput } from '#src/application/email/email-sender.js'

interface BrevoEmailSenderOptions {
  apiKey: string
  fromEmail: string
  fromName: string
}

interface BrevoErrorResponse {
  code?: unknown
  message?: unknown
}

function isBrevoErrorResponse(value: unknown): value is BrevoErrorResponse {
  return value !== null && typeof value === 'object'
}

export class BrevoEmailSender implements EmailSender {
  private readonly apiKey: string
  private readonly fromEmail: string
  private readonly fromName: string

  constructor(options: BrevoEmailSenderOptions) {
    this.apiKey = options.apiKey
    this.fromEmail = options.fromEmail
    this.fromName = options.fromName
  }

  async send({ subject, text, to }: SendEmailInput): Promise<void> {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      body: JSON.stringify({
        sender: {
          name: this.fromName,
          email: this.fromEmail,
        },
        to: [{ email: to }],
        subject,
        textContent: text,
      }),
      headers: {
        accept: 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      },
      method: 'POST',
    })

    if (!response.ok) {
      throw new Error(`Brevo email send failed: ${await this.readErrorMessage(response)}`)
    }
  }

  private async readErrorMessage(response: Response): Promise<string> {
    const body = await response.text()

    if (body.length === 0) {
      return `${response.status.toString()} ${response.statusText}`
    }

    try {
      const parsedBody: unknown = JSON.parse(body)

      if (isBrevoErrorResponse(parsedBody) && typeof parsedBody.message === 'string') {
        return parsedBody.message
      }
    } catch {
      return body
    }

    return body
  }
}
