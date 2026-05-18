import { MAX_ATTACHMENT_SIZE_IN_BYTES } from '#src/application/attachments/attachment-policy.js'

const pdfHeader = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF', 'utf8')
const png1x1 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII='
const jpeg1x1 =
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wCEAAkGBxAQEBAQEBAVFhUVFRUVFRUVFRUVFRUVFRUWFhUVFRUYHSggGBolHRUVITEhJSkrLi4uFx8zODMsNygtLisBCgoKDg0OGhAQGzIlHyUtLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLf/AABEIAAEAAQMBIgACEQEDEQH/xAAXAAADAQAAAAAAAAAAAAAAAAAAAQID/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEAMQAAAB6A//xAAVEAEBAAAAAAAAAAAAAAAAAAABAP/aAAgBAQABBQJf/8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAwEBPwEf/8QAFBEBAAAAAAAAAAAAAAAAAAAAEP/aAAgBAgEBPwEf/8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQAGPwJf/8QAFBABAAAAAAAAAAAAAAAAAAAAEP/aAAgBAQABPyFf/9k='
const webp1x1 = 'UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAAAfQ//73v/+BiOh/AAA='

export function createPdfBuffer(): Buffer {
  return Buffer.from(pdfHeader)
}

export function createPngBuffer(): Buffer {
  return Buffer.from(png1x1, 'base64')
}

export function createJpegBuffer(): Buffer {
  return Buffer.from(jpeg1x1, 'base64')
}

export function createWebpBuffer(): Buffer {
  return Buffer.from(webp1x1, 'base64')
}

export function createOversizedPdfBuffer(): Buffer {
  const content = Buffer.alloc(MAX_ATTACHMENT_SIZE_IN_BYTES + 1)
  Buffer.from(pdfHeader).copy(content, 0)
  return content
}
