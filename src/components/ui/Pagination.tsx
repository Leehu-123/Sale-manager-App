'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  totalItems?: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, totalItems, onPageChange }: PaginationProps) {
  const getPages = () => {
    const pages: (number | '...')[] = []
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      pages.push(1)
      if (page > 3) pages.push('...')
      const start = Math.max(2, page - 1)
      const end = Math.min(totalPages - 1, page + 1)
      for (let i = start; i <= end; i++) pages.push(i)
      if (page < totalPages - 2) pages.push('...')
      pages.push(totalPages)
    }
    return pages
  }

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between">
      {totalItems !== undefined && (
        <p className="text-sm text-surface-500">
          Tổng: <span className="font-medium text-surface-700">{totalItems}</span> mục
        </p>
      )}
      <div className="flex items-center gap-1 ml-auto">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className={cn(
            'p-1.5 rounded-lg text-sm transition-colors',
            page <= 1
              ? 'text-surface-300 cursor-not-allowed'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <ChevronLeft size={18} />
        </button>

        {getPages().map((p, i) =>
          p === '...' ? (
            <span key={`dots-${i}`} className="px-2 text-surface-400 text-sm">…</span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                'min-w-[32px] h-8 rounded-lg text-sm font-medium transition-colors',
                p === page
                  ? 'bg-brand-700 text-white shadow-sm'
                  : 'text-surface-600 hover:bg-surface-100'
              )}
            >
              {p}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className={cn(
            'p-1.5 rounded-lg text-sm transition-colors',
            page >= totalPages
              ? 'text-surface-300 cursor-not-allowed'
              : 'text-surface-600 hover:bg-surface-100'
          )}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  )
}
