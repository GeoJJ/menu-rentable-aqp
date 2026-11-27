import React from "react";
import { PAGE_SIZE } from "../hooks/usePagination.js";

export function Pagination({ pagination, label }) {
  const { page, pages, total, onPage } = pagination;
  if (total <= PAGE_SIZE) return null;
  return (
    <nav className="pagination" aria-label={`Páginas de ${label}`}>
      <p role="status">
        Mostrando {(page - 1) * PAGE_SIZE + 1}–
        {Math.min(page * PAGE_SIZE, total)} de {total}
      </p>
      <div className="pagination-actions">
        <button
          type="button"
          className="secondary"
          disabled={page === 1}
          onClick={() => onPage(page - 1)}
        >
          Anterior
        </button>
        <span>
          Página {page} de {pages}
        </span>
        <button
          type="button"
          className="secondary"
          disabled={page === pages}
          onClick={() => onPage(page + 1)}
        >
          Siguiente
        </button>
      </div>
    </nav>
  );
}
