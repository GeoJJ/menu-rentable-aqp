import React, { useEffect, useRef, useState } from "react";

const workspaceLinks = [
  ["home", "Inicio"],
  ["plan", "Preparar mi plan"],
  ["saved", "Mis planes"],
  ["kitchen", "Mi cocina"],
  ["results", "Compras y resultados"],
];

export function SiteHeader({ page, onGo, status }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null),
    toggle = useRef(null);
  const home = page === "home";
  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    if (!open) return;
    function dismiss(event) {
      if (event.type === "keydown" && event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      } else if (
        event.type === "pointerdown" &&
        !root.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", dismiss);
    document.addEventListener("pointerdown", dismiss);
    return () => {
      document.removeEventListener("keydown", dismiss);
      document.removeEventListener("pointerdown", dismiss);
    };
  }, [open]);
  function go(next) {
    setOpen(false);
    onGo(next);
  }
  return (
    <header className="site-header" ref={root}>
      <div className="site-header-inner">
        <button
          className="site-logo"
          onClick={() => go("home")}
          aria-label="Menú Rentable, ir al inicio"
        >
          <img
            src="/brand/menu-rentable-logo-v1.png"
            alt="Menú Rentable Arequipa"
            width="2192"
            height="728"
          />
        </button>
        <button
          ref={toggle}
          className="menu-toggle"
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          aria-controls="primary-navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            aria-hidden="true"
          >
            {open ? (
              <path d="m6 6 12 12M18 6 6 18" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
          {open ? "Cerrar" : "Menú"}
        </button>
        <nav
          id="primary-navigation"
          className={`site-navigation ${open ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          {home ? (
            <>
              <a
                href="#inicio"
                aria-current="page"
                onClick={() => setOpen(false)}
              >
                Inicio
              </a>
              <a href="#como-funciona" onClick={() => setOpen(false)}>
                Cómo funciona
              </a>
              <a href="#consejos" onClick={() => setOpen(false)}>
                Consejos
              </a>
              <button className="primary header-cta" onClick={() => go("plan")}>
                Preparar mi plan <span aria-hidden="true">↗</span>
              </button>
            </>
          ) : (
            workspaceLinks.map(([value, label]) => (
              <button
                key={value}
                className={`workspace-link ${page === value ? "is-active" : ""}`}
                aria-current={page === value ? "page" : undefined}
                onClick={() => go(value)}
              >
                {label}
              </button>
            ))
          )}
        </nav>
        {!home && (
          <span className="header-status" role="status">
            <i data-status={status} />
            {status === "connected"
              ? "Conectado"
              : status === "checking"
                ? "Conectando…"
                : "Sin conexión"}
          </span>
        )}
      </div>
    </header>
  );
}
