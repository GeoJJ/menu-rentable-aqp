import React, { useEffect, useState } from "react";
import { CompleteMenuPlanner } from "./features/planning/CompleteMenuPlanner.jsx";
import { SavedMenuPlans } from "./features/planning/SavedMenuPlans.jsx";
import { Kitchen } from "./features/kitchen/Kitchen.jsx";
import { BusinessResults } from "./features/operations/BusinessResults.jsx";
import { WorkflowGuide } from "./components/FormHelp.jsx";
import { api } from "./services/api.js";
import { Home } from "./features/home/Home.jsx";
import { SiteHeader } from "./components/SiteHeader.jsx";
import { SiteFooter } from "./components/SiteFooter.jsx";
import "./styles/fonts.css";
import "./styles/base.css";
import "./styles/workspace.css";
import "./styles/theme.css";
import "./styles/home.css";
import "./styles/operations.css";
import "./styles/navigation.css";
import "./styles/cards.css";
import "./styles/footer.css";
import "./styles/buttons.css";
export default function App() {
  const [revision, setRevision] = useState(0);
  const [resultsKey, setResultsKey] = useState(0);
  function navigate(next) {
    setPage(next);
    if (next === "saved") setJustSaved(null);
    if (next === "results") setResultsKey((v) => v + 1);
    window.scrollTo(0, 0);
  }
  const [page, setPage] = useState("home"),
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
    <div
      className={`app-layout ${page === "home" ? "landing-layout" : "workspace-layout"}`}
    >
      <a className="skip-content" href="#main-content">
        Ir al contenido
      </a>
      <SiteHeader page={page} onGo={navigate} status={status} />
      <main id="main-content">
        {page !== "home" && (
          <div className="top workspace-location">
            <span>
              MenúRentable AQP <b>/</b>{" "}
              {page === "home"
                ? "Inicio"
                : page === "plan"
                  ? "Planificación"
                  : page === "kitchen"
                    ? "Mi cocina"
                    : page === "results"
                      ? "Compras y resultados"
                      : "Mis planes"}
            </span>
            <span className="location">Arequipa, Perú</span>
          </div>
        )}
        <div className="content">
          {page === "home" && <Home onGo={navigate} />}
          {page !== "home" && (
            <>
              <div className="flow-welcome">
                <span className="flow-eyebrow">
                  DEL MENÚ A LA LISTA DE COMPRAS
                </span>
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
            </>
          )}
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
        </div>
      </main>
      <SiteFooter page={page} onGo={navigate} />
    </div>
  );
}
