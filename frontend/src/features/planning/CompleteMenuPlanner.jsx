import React, { useEffect, useRef, useState } from "react";
import { api, money } from "../../services/api.js";
import { MenuOffers } from "./MenuOffers.jsx";
import { MenuPlanSummary } from "./MenuPlanSummary.jsx";
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(
    new Date(),
  );
export function CompleteMenuPlanner({ onSaved, revision = 0 }) {
  const [step, setStep] = useState(0),
    [menus, setMenus] = useState([]),
    [selected, setSelected] = useState(""),
    [details, setDetails] = useState(null),
    [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(null),
    [menuRevision, setMenuRevision] = useState(0);
  const [loading, setLoading] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [result, setResult] = useState(null);
  const [form, setForm] = useState({
    fecha: today(),
    cantidad: 30,
    presupuesto: 200,
    insumos: {},
  });
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
          setForm((f) => ({
            ...f,
            insumos: Object.fromEntries(
              d.insumos.map((i) => [
                i.id,
                {
                  existencia: i.existencia ?? "",
                  costo_unitario:
                    i.existencia === 0 ? "0" : (i.costo_unitario ?? ""),
                  precio_compra: i.precio_compra ?? "",
                },
              ]),
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
  }, [selected, revision, menuRevision]);
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
  async function save() {
    setBusy(true);
    setError("");
    try {
      const saved = await api(`menus/${selected}/plans`, { body: form });
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
              <p>
                Para {form.cantidad} menús de {details?.menu.nombre}. Indica
                cuánto tienes en tu cocina y el precio por kilo, litro o unidad.
              </p>
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
          <>
            <MenuPlanSummary plan={result} />
            {!result.factible && (
              <p className="flow-error" role="alert">
                La compra supera tu presupuesto. Vuelve para ajustar la cantidad
                o el presupuesto.
              </p>
            )}
            <div className="flow-actions">
              <button
                className="secondary"
                disabled={busy}
                onClick={() => next(2)}
              >
                ← Revisar datos
              </button>
              <button
                className="primary"
                disabled={busy || !result.factible}
                onClick={save}
              >
                {busy ? "Guardando…" : "Guardar plan y ver resumen"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
