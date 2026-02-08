import { useState, useEffect } from "react";

export const useDebounce = (delay: number) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedValue, setDebouncedValue] = useState("");

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay]);

  const handleSearch = (val: string) => {
    setSearchTerm(val);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedValue("");
  };

  return {
    searchTerm,
    handleSearch,
    debouncedValue,
    clearSearch,
  };
};
