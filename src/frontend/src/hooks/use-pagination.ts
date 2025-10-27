import { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../../../shared/types';

interface UsePaginationReturn {
  page: number;
  limit: number;
  total: number;
  pages: number;
  setPage: (page: number) => void;
  setLimit: (limit: number) => void;
  setTotal: (total: number) => void;
  setPages: (pages: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (page: number) => void;
  canGoNext: boolean;
  canGoPrev: boolean;
}

export function usePagination(initialPage: number = 1, initialLimit: number = 10): UsePaginationReturn {
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);

  const nextPage = useCallback(() => {
    if (page < pages) {
      setPage(page + 1);
    }
  }, [page, pages]);

  const prevPage = useCallback(() => {
    if (page > 1) {
      setPage(page - 1);
    }
  }, [page]);

  const goToPage = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= pages) {
      setPage(newPage);
    }
  }, [pages]);

  const canGoNext = page < pages;
  const canGoPrev = page > 1;

  return {
    page,
    limit,
    total,
    pages,
    setPage,
    setLimit,
    setTotal,
    setPages,
    nextPage,
    prevPage,
    goToPage,
    canGoNext,
    canGoPrev,
  };
}

















