import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { CompleteMenuPlanner } from "./components/CompleteMenuPlanner.jsx";
import { SavedMenuPlans } from "./components/SavedMenuPlans.jsx";
import { Kitchen } from "./components/Kitchen.jsx";
import { api } from "./services/api.js";
import "./styles/style.css";
import "./styles/theme.css";
import "./styles/journey.css";
function App() {
  const [revision, setRevision] = useState(0);
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
            ◈
          </span>
          <div>
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
        </nav>
        <div className="sidebar-note">
          <i
            style={{
              background: status === "connected" ? "#cad68d" : "#c3b492",
            }}
          />
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
                  : "Tus planes, en un solo lugar."}
            </h1>
            <p>
              {page === "plan"
                ? "Elige tu menú, indica cuántos prepararás y calcula las compras antes de empezar."
                : page === "kitchen"
                  ? "Mantén tus recetas, existencias y precios al día."
                  : "Revisa lo planificado y descarga lo que necesitas comprar."}
            </p>
          </div>
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
            />
          )}
          {page === "kitchen" && (
            <Kitchen onChanged={() => setRevision((value) => value + 1)} />
          )}
          <footer className="flow-footer">
            MenúRentable AQP · Planificación para pequeños negocios de comida
          </footer>
        </div>
      </main>
    </div>
  );
}
createRoot(document.getElementById("root")).render(<App />);
