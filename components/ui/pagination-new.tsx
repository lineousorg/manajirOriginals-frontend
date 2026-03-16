"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationInfo } from "@/hooks/useProduct";

interface PaginationProps {
  pagination: PaginationInfo;
  onPageChange: (page: number) => void;
  showFirstLast?: boolean;
  showPageNumbers?: boolean;
  maxVisiblePages?: number;
  className?: string;
}

export function Pagination({
  pagination,
  onPageChange,
  showFirstLast = true,
  showPageNumbers = true,
  maxVisiblePages = 5,
  className = "",
}: PaginationProps) {
  const { page, totalPages, hasNext, hasPrevious } = pagination;

  if (totalPages <= 1) return null;

  // Calculate visible page numbers
  const getVisiblePages = () => {
    const pages: (number | string)[] = [];
    
    if (totalPages <= maxVisiblePages) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Calculate start and end
      let start = Math.max(1, page - Math.floor(maxVisiblePages / 2));
      const end = Math.min(totalPages, start + maxVisiblePages - 1);
      
      // Adjust if end is less than maxVisiblePages
      if (end - start < maxVisiblePages - 1) {
        start = Math.max(1, end - maxVisiblePages + 1);
      }
      
      // Add first page and ellipsis if needed
      if (start > 1) {
        pages.push(1);
        if (start > 2) pages.push("...");
      }
      
      // Add visible pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add last page and ellipsis if needed
      if (end < totalPages) {
        if (end < totalPages - 1) pages.push("...");
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      {/* First Page Button */}
      {showFirstLast && page > 2 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(1)}
          className="hidden sm:flex"
          aria-label="Go to first page"
        >
          <ChevronsLeft size={18} />
        </Button>
      )}

      {/* Previous Page Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page - 1)}
        disabled={!hasPrevious}
        aria-label="Go to previous page"
      >
        <ChevronLeft size={18} />
      </Button>

      {/* Page Numbers */}
      {showPageNumbers && (
        <div className="flex items-center gap-1">
          {visiblePages.map((pageNum, index) => (
            <span key={index}>
              {pageNum === "..." ? (
                <span className="px-2 text-muted-foreground">...</span>
              ) : (
                <Button
                  variant={pageNum === page ? "default" : "ghost"}
                  size="icon"
                  onClick={() => onPageChange(pageNum as number)}
                  className="min-w-[36px]"
                  aria-label={`Go to page ${pageNum}`}
                  aria-current={pageNum === page ? "page" : undefined}
                >
                  {pageNum}
                </Button>
              )}
            </span>
          ))}
        </div>
      )}

      {/* Next Page Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onPageChange(page + 1)}
        disabled={!hasNext}
        aria-label="Go to next page"
      >
        <ChevronRight size={18} />
      </Button>

      {/* Last Page Button */}
      {showFirstLast && page < totalPages - 1 && (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(totalPages)}
          className="hidden sm:flex"
          aria-label="Go to last page"
        >
          <ChevronsRight size={18} />
        </Button>
      )}
    </div>
  );
}

// Simple pagination info display
interface PaginationInfoProps {
  pagination: PaginationInfo;
  className?: string;
}

export function PaginationInfo({ pagination, className = "" }: PaginationInfoProps) {
  const { page, limit, total } = pagination;
  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);

  return (
    <p className={`text-sm text-muted-foreground ${className}`}>
      Showing {start}-{end} of {total} products
    </p>
  );
}
