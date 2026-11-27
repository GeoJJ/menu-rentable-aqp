import { usePagination } from "../../hooks/usePagination.js";
import { Pagination } from "../../components/Pagination.jsx";
import React, { useEffect, useState } from "react";
import { api } from "../../services/api.js";
import { MenuPlanSummary } from "./MenuPlanSummary.jsx";

export function PlanRevisionHistory({ plan }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState(null);
  const [error, setError] = useState("");
  const pagination = usePagination(
    history?.revisiones ?? [],
    `${plan.id}:${plan.version}`,
  );
  useEffect(() => {
    if (!expanded) return;
    const controller = new AbortController();
    setError("");
    api(`menu-plans/${plan.id}/revisions`, { signal: controller.signal })
      .then(setHistory)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [expanded, plan.id, plan.version]);
  return (
    <section className="panel flow-panel">
      <h2>Historial del plan</h2>
      <p>
        Versión actual: {plan.version}. Las versiones anteriores se conservan
        para consulta.
      </p>
      {plan.version > 1 ? (
        <details
          className="flow-help"
          onToggle={(e) => setExpanded(e.currentTarget.open)}
        >
          <summary>Ver versiones anteriores</summary>
          {error && (
            <p className="flow-error" role="alert">
              {error}
            </p>
          )}
          {!history && !error && <p role="status">Cargando historial…</p>}
          {pagination.items.map((revision) => (
            <details key={revision.version} className="flow-help">
              <summary>
                Versión {revision.version} · {revision.resumen.fecha} ·{" "}
                {revision.resumen.cantidad} menús
              </summary>
              <p>
                <strong>
                  Motivo del cambio a la versión {revision.version + 1}:
                </strong>{" "}
                {revision.motivo}
              </p>
              <p>
                Reemplazada el{" "}
                {new Intl.DateTimeFormat("es-PE", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "America/Lima",
                }).format(new Date(revision.reemplazado_en))}{" "}
                (hora de Perú).
              </p>
              <MenuPlanSummary plan={revision.resumen} />
            </details>
          ))}
          <Pagination pagination={pagination} label="versiones del plan" />
        </details>
      ) : (
        <p>Este plan todavía no tiene cambios guardados.</p>
      )}
    </section>
  );
}
