'use client'

import { Search, X } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchInputProps {
  placeholder?: string
  value?: string
  onChange: (value: string) => void
  debounceMs?: number
  className?: string
}

export function SearchInput({
  placeholder = 'Tìm kiếm...',
  value: controlledValue,
  onChange,
  debounceMs = 300,
  className = '',
}: SearchInputProps) {
  const [internalValue, setInternalValue] = useState(controlledValue ?? '')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (controlledValue !== undefined) {
      setInternalValue(controlledValue)
    }
  }, [controlledValue])

  const handleChange = (val: string) => {
    setInternalValue(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      onChange(val)
    }, debounceMs)
  }

  const handleClear = () => {
    setInternalValue('')
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" />
      <input
        type="text"
        placeholder={placeholder}
        value={internalValue}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full pl-9 pr-8 py-2 text-sm border border-surface-300 rounded-lg bg-white placeholder-surface-400 transition-colors hover:border-surface-400"
      />
      {internalValue && (
        <button
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-surface-400 hover:text-surface-600"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
