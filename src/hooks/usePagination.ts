import { useState, useCallback, useEffect } from "react";
import { useDebounce } from "./useDebounce";

interface FilterValues {
  [key: string]: unknown;
}

const usePagination = (
  pageLimit: number = 12,
  filter?: FilterValues,
) => {
  const [totalPages, setTotalPages] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const { handleSearch, debouncedValue, searchTerm, clearSearch } = useDebounce(300);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
    // This is intentional: reset pagination when search/filter changes
  }, [debouncedValue, filter]);

  const goToPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
      }
    },
    [totalPages],
  );

  const nextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  }, [currentPage, totalPages]);

  const prevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentPage]);

  const resetPagination = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleTotalPages = useCallback((pages: number) => {
    setTotalPages(pages);
  }, []);

  return {
    currentPage,
    setCurrentPage,
    goToPage,
    nextPage,
    prevPage,
    resetPagination,
    pageLimit,
    totalPages,
    handleTotalPages,
    debouncedValue,
    handleSearch,
    searchTerm,
    clearSearch,
  };
};

export default usePagination;
