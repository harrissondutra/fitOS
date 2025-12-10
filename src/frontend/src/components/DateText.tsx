'use client'

import React from 'react'

interface DateTextProps {
  value: string | number | Date | null | undefined
  /** pt-BR por padrão para consistência */
  locale?: string
  /** options do toLocaleString */
  options?: Intl.DateTimeFormatOptions
  /** fallback quando não há valor */
  fallback?: React.ReactNode
  /** formato: 'date' | 'time' | 'datetime' */
  preset?: 'date' | 'time' | 'datetime'
}

export function DateText({
  value,
  locale = 'pt-BR',
  options,
  fallback = '-',
  preset = 'datetime',
}: DateTextProps) {
  if (!value) return <>{fallback}</>
  const date = value instanceof Date ? value : new Date(value)

  let fmt: Intl.DateTimeFormatOptions | undefined = options
  if (!fmt) {
    if (preset === 'date') fmt = { dateStyle: 'medium' }
    else if (preset === 'time') fmt = { timeStyle: 'short' }
    else fmt = { dateStyle: 'short', timeStyle: 'short' }
  }

  try {
    return <>{date.toLocaleString(locale, fmt)}</>
  } catch {
    return <>{fallback}</>
  }
}

export default DateText






