const dateFormatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
const dateTimeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  month: 'short',
  year: 'numeric',
})

export function formatBrDate(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return dateFormatter.format(date)
}

export function formatBrDateTime(iso: string) {
  const date = new Date(iso)

  if (Number.isNaN(date.getTime())) {
    return iso
  }

  return dateTimeFormatter.format(date)
}
