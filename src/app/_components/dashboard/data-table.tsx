'use client';

import { cn } from '@/app/_lib/utils/cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (item: T) => void;
}

/**
 * Reusable data table with pagination, custom rendering, and row click support.
 */
export function DataTable<T extends Record<string, unknown>>({
  data,
  columns,
  pageSize = 10,
  emptyMessage = 'No data found',
  className,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);

  const totalPages = Math.ceil(data.length / pageSize);
  const paginatedData = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className={cn('overflow-hidden rounded-2xl border border-glass-border bg-white', className)}>
      {/* Table */}
      <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-premium">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-4 text-left text-[10px] font-black text-text-tertiary uppercase tracking-[0.15em] sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-glass-border shadow-sm whitespace-nowrap',
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-[11px] font-black uppercase tracking-widest text-text-tertiary"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, i) => (
                <tr
                  key={i}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    'border-b border-glass-border/40 transition-colors',
                    'hover:bg-bg-tertiary/50',
                    onRowClick && 'cursor-pointer'
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn('px-6 py-4 whitespace-nowrap', col.className)}>
                      {col.render ? (
                        col.render(item)
                      ) : (
                        <span className="text-xs font-bold text-text-primary">
                          {String(item[col.key] ?? '')}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-glass-border bg-bg-primary">
          <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">
            Showing {page * pageSize + 1} – {Math.min((page + 1) * pageSize, data.length)} of {data.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="p-2 rounded-xl border border-glass-border text-text-tertiary hover:text-text-primary hover:bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={cn(
                  'h-8 w-8 rounded-xl text-[10px] font-black transition-all border',
                  page === i
                    ? 'bg-accent text-white border-accent shadow-md shadow-accent/20'
                    : 'text-text-secondary border-transparent hover:text-text-primary hover:bg-glass-hover hover:border-glass-border'
                )}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
              className="p-2 rounded-xl border border-glass-border text-text-tertiary hover:text-text-primary hover:bg-glass-hover disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
