import { useState } from "react";

export const PAGE_SIZE = 10;

export function usePagination(items, filterKey = "") {
  const [position, setPosition] = useState({ key: filterKey, page: 1 });
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const page = position.key === filterKey ? Math.min(position.page, pages) : 1;
  if (position.key !== filterKey || position.page !== page) {
    setPosition({ key: filterKey, page });
  }
  return {
    items: items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    page,
    pages,
    total: items.length,
    onPage: (next) =>
      setPosition({ key: filterKey, page: Math.max(1, Math.min(next, pages)) }),
  };
}
