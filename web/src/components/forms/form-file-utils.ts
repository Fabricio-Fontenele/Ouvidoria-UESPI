export function formatFileSize(sizeInBytes: number) {
  if (sizeInBytes < 1024) {
    return `${sizeInBytes} B`
  }

  if (sizeInBytes < 1024 * 1024) {
    return `${(sizeInBytes / 1024).toFixed(1)} KB`
  }

  return `${(sizeInBytes / 1024 / 1024).toFixed(1)} MB`
}

export function getSelectedFiles(value: unknown) {
  if (typeof FileList !== 'undefined' && value instanceof FileList) {
    return Array.from(value)
  }

  if (Array.isArray(value) && value.every((item) => item instanceof File)) {
    return value
  }

  return []
}

export function getFileLimitText(maxFiles: number) {
  return `Limite: até ${maxFiles} ${maxFiles === 1 ? 'arquivo' : 'arquivos'}.`
}

export function getFileLimitError(maxFiles: number) {
  return `Anexe no máximo ${maxFiles} ${maxFiles === 1 ? 'arquivo' : 'arquivos'}.`
}

export function getFileSizeLimitText(maxFileSizeInBytes: number) {
  return `Tamanho máximo por arquivo: ${formatFileSize(maxFileSizeInBytes)}.`
}

export function getFileSizeLimitError(maxFileSizeInBytes: number) {
  return `Cada arquivo deve ter até ${formatFileSize(maxFileSizeInBytes)}.`
}

export function hasOversizedFile(files: FileList | null, maxFileSizeInBytes: number | undefined) {
  return (
    files !== null &&
    maxFileSizeInBytes !== undefined &&
    Array.from(files).some((file) => file.size > maxFileSizeInBytes)
  )
}
