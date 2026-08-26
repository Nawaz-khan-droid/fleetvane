'use client';

import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export type SortDir = 'asc' | 'desc' | null;

interface SortableHeaderProps {
  label: string;
  sortDir: SortDir;
  onSort: () => void;
  className?: string;
}

export default function SortableHeader({ label, sortDir, onSort, className = '' }: SortableHeaderProps) {
  return (
    <button
      type="button"
      onClick={onSort}
      className={`flex items-center gap-1.5 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors select-none ${className}`}
    >
      {label}
      <span className="w-4 h-4 flex items-center justify-center">
        {sortDir === 'asc' ? (
          <ArrowUp className="w-3.5 h-3.5 text-emerald-600" />
        ) : sortDir === 'desc' ? (
          <ArrowDown className="w-3.5 h-3.5 text-emerald-600" />
        ) : (
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
        )}
      </span>
    </button>
  );
}

export function useSort<T>(data: T[], key: keyof T, dir: SortDir): T[] {
  if (!dir || !key) return data;
  return [...data].sort((a, b) => {
    const va = a[key];
    const vb = b[key];
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    let cmp = 0;
    if (typeof va === 'string' && typeof vb === 'string') {
      cmp = va.localeCompare(vb);
    } else if (typeof va === 'number' && typeof vb === 'number') {
      cmp = va - vb;
    } else {
      cmp = String(va).localeCompare(String(vb));
    }
    return dir === 'asc' ? cmp : -cmp;
  });
}
