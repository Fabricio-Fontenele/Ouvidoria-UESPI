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

export function parseBrazilianShortDateLabel(dateLabel: string) {
  const [dayPart, monthPart, yearPart] = dateLabel.replace(',', '').split(' ')
  const month = monthPart !== undefined ? monthNumberByLabel[monthPart] : undefined

  if (dayPart === undefined || month === undefined || yearPart === undefined) {
    return null
  }

  return `${yearPart}-${month}-${dayPart.padStart(2, '0')}`
}
