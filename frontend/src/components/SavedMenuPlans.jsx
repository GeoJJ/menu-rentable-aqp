import React, { useEffect, useState } from "react";
import { api, money } from "../services/api.js";
import { MenuPlanSummary } from "./MenuPlanSummary.jsx";
export function SavedMenuPlans({ justSaved, onNew }) {
  const [plans, setPlans] = useState([]),
    [detail, setDetail] = useState(justSaved ?? null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true),
    [opening, setOpening] = useState(false);
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
  async function open(id) {
    setOpening(true);
    setError("");
    try {
      setDetail(await api(`menu-plans/${id}`));
      window.scrollTo(0, 0);
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
      {detail ? (
        <section className="panel flow-panel">
          {justSaved?.id === detail.id && (
            <p className="notice" role="status">
              Tu plan quedó guardado. Aquí puedes consultar y descargar la lista
              de compras.
            </p>
          )}
          <MenuPlanSummary plan={detail} />
          <div className="flow-actions">
            <button className="secondary" onClick={() => setDetail(null)}>
              ← Todos mis planes
            </button>
            <button className="secondary" onClick={download}>
              Descargar lista y resumen CSV
            </button>
            <button className="primary" onClick={onNew}>
              Preparar otro plan
            </button>
          </div>
        </section>
      ) : (
        <section className="panel flow-panel">
          <h2>Planes guardados</h2>
          <p>
            Consulta el menú, sus costos y la lista de compras tal como los
            guardaste.
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
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
