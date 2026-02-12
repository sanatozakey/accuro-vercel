import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  darkMode?: boolean;
  itemLabel?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  darkMode = false,
  itemLabel = 'items',
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const start = (currentPage - 1) * itemsPerPage + 1;
  const end = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className={`px-4 py-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        Showing {start} to {end} of {totalItems} {itemLabel}
      </p>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className={darkMode ? 'border-gray-600 text-gray-300' : ''}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          let pageNum;
          if (totalPages <= 5) {
            pageNum = i + 1;
          } else if (currentPage <= 3) {
            pageNum = i + 1;
          } else if (currentPage >= totalPages - 2) {
            pageNum = totalPages - 4 + i;
          } else {
            pageNum = currentPage - 2 + i;
          }
          return (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? 'default' : 'outline'}
              size="sm"
              onClick={() => onPageChange(pageNum)}
              className={`w-9 ${currentPage !== pageNum && darkMode ? 'border-gray-600 text-gray-300' : ''}`}
            >
              {pageNum}
            </Button>
          );
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className={darkMode ? 'border-gray-600 text-gray-300' : ''}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
