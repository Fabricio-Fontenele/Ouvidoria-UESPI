import { randomUUID } from 'node:crypto'

interface MultipartFileInput {
  content: Buffer | string | Uint8Array
  contentType: string
  fieldName?: string
  filename: string
}

interface BuildMultipartPayloadInput {
  fields?: Record<string, string>
  file?: MultipartFileInput
  fileFirst?: boolean
}

export function buildMultipartPayload({ fields = {}, file, fileFirst = false }: BuildMultipartPayloadInput): {
  body: Buffer
  headers: Record<string, string>
} {
  const boundary = `----codex-${randomUUID()}`
  const chunks: Buffer[] = []

  const appendFields = () => {
    for (const [fieldName, value] of Object.entries(fields)) {
      chunks.push(Buffer.from(`--${boundary}\r\n`))
      chunks.push(Buffer.from(`Content-Disposition: form-data; name="${fieldName}"\r\n\r\n`))
      chunks.push(Buffer.from(`${value}\r\n`))
    }
  }

  const appendFile = () => {
    if (file === undefined) {
      return
    }

    chunks.push(Buffer.from(`--${boundary}\r\n`))
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${file.fieldName ?? 'file'}"; filename="${file.filename}"\r\n`,
      ),
    )
    chunks.push(Buffer.from(`Content-Type: ${file.contentType}\r\n\r\n`))
    chunks.push(Buffer.from(file.content))
    chunks.push(Buffer.from('\r\n'))
  }

  if (fileFirst) {
    appendFile()
    appendFields()
  } else {
    appendFields()
    appendFile()
  }

  chunks.push(Buffer.from(`--${boundary}--\r\n`))

  const body = Buffer.concat(chunks)

  return {
    body,
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(body.byteLength),
    },
  }
}
