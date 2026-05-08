const getUserLocale = (): string => {
  return navigator.languages?.[0] || navigator.language || 'en-US'
}

export const formatCurrency = (amount: number | null | undefined, currency = 'EUR'): string => {
  if (amount == null || isNaN(amount)) return '-'

  return new Intl.NumberFormat(getUserLocale(), {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export const formatNumber = (
  number: number | null | undefined,
  options: Partial<Intl.NumberFormatOptions> = {}
): string => {
  if (number == null || isNaN(number)) return '-'

  return new Intl.NumberFormat(getUserLocale(), {
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 2,
    ...options
  }).format(number)
}

export const formatPercent = (value: number | null | undefined, decimals = 0): string => {
  if (value == null || isNaN(value)) return '-'

  return new Intl.NumberFormat(getUserLocale(), {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value / 100)
}

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat(getUserLocale(), {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(dateObj)
}

export const formatDateLong = (date: string | Date | null | undefined): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat(getUserLocale(), {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(dateObj)
}

export const formatDateMedium = (date: string | Date | null | undefined): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat(getUserLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(dateObj)
}

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat(getUserLocale(), {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(dateObj)
}

export const formatMonthYear = (date: string | Date | null | undefined): string => {
  if (!date) return '-'

  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (isNaN(dateObj.getTime())) return '-'

  return new Intl.DateTimeFormat(getUserLocale(), {
    year: 'numeric',
    month: 'long'
  }).format(dateObj)
}
