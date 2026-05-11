import { useState } from 'react'

export function useLocalStorageState<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    const saved = localStorage.getItem(key)

    if (!saved) return defaultValue

    try {
      return JSON.parse(saved)
    } catch {
      return defaultValue
    }
  })

  const setValue = (value: T | ((prev: T) => T)) => {
    setState(prev => {
      const newValue = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value

      localStorage.setItem(key, JSON.stringify(newValue))
      return newValue
    })
  }

  return [state, setValue]
}
