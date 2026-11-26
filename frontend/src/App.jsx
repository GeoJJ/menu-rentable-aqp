import React, { useEffect, useState } from "react";
import { CompleteMenuPlanner } from "./features/planning/CompleteMenuPlanner.jsx";
import { SavedMenuPlans } from "./features/planning/SavedMenuPlans.jsx";
import { Kitchen } from "./features/kitchen/Kitchen.jsx";
import { BusinessResults } from "./features/operations/BusinessResults.jsx";
import { WorkflowGuide } from "./components/FormHelp.jsx";
import { api } from "./services/api.js";
import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/workspace.css";
import "./styles/theme.css";
export default function App() {
  const [revision, setRevision] = useState(0);
  const [resultsKey, setResultsKey] = useState(0);
  function navigate(next) {
    setPage(next);
    if (next === "saved") setJustSaved(null);
    if (next === "results") setResultsKey((v) => v + 1);
    window.scrollTo(0, 0);
  }
  const [page, setPage] = useState("plan"),
    [version, setVersion] = useState(0),
    [justSaved, setJustSaved] = useState(null),
    [status, setStatus] = useState("checking");
  useEffect(() => {
    const controller = new AbortController();
    api("health", { signal: controller.signal })
      .then(() => setStatus("connected"))
      .catch((e) => {
        if (e.name !== "AbortError") setStatus("offline");
      });
    return () => controller.abort();
  }, []);
  function newPlan() {
    setJustSaved(null);
    setVersion((v) => v + 1);
    setPage("plan");
    window.scrollTo(0, 0);
  }
  function saved(plan) {
    setJustSaved(plan);
    setVersion((v) => v + 1);
    setPage("saved");
    window.scrollTo(0, 0);
  }
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <svg
              viewBox="0 0 32 32"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="16" cy="17" r="7.5" />
              <path d="M4 5v7m3-7v7M4 9h3m-1.5 3v15M27 5v22m0-22c-4 4-4 10 0 10" />
            </svg>
          </span>
          <div className="brand-wordmark">
            MenúRentable<small>AREQUIPA</small>
          </div>
        </div>
        <nav aria-label="Navegación principal">
          <button
            className={"nav " + (page === "plan" ? "active" : "")}
            aria-current={page === "plan" ? "page" : undefined}
            onClick={() => {
              setPage("plan");
              window.scrollTo(0, 0);
            }}
          >
            <span aria-hidden="true">▦</span>Preparar mi plan
          </button>
          <button
            className={"nav " + (page === "saved" ? "active" : "")}
            aria-current={page === "saved" ? "page" : undefined}
            onClick={() => {
              setJustSaved(null);
              setPage("saved");
              window.scrollTo(0, 0);
            }}
          >
            <span aria-hidden="true">↺</span>Mis planes
          </button>
          <button
            className={"nav " + (page === "kitchen" ? "active" : "")}
            aria-current={page === "kitchen" ? "page" : undefined}
            onClick={() => {
              setPage("kitchen");
              window.scrollTo(0, 0);
            }}
          >
            <span aria-hidden="true">▤</span>Mi cocina
          </button>
          <button
            className={"nav " + (page === "results" ? "active" : "")}
            aria-current={page === "results" ? "page" : undefined}
            onClick={() => navigate("results")}
          >
            <span aria-hidden="true">▥</span>Compras y resultados
          </button>
        </nav>
        <div className="sidebar-note">
          <i data-status={status} />
          {status === "connected"
            ? "Conectado"
            : status === "checking"
              ? "Conectando…"
              : "Sin conexión"}
        </div>
      </aside>
      <main>
        <header className="top">
          <span>
            MenúRentable AQP <b>/</b>{" "}
            {page === "plan"
              ? "Planificación"
              : page === "kitchen"
                ? "Mi cocina"
                : page === "results"
                  ? "Compras y resultados"
                  : "Mis planes"}
          </span>
          <span className="location">Arequipa, Perú</span>
        </header>
        <div className="content">
          <div className="flow-welcome">
            <span className="flow-eyebrow">DEL MENÚ A LA LISTA DE COMPRAS</span>
            <h1>
              {page === "plan"
                ? "Organiza lo que vas a cocinar."
                : page === "kitchen"
                  ? "Tu cocina, lista para planificar."
                  : page === "results"
                    ? "De lo planificado a lo vendido."
                    : "Tus planes, en un solo lugar."}
            </h1>
            <p>
              {page === "plan"
                ? "Elige tu menú, indica cuántos prepararás y calcula las compras antes de empezar."
                : page === "kitchen"
                  ? "Mantén tus recetas, existencias y precios al día."
                  : page === "results"
                    ? "Registra compras y pérdidas, y consulta tus resultados reales."
                    : "Abre un plan para ver las compras previstas o registrar lo que preparaste y vendiste al terminar el día."}
            </p>
          </div>
          <WorkflowGuide onGo={navigate} />
          <div hidden={page !== "plan"}>
            <CompleteMenuPlanner
              key={version}
              onSaved={saved}
              revision={revision}
            />
          </div>
          {page === "saved" && (
            <SavedMenuPlans
              key={justSaved?.id ?? "list"}
              justSaved={justSaved}
              onNew={newPlan}
              onChanged={() => setRevision((v) => v + 1)}
              onPurchases={() => navigate("results")}
            />
          )}
          {page === "kitchen" && (
            <Kitchen
              onChanged={() => setRevision((value) => value + 1)}
              onPurchases={() => navigate("results")}
            />
          )}
          {page === "results" && (
            <BusinessResults
              key={resultsKey}
              onChanged={() => setRevision((v) => v + 1)}
              onViewPlans={() => navigate("saved")}
            />
          )}
          <footer className="flow-footer">
            MenúRentable AQP · Planificación para pequeños negocios de comida
          </footer>
        </div>
      </main>
    </div>
  );
}
