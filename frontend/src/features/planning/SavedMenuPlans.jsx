import React, { useEffect, useState } from "react";
import { api, money, downloadFile, matchesText } from "../../services/api.js";
import { SectionIntro } from "../../components/SectionIntro.jsx";
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
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dates, setDates] = useState({ from: "", to: "" });
  const today = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Lima",
  }).format(new Date());
  const states = [
    ["all", "Todos"],
    ["planificado", "Pendientes"],
    ["cerrado", "Cerrados"],
    ["cancelado", "Cancelados"],
  ];
  const filtered = plans.filter(
    (p) =>
      (filter === "all" || p.estado === filter) &&
      matchesText(p.nombre_oferta, search) &&
      (!dates.from || p.fecha >= dates.from) &&
      (!dates.to || p.fecha <= dates.to),
  );
  function clearFilters() {
    setFilter("all");
    setSearch("");
    setDates({ from: "", to: "" });
  }
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
  async function open(id, focusClosing = false, edit = false) {
    setOpening(true);
    setError("");
    setNotice("");
    try {
      setDetail(await api(`menu-plans/${id}`));
      setEditing(edit);
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
            {justSaved?.id === detail.id && detail.estado === "planificado" && (
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
          <SectionIntro image="cierra" title="Cada día tiene su siguiente paso">
            Edita los pendientes, registra el cierre cuando termines de vender y
            consulta los días cerrados. Los cancelados se conservan como
            historial.
          </SectionIntro>
          <h2>Planes guardados</h2>
          <p>
            Un plan muestra lo que pensabas preparar. Cuando termines de vender
            ese día, pulsa Cerrar este día para registrar lo que realmente pasó.
            No cierres el plan antes de cocinar o vender. Puedes editar los
            datos mientras siga pendiente de cierre.
          </p>
          {loading && <p role="status">Cargando planes…</p>}
          {!loading && plans.length > 0 && (
            <>
              <div
                className="status-filters"
                role="group"
                aria-label="Filtrar planes por estado"
              >
                {states.map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                    <span>
                      {value === "all"
                        ? plans.length
                        : plans.filter((p) => p.estado === value).length}
                    </span>
                  </button>
                ))}
              </div>
              <div className="record-filters">
                <label>
                  Buscar por menú
                  <input
                    type="search"
                    value={search}
                    placeholder="Por ejemplo: lentejas"
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </label>
                <label>
                  Desde
                  <input
                    type="date"
                    value={dates.from}
                    onChange={(e) =>
                      setDates({ ...dates, from: e.target.value })
                    }
                  />
                </label>
                <label>
                  Hasta
                  <input
                    type="date"
                    min={dates.from}
                    value={dates.to}
                    onChange={(e) => setDates({ ...dates, to: e.target.value })}
                  />
                </label>
                <button className="secondary" onClick={clearFilters}>
                  Limpiar filtros
                </button>
              </div>
              <p className="record-count" role="status">
                Mostrando {filtered.length} de {plans.length} planes.
              </p>
              {!filtered.length && (
                <div className="empty-records">
                  <h3>No hay planes con estos filtros</h3>
                  <p>
                    Prueba otra fecha, otro nombre o muestra todos los estados.
                  </p>
                  <button className="secondary" onClick={clearFilters}>
                    Mostrar todos los planes
                  </button>
                </div>
              )}
            </>
          )}
          {!loading && !plans.length && (
            <>
              <p>Todavía no tienes planes guardados.</p>
              <button className="primary" onClick={onNew}>
                Preparar mi primer plan
              </button>
            </>
          )}
          <div className="saved-plans">
            {filtered.map((p) => (
              <article key={p.id}>
                <div>
                  <span className="flow-eyebrow">{p.fecha}</span>
                  <h3>{p.nombre_oferta}</h3>
                  <span className={`state-pill state-${p.estado}`}>
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
                  <p className="next-step">
                    {p.estado === "cerrado"
                      ? "Día completado. Revisa su cierre y descarga el plan."
                      : p.estado === "cancelado"
                        ? "Conservado como historial. Para otro día, prepara un nuevo plan."
                        : "Puedes ajustar el plan o revisar las compras antes de cocinar."}
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
                    {p.estado === "cerrado"
                      ? "Ver plan del día cerrado →"
                      : "Ver plan y compras →"}
                  </button>
                  {(p.estado ?? "planificado") === "planificado" && (
                    <button
                      className="secondary"
                      disabled={opening}
                      onClick={() => open(p.id, false, true)}
                    >
                      Editar este plan
                    </button>
                  )}
                  {p.estado === "cerrado" && (
                    <button
                      className="primary"
                      disabled={opening}
                      onClick={() => open(p.id, true)}
                    >
                      Ver cierre del día
                    </button>
                  )}
                  {(p.estado ?? "planificado") === "planificado" && (
                    <button
                      className="primary"
                      disabled={opening || p.fecha > today}
                      title={
                        p.fecha > today
                          ? "El cierre se registra el día del plan o después, al terminar de vender."
                          : undefined
                      }
                      onClick={() => open(p.id, true)}
                    >
                      {p.fecha > today
                        ? `Cierre desde ${p.fecha}`
                        : "Cerrar este día"}
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
