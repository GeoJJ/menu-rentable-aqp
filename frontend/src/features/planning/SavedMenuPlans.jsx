import React, { useEffect, useState } from "react";
import { api, money, downloadFile } from "../../services/api.js";
import { MenuPlanSummary } from "./MenuPlanSummary.jsx";
import { DayClosing } from "../operations/DayClosing.jsx";
import { CompleteMenuPlanner } from "./CompleteMenuPlanner.jsx";
import { PlanRevisionHistory } from "./PlanRevisionHistory.jsx";
export function SavedMenuPlans({
  justSaved,
  onNew,
  onChanged = () => {},
  onPurchases,
}) {
  const [plans, setPlans] = useState([]),
    [detail, setDetail] = useState(justSaved ?? null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [opening, setOpening] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [notice, setNotice] = useState("");
  async function changed(plan) {
    setDetail(plan);
    setEditing(false);
    setNotice(
      `Cambios guardados. Estás viendo la versión ${plan.version} de tu plan.`,
    );
    window.scrollTo(0, 0);
    onChanged();
    try {
      setPlans(await api("menu-plans"));
    } catch (e) {
      setError(e.message);
    }
  }
  async function downloadPdf() {
    setPdfBusy(true);
    setError("");
    try {
      await downloadFile(
        `menu-plans/${detail.id}/report.pdf`,
        `plan-menu-${detail.fecha}.pdf`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPdfBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    api("menu-plans", { signal: controller.signal })
      .then(setPlans)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);
  async function open(id, focusClosing = false) {
    setOpening(true);
    setError("");
    setNotice("");
    try {
      setDetail(await api(`menu-plans/${id}`));
      window.scrollTo(0, 0);
      if (focusClosing)
        setTimeout(
          () =>
            document
              .getElementById("day-closing")
              ?.scrollIntoView({ behavior: "smooth", block: "start" }),
          0,
        );
    } catch (e) {
      setError(e.message);
    } finally {
      setOpening(false);
    }
  }
  function download() {
    const rows = [
      ["Fecha", detail.fecha],
      ["Menú", detail.menu.nombre],
      ["Precio por menú", detail.menu.precio_menu],
      ["Menús", detail.cantidad],
      ["Ingresos estimados", detail.ingreso_estimado],
      ["Compra", detail.compra],
      ["Costo de ingredientes", detail.costo_ingredientes],
      ["Margen estimado", detail.margen_estimado],
      [],
      [
        "Ingrediente",
        "Unidad",
        "Necesario",
        "Faltante",
        "Unidades a comprar",
        "Compra",
      ],
      ...detail.insumos.map((i) => [
        i.nombre,
        i.unidad,
        i.necesario,
        i.faltante,
        i.envases,
        i.compra,
      ]),
    ];
    const content = rows
      .map((row) =>
        row
          .map((cell) => '"' + String(cell ?? "").replaceAll('"', '""') + '"')
          .join(","),
      )
      .join("\r\n");
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + content], { type: "text/csv;charset=utf-8" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `plan-menu-${detail.fecha}.csv`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <>
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      {editing && detail ? (
        <CompleteMenuPlanner
          key={`${detail.id}-${detail.version}`}
          editPlan={detail}
          onSaved={changed}
          onCancel={() => setEditing(false)}
        />
      ) : detail ? (
        <>
          <section className="panel flow-panel">
            {notice && (
              <p className="notice" role="status">
                {notice}
              </p>
            )}
            {justSaved?.id === detail.id && (
              <p className="notice" role="status">
                Tu plan quedó guardado como una estimación. Todavía no registra
                compras ni ventas. Si compras ingredientes, regístralos en
                Compras y resultados. Cuando termines de vender, completa el
                cierre más abajo.
              </p>
            )}
            <MenuPlanSummary plan={detail} />
            <div className="flow-actions">
              <button
                className="secondary"
                onClick={() => {
                  setDetail(null);
                  setNotice("");
                }}
              >
                ← Todos mis planes
              </button>
              {detail.estado === "planificado" && (
                <button
                  className="primary"
                  onClick={() => {
                    setEditing(true);
                    setNotice("");
                    setError("");
                    window.scrollTo(0, 0);
                  }}
                >
                  Editar plan pendiente
                </button>
              )}
              <button className="secondary" onClick={download}>
                Descargar lista y resumen CSV
              </button>
              <button
                className="secondary"
                disabled={pdfBusy}
                onClick={downloadPdf}
              >
                {pdfBusy ? "Generando PDF…" : "Descargar plan y compras PDF"}
              </button>
              <button className="primary" onClick={onNew}>
                Preparar otro plan
              </button>
            </div>
          </section>
          <DayClosing
            key={`closing-${detail.id}-${detail.version}`}
            plan={detail}
            onPurchases={onPurchases}
            onChanged={() => {
              open(detail.id);
              api("menu-plans")
                .then(setPlans)
                .catch((e) => setError(e.message));
              onChanged();
            }}
          />
          <PlanRevisionHistory
            key={`history-${detail.id}-${detail.version}`}
            plan={detail}
          />
        </>
      ) : (
        <section className="panel flow-panel">
          <h2>Planes guardados</h2>
          <p>
            Un plan muestra lo que pensabas preparar. Cuando termines de vender
            ese día, pulsa Cerrar este día para registrar lo que realmente pasó.
            No cierres el plan antes de cocinar o vender. Puedes editar los
            datos mientras siga pendiente de cierre.
          </p>
          {loading && <p role="status">Cargando planes…</p>}
          {!loading && !plans.length && (
            <>
              <p>Todavía no tienes planes guardados.</p>
              <button className="primary" onClick={onNew}>
                Preparar mi primer plan
              </button>
            </>
          )}
          <div className="saved-plans">
            {plans.map((p) => (
              <article key={p.id}>
                <div>
                  <span className="flow-eyebrow">{p.fecha}</span>
                  <h3>{p.nombre_oferta}</h3>
                  <span className="state-pill">
                    {{
                      planificado: "Pendiente de cierre",
                      cerrado: "Día cerrado",
                      cancelado: "Plan cancelado",
                    }[p.estado] ?? "Pendiente de cierre"}
                  </span>
                  <p>
                    {p.menus_planificados} menús · {money(p.precio_menu)} por
                    menú
                  </p>
                </div>
                <div>
                  <span>Compra estimada</span>
                  <strong>{money(p.compra)}</strong>
                  <button
                    className="secondary"
                    disabled={opening}
                    onClick={() => open(p.id)}
                  >
                    Ver plan y compras →
                  </button>
                  {(p.estado ?? "planificado") === "planificado" && (
                    <button
                      className="primary"
                      disabled={opening}
                      onClick={() => open(p.id, true)}
                    >
                      Cerrar este día
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
