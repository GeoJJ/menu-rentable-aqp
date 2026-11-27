import React, { useEffect, useRef, useState } from "react";
import { api, money } from "../../services/api.js";
import { MenuOffers } from "./MenuOffers.jsx";
import { MenuPlanSummary } from "./MenuPlanSummary.jsx";
import { SectionIntro } from "../../components/SectionIntro.jsx";
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(
    new Date(),
  );
export function CompleteMenuPlanner({
  onSaved,
  revision = 0,
  editPlan = null,
  onCancel,
  onReferences,
}) {
  const [step, setStep] = useState(0),
    [menus, setMenus] = useState([]),
    [selected, setSelected] = useState(
      editPlan ? String(editPlan.menu.id) : "",
    ),
    [details, setDetails] = useState(null),
    [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null),
    [menuRevision, setMenuRevision] = useState(0);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const [form, setForm] = useState({
    fecha: editPlan?.fecha ?? today(),
    cantidad: editPlan?.cantidad ?? 30,
    presupuesto: editPlan?.presupuesto ?? 200,
    insumos: {},
  });
  const [reason, setReason] = useState("");
  const title = useRef(null);
  const [forecast, setForecast] = useState(null);
  useEffect(() => setForecast(null), [selected, form.fecha]);
  async function suggest() {
    setBusy(true);
    setError("");
    try {
      setForecast(await api(`menus/${selected}/forecast?fecha=${form.fecha}`));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  useEffect(() => {
    const controller = new AbortController();
    api("menus", { signal: controller.signal })
      .then(setMenus)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    title.current?.focus();
  }, [step]);
  useEffect(() => {
    const controller = new AbortController();
    setDetails(null);
    setResult(null);
    setStep((value) => (value === 3 ? 2 : value));
    if (selected) {
      setLoading(true);
      api(`menus/${selected}/requirements`, { signal: controller.signal })
        .then((d) => {
          setDetails(d);
          const original =
            String(editPlan?.menu.id) === selected
              ? Object.fromEntries(editPlan.insumos.map((i) => [i.id, i]))
              : {};
          setForm((f) => ({
            ...f,
            insumos: Object.fromEntries(
              d.insumos.map((current) => {
                const i = original[current.id] ?? current;
                return [
                  i.id,
                  {
                    existencia: i.existencia ?? "",
                    costo_unitario:
                      i.existencia === 0 ? "0" : (i.costo_unitario ?? ""),
                    precio_compra: i.precio_compra ?? "",
                  },
                ];
              }),
            ),
          }));
        })
        .catch((e) => {
          if (e.name !== "AbortError") setError(e.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setLoading(false);
        });
    }
    return () => controller.abort();
  }, [selected, revision, menuRevision, editPlan]);
  function next(value) {
    setError("");
    setStep(value);
  }
  function change(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setResult(null);
    setError("");
  }
  function ingredient(id, key, value) {
    setForm((f) => ({
      ...f,
      insumos: {
        ...f.insumos,
        [id]: {
          ...f.insumos[id],
          [key]: value,
          ...(key === "existencia" && value !== "" && Number(value) === 0
            ? { costo_unitario: "0" }
            : {}),
        },
      },
    }));
    setResult(null);
    setError("");
  }
  async function calculate(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      setResult(await api(`menus/${selected}/calculate`, { body: form }));
      setStep(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function save(event) {
    event?.preventDefault();
    setBusy(true);
    setError("");
    try {
      const saved = editPlan
        ? await api(`menu-plans/${editPlan.id}`, {
            method: "PUT",
            body: {
              ...form,
              menu_id: Number(selected),
              version: editPlan.version,
              motivo: reason.trim(),
            },
          })
        : await api(`menus/${selected}/plans`, { body: form });
      onSaved(saved);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  function created(menu) {
    setMenus((m) => [menu, ...m.filter((item) => item.id !== menu.id)]);
    setSelected(String(menu.id));
    setMenuRevision((value) => value + 1);
    setEditing(null);
    setCreating(false);
    setError("");
  }
  return (
    <div className="journey">
      {!editPlan && step === 0 && (
        <SectionIntro
          image="planifica"
          title="Antes de comprar, organiza tu menú"
        >
          Aquí preparas una estimación. Elige una combinación, revisa las
          porciones y calcula qué ingredientes necesitarías comprar.
        </SectionIntro>
      )}
      {editPlan && (
        <section className="panel flow-panel">
          <h2>Editar plan pendiente</h2>
          <p>
            Plan del {editPlan.fecha} · versión {editPlan.version}. Revisa los
            datos y el nuevo cálculo antes de guardar.
          </p>
          <p className="example-note">
            Se usarán las recetas y el precio actuales del menú elegido. Para el
            menú original, los datos de ingredientes empiezan con lo que
            guardaste. Actualízalos si hace falta.
          </p>
          <button
            type="button"
            className="secondary"
            disabled={busy}
            onClick={onCancel}
          >
            Cancelar edición y volver al plan
          </button>
        </section>
      )}
      <ol className="flow-steps" aria-label="Progreso del plan">
        {["Menú", "Cantidad", "Insumos", "Resultado"].map((label, index) => (
          <li
            key={label}
            aria-current={step === index ? "step" : undefined}
            className={index === step ? "current" : index < step ? "done" : ""}
          >
            <span>{index < step ? "✓" : index + 1}</span>
            {label}
          </li>
        ))}
      </ol>
      {details && step > 0 && (
        <aside
          className="planning-context"
          aria-label="Resumen de lo que estás planificando"
        >
          <div>
            <span className="flow-eyebrow">TU MENÚ COMPLETO</span>
            <strong>{details.menu.nombre}</strong>
            <small>
              {details.componentes.map((c) => c.nombre).join(" · ")}
            </small>
          </div>
          <div>
            <span>{form.fecha}</span>
            <strong>
              {form.cantidad} menús · {money(details.menu.precio_menu)} c/u
            </strong>
            <small>Presupuesto de compras: {money(form.presupuesto)}</small>
          </div>
        </aside>
      )}
      <section className="panel flow-panel">
        <h2 ref={title} tabIndex={-1}>
          {
            [
              "Elige qué vas a servir",
              "¿Cuántos menús prepararás?",
              "Revisa lo que tienes y lo que cuesta",
              "Revisa tu plan antes de guardarlo",
            ][step]
          }
        </h2>
        {error && (
          <p className="flow-error" role="alert">
            {error}
          </p>
        )}
        {step === 0 && (
          <>
            <p>
              Usa una combinación guardada o crea una aquí. Cada menú incluye
              caldo, segundo y refresco con un solo precio.
            </p>
            {loading && <p role="status">Cargando menú…</p>}
            {!creating && (
              <>
                <label>
                  Tu menú
                  <select
                    value={selected}
                    onChange={(e) => {
                      setSelected(e.target.value);
                      setError("");
                    }}
                  >
                    <option value="">Seleccionar una combinación</option>
                    {editPlan &&
                      !menus.some((m) => String(m.id) === selected) &&
                      selected && (
                        <option value={selected} disabled>
                          Menú original no disponible: elige otro
                        </option>
                      )}
                    {menus.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nombre} · {money(m.precio_menu)}
                      </option>
                    ))}
                  </select>
                </label>
                {details && (
                  <ul className="flow-courses">
                    {[...details.componentes]
                      .sort(
                        (a, b) =>
                          ["caldo", "segundo", "refresco"].indexOf(
                            a.categoria,
                          ) -
                          ["caldo", "segundo", "refresco"].indexOf(b.categoria),
                      )
                      .map((c) => (
                        <li key={c.id}>
                          <span>{c.categoria}</span>
                          <b>{c.nombre}</b>
                        </li>
                      ))}
                  </ul>
                )}
                <div className="flow-actions">
                  {!editPlan && (
                    <>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => {
                          setEditing(null);
                          setCreating(true);
                          setError("");
                        }}
                      >
                        + Crear otra combinación
                      </button>
                      {details && (
                        <button
                          type="button"
                          className="secondary"
                          disabled={loading}
                          onClick={() => {
                            setEditing({
                              ...details.menu,
                              componentes: details.componentes,
                            });
                            setCreating(true);
                            setError("");
                          }}
                        >
                          Editar este menú
                        </button>
                      )}
                    </>
                  )}
                  <button
                    className="primary"
                    disabled={!details || loading}
                    onClick={() => next(1)}
                  >
                    Continuar con este menú →
                  </button>
                </div>
              </>
            )}
            {creating && (
              <MenuOffers
                key={editing?.id ?? "new"}
                menu={editing}
                onCreated={created}
                onCancel={() => {
                  setCreating(false);
                  setEditing(null);
                }}
              />
            )}
          </>
        )}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              next(2);
            }}
          >
            <p>
              {details?.menu.nombre} · {money(details?.menu.precio_menu)} por
              menú completo.
            </p>
            <p className="example-note">
              Llena este paso antes de cocinar. Por ejemplo: si piensas vender
              30 menús y puedes destinar S/200 a ingredientes, escribe 30 en
              cantidad y 200 en presupuesto. Aquí todavía no estás registrando
              ventas ni compras.
            </p>
            <div className="form-grid">
              <label>
                ¿Para qué día?
                <input
                  type="date"
                  required
                  value={form.fecha}
                  onChange={(e) => change("fecha", e.target.value)}
                />
              </label>
              <label>
                Menús que esperas vender
                <input
                  type="number"
                  required
                  min="1"
                  max="100000"
                  step="1"
                  value={form.cantidad}
                  onChange={(e) => change("cantidad", Number(e.target.value))}
                />
                <button
                  type="button"
                  className="secondary"
                  disabled={busy}
                  onClick={suggest}
                >
                  Consultar sugerencia histórica
                </button>
                {forecast && (
                  <>
                    <span>
                      {forecast.metodo} · {forecast.muestras} cierres
                      comparables. {forecast.advertencia}
                    </span>
                    {forecast.cantidad_sugerida > 0 && (
                      <button
                        type="button"
                        className="secondary"
                        onClick={() =>
                          change("cantidad", forecast.cantidad_sugerida)
                        }
                      >
                        Usar {forecast.cantidad_sugerida} menús sugeridos
                      </button>
                    )}
                  </>
                )}
              </label>
              <label>
                ¿Cuánto puedes gastar en compras? (S/)
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={form.presupuesto}
                  onChange={(e) => change("presupuesto", e.target.value)}
                />
              </label>
            </div>
            <p className="flow-footnote">
              La cantidad es tu estimación de ventas. El resultado supondrá que
              vendes todos esos menús.
            </p>
            <div className="flow-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => next(0)}
              >
                ← Cambiar menú
              </button>
              <button className="primary">Revisar ingredientes →</button>
            </div>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={calculate}>
            <fieldset disabled={busy}>
              <div className="planning-insumos-intro">
                <p>
                  Para {form.cantidad} menús de {details?.menu.nombre}. Indica
                  cuánto tienes en tu cocina y el precio por kilo, litro o unidad.
                </p>
                {onReferences && (
                  <button type="button" className="primary" onClick={onReferences}>
                    Referencias externas
                  </button>
                )}
              </div>
              <details className="flow-help">
                <summary>¿Cómo lleno estos datos?</summary>
                <p>
                  Si tienes 2 kg de arroz que compraste a S/4 por kilo, escribe
                  2 en «Cantidad disponible» y 4 en «Costo de lo que ya tienes».
                  Si hoy tu proveedor cobra S/4.50 por kilo, escribe 4.50 en
                  «Precio actual para comprar».
                </p>
                <p>
                  Si no tienes, escribe 0 y no necesitas llenar el precio
                  anterior. Si no recuerdas cuánto pagaste, puedes usar el
                  precio de hoy como aproximación. Una bolsa de 5 kg a S/20
                  equivale a S/4 por kilo.
                </p>
              </details>
              <p className="stock-note">
                Revisar estos datos sirve para calcular el plan. Si ya tienes
                existencias registradas, cambiarlas aquí no corrige tu despensa:
                haz el conteo en Mi cocina. Una compra nueva se registra
                después, en Compras y resultados.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>Cantidad disponible</th>
                      <th>Costo de lo que ya tienes</th>
                      <th>Precio actual para comprar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {details?.insumos.map((i) => {
                      const unit =
                        i.unidad_codigo === "L"
                          ? "litro"
                          : i.unidad_codigo === "kg"
                            ? "kg"
                            : "unidad";
                      const noStock =
                        form.insumos[i.id]?.existencia !== "" &&
                        Number(form.insumos[i.id]?.existencia) === 0;
                      return (
                        <tr key={i.id}>
                          <th>{i.nombre}</th>
                          {[
                            "existencia",
                            "costo_unitario",
                            "precio_compra",
                          ].map((key, index) => (
                            <td key={key}>
                              <label>
                                <span>
                                  {index === 0 ? unit : `S/ por ${unit}`}
                                </span>
                                <input
                                  aria-label={`${["Cantidad disponible", "Costo de lo que ya tienes", "Precio actual para comprar"][index]}: ${i.nombre}`}
                                  required
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  disabled={key === "costo_unitario" && noStock}
                                  placeholder={
                                    index === 0
                                      ? "0 si no tienes"
                                      : "Precio por " + unit
                                  }
                                  value={form.insumos[i.id]?.[key] ?? ""}
                                  onChange={(e) =>
                                    ingredient(i.id, key, e.target.value)
                                  }
                                />
                              </label>
                              {key === "costo_unitario" && noStock && (
                                <small>Sin existencias</small>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flow-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => next(1)}
                >
                  ← Cambiar cantidad
                </button>
                <button className="primary">
                  {busy ? "Calculando…" : "Calcular mi plan →"}
                </button>
              </div>
            </fieldset>
          </form>
        )}
        {step === 3 && result && (
          <form onSubmit={save}>
            {editPlan && (
              <>
                <h3>Revisa qué cambiará</h3>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Dato</th>
                        <th>Guardado</th>
                        <th>Nuevo cálculo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["Fecha", editPlan.fecha, result.fecha],
                        ["Menú", editPlan.menu.nombre, result.menu.nombre],
                        [
                          "Precio por menú",
                          money(editPlan.menu.precio_menu),
                          money(result.menu.precio_menu),
                        ],
                        [
                          "Cantidad de menús",
                          editPlan.cantidad,
                          result.cantidad,
                        ],
                        [
                          "Presupuesto",
                          money(editPlan.presupuesto),
                          money(result.presupuesto),
                        ],
                        [
                          "Compra estimada",
                          money(editPlan.compra),
                          money(result.compra),
                        ],
                        [
                          "Costo de ingredientes",
                          money(editPlan.costo_ingredientes),
                          money(result.costo_ingredientes),
                        ],
                        [
                          "Margen estimado",
                          money(editPlan.margen_estimado),
                          money(result.margen_estimado),
                        ],
                      ].map(([label, before, after]) => (
                        <tr key={label}>
                          <th>{label}</th>
                          <td>{before}</td>
                          <td>{after}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <MenuPlanSummary plan={result} />
            {editPlan && (
              <label>
                Motivo del cambio
                <textarea
                  required
                  minLength={3}
                  maxLength={500}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Por ejemplo: recibí una reserva y prepararé más menús."
                />
                <small>
                  Se guardará junto con la versión anterior para que puedas
                  consultar lo que cambió.
                </small>
              </label>
            )}
            {!result.factible && (
              <p className="flow-error" role="alert">
                La compra supera tu presupuesto. Vuelve para ajustar la cantidad
                o el presupuesto.
              </p>
            )}
            <div className="flow-actions">
              <button
                type="button"
                className="secondary"
                disabled={busy}
                onClick={() => next(2)}
              >
                ← Revisar datos
              </button>
              <button
                className="primary"
                disabled={
                  busy ||
                  !result.factible ||
                  (editPlan && reason.trim().length < 3)
                }
              >
                {busy
                  ? "Guardando…"
                  : editPlan
                    ? "Guardar cambios del plan"
                    : "Guardar plan y ver resumen"}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
