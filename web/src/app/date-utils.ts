const monthNumberByLabel: Record<string, string> = {
  Abr: '04',
  Ago: '08',
  Dez: '12',
  Fev: '02',
  Jan: '01',
  Jul: '07',
  Jun: '06',
  Mai: '05',
  Mar: '03',
  Nov: '11',
  Out: '10',
  Set: '09',
}

const monthLabelByIndex = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'] as const

export function parseBrazilianShortDateLabel(dateLabel: string) {
  const [dayPart, monthPart, yearPart] = dateLabel.replace(',', '').split(' ')
  const month = monthPart !== undefined ? monthNumberByLabel[monthPart] : undefined

  if (dayPart === undefined || month === undefined || yearPart === undefined) {
    return null
  }

  return `${yearPart}-${month}-${dayPart.padStart(2, '0')}`
}

export function formatBrazilianShortDate(isoDate: string) {
  const parsed = new Date(isoDate)

  if (Number.isNaN(parsed.getTime())) {
    return isoDate
  }

  const day = String(parsed.getDate()).padStart(2, '0')
  const month = monthLabelByIndex[parsed.getMonth()]
  const year = parsed.getFullYear()

  return `${day} ${month}, ${year}`
}

export interface LocalDayRange {
  from: string
  to: string
}

const LOCAL_DAY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function buildLocalDayRange(localDate: string): LocalDayRange | null {
  const match = LOCAL_DAY_PATTERN.exec(localDate)

  if (match === null) {
    return null
  }

  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) {
    return null
  }

  const from = new Date(year, month - 1, day, 0, 0, 0, 0)
  const to = new Date(year, month - 1, day, 23, 59, 59, 999)

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
    return null
  }

  return {
    from: from.toISOString(),
    to: to.toISOString(),
  }
}
