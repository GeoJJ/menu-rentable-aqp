import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

const homeLinks = [
  ["inicio", "Inicio"],
  ["como-funciona", "Cómo funciona"],
  ["consejos", "Consejos"],
];

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
  const navigation = useRef(null);
  const [section, setSection] = useState("inicio");
  const home = page === "home";
  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    if (!home) return;
    const sections = homeLinks.map(([id]) => document.getElementById(id));
    let frame = 0;
    function syncSection() {
      frame = 0;
      const current = sections.slice(1).findLast((element) => {
        if (!element) return false;
        const margin = Number.parseFloat(getComputedStyle(element).scrollMarginTop);
        const threshold = Math.max(root.current.offsetHeight, margin || 0);
        return element.getBoundingClientRect().top <= threshold + 2;
      });
      setSection(current?.id ?? "inicio");
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(syncSection);
    }
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [home]);
  useLayoutEffect(() => {
    if (!home) return;
    const nav = navigation.current;
    const active = nav.querySelector('[aria-current="location"]');
    function position() {
      nav.style.setProperty("--active-x", `${active.offsetLeft}px`);
      nav.style.setProperty("--active-width", `${active.offsetWidth}px`);
    }
    position();
    const observer = new ResizeObserver(position);
    observer.observe(nav);
    nav.querySelectorAll(".home-nav-link").forEach((link) => observer.observe(link));
    return () => observer.disconnect();
  }, [home, section]);
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
  function goToSection(event, id) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = document.getElementById(id);
    if (!target) return;
    event.preventDefault();
    if (location.hash !== `#${id}`) history.pushState(null, "", `#${id}`);
    setOpen(false);
    setSection(id);
    if (id === "inicio") window.scrollTo({ top: 0, behavior: "instant" });
    else target.scrollIntoView({ behavior: "instant" });
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
          ref={navigation}
          className={`site-navigation ${home ? "landing-navigation" : ""} ${open ? "is-open" : ""}`}
          aria-label="Navegación principal"
        >
          {home ? (
            <>
              <span className="home-nav-pill" aria-hidden="true" />
              {homeLinks.map(([id, label]) => (
                <a
                  key={id}
                  className="home-nav-link"
                  href={`#${id}`}
                  aria-current={section === id ? "location" : undefined}
                  onClick={(event) => goToSection(event, id)}
                >
                  {label}
                </a>
              ))}
              <button className="primary header-cta" onClick={() => go("plan")}>
                Preparar mi plan
                <svg className="header-cta-arrow" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M4 12h15m-6-6 6 6-6 6" />
                </svg>
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
