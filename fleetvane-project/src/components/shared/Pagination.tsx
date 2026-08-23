'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages: (number | 'ellipsis')[] = [];

  // Always show first page
  pages.push(1);

  if (totalPages <= 7) {
    // Show all pages if total is small enough
    for (let i = 2; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Show ellipsis on left side
    if (currentPage > 3) {
      pages.push('ellipsis');
    }

    // Pages around current
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Show ellipsis on right side
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }

    // Always show last page
    pages.push(totalPages);
  }

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-slate-500">
        Page {currentPage} of {totalPages}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        {pages.map((page, idx) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${idx}`}
                className="flex items-center justify-center w-8 h-8 text-slate-400"
              >
                <MoreHorizontal className="w-4 h-4" />
              </span>
            );
          }
          const isActive = page === currentPage;
          return (
            <Button
              key={page}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className={`h-8 w-8 p-0 ${
                isActive
                  ? 'bg-emerald-700 hover:bg-emerald-800 text-white'
                  : ''
              }`}
              onClick={() => onPageChange(page)}
            >
              {page}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
