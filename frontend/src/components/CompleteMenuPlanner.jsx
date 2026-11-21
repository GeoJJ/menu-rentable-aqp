import React, { useEffect, useState } from "react";
import { apiBase } from "../usePlanning.js";
const money = (v) =>
  new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(
    v,
  );
const quantity = (v) =>
  new Intl.NumberFormat("es-PE", { maximumFractionDigits: 4 }).format(v);
async function request(path, body) {
  const response = await fetch(
    `${apiBase}/${path}`,
    body
      ? {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      : {},
  );
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.detail === "string"
        ? data.detail
        : "Revisa los datos ingresados.",
    );
  return data;
}
export function CompleteMenuPlanner() {
  const [menus, setMenus] = useState([]),
    [selected, setSelected] = useState(""),
    [details, setDetails] = useState(null);
  const [form, setForm] = useState({
    fecha: new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Lima",
    }).format(new Date()),
    cantidad: 30,
    presupuesto: 200,
    insumos: {},
  });
  const [result, setResult] = useState(null),
    [saved, setSaved] = useState([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    Promise.all([request("menus"), request("menu-plans")])
      .then(([m, p]) => {
        setMenus(m);
        setSaved(p);
      })
      .catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    let cancelled = false;
    setDetails(null);
    setResult(null);
    setError("");
    if (selected)
      request(`menus/${selected}/requirements`)
        .then((d) => {
          if (cancelled) return;
          setDetails(d);
          setForm((f) => ({
            ...f,
            insumos: Object.fromEntries(
              d.insumos.map((i) => [
                i.id,
                {
                  existencia: i.existencia ?? "",
                  costo_unitario: i.costo_unitario ?? "",
                  precio_compra: "",
                },
              ]),
            ),
          }));
        })
        .catch((e) => {
          if (!cancelled) setError(e.message);
        });
    return () => {
      cancelled = true;
    };
  }, [selected]);
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
    setResult(null);
    try {
      setResult(await request(`menus/${selected}/calculate`, form));
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
      await request(`menus/${selected}/plans`, form);
      setSaved(await request("menu-plans"));
      setResult(null);
      setError("Plan guardado en PostgreSQL.");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel">
        <h2>Planificar un menú completo</h2>
        <p>
          Elige un menú guardado y las unidades que esperas vender. Los ingresos
          usan su precio único; cada unidad incluye caldo, segundo y refresco.
        </p>
        <p>
          Esta primera planificación usa la cantidad ingresada y supone que se
          vende toda. Las compras se calculan por kilos, litros o unidades
          completos. Usa las cantidades que tienes en tu cocina y los precios
          que pagas a tu proveedor.
        </p>
        {error && <p role="status">{error}</p>}
        <label>
          Menú
          <select
            value={selected}
            disabled={busy}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Seleccionar menú completo</option>
            {menus.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} · {money(m.precio_menu)}
              </option>
            ))}
          </select>
        </label>
        {!menus.length && (
          <p>Registra primero una combinación en Menús completos.</p>
        )}
        {details && (
          <form onSubmit={calculate}>
            <fieldset disabled={busy} style={{ border: 0, padding: 0 }}>
              <div className="form-grid">
                <label>
                  Fecha
                  <input
                    required
                    type="date"
                    value={form.fecha}
                    onChange={(e) => change("fecha", e.target.value)}
                  />
                </label>
                <label>
                  Menús a preparar y vender
                  <input
                    required
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                    value={form.cantidad}
                    onChange={(e) => change("cantidad", Number(e.target.value))}
                  />
                </label>
                <label>
                  Presupuesto de compras (S/)
                  <input
                    required
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.presupuesto}
                    onChange={(e) => change("presupuesto", e.target.value)}
                  />
                </label>
              </div>
              <ul>
                {details.componentes.map((c) => (
                  <li key={c.id}>
                    {c.categoria}: {c.nombre}
                  </li>
                ))}
              </ul>
              <h3>¿Qué tienes y cuánto cuesta comprar?</h3>
              <p>
                Por cada ingrediente, indica cuánto tienes ahora. Si no tienes
                nada, escribe 0. Los precios siempre corresponden a 1 kg, 1
                litro o 1 unidad, según indique la fila.
              </p>
              <div className="context">
                <b>Ejemplo con arroz</b>
                <p>
                  Si tienes 2 kg que compraste a S/4 por kilo, escribe 2 en
                  «Tengo ahora» y 4 en «Lo compré a». Si hoy el proveedor cobra
                  S/4.50 por kilo, escribe 4.50 en «Hoy cuesta». Si una bolsa de
                  5 kg cuesta S/20, el precio por kilo es 20 ÷ 5 = S/4.
                </p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Ingrediente</th>
                      <th>
                        Tengo ahora
                        <small style={{ display: "block" }}>
                          Cantidad disponible en tu cocina
                        </small>
                      </th>
                      <th>
                        Lo compré a
                        <small style={{ display: "block" }}>
                          Precio que pagaste por lo que tienes
                        </small>
                      </th>
                      <th>
                        Hoy cuesta
                        <small style={{ display: "block" }}>
                          Precio actual de tu proveedor
                        </small>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {details.insumos.map((i) => {
                      const unit =
                        i.unidad_codigo === "L"
                          ? "litro"
                          : i.unidad_codigo === "kg"
                            ? "kg"
                            : "unidad";
                      const noStock =
                        form.insumos[i.id]?.existencia !== "" &&
                        Number(form.insumos[i.id]?.existencia) === 0;
                      const labels = {
                        existencia: `Cantidad disponible de ${i.nombre} en ${unit}`,
                        costo_unitario: `Precio pagado por ${unit} de ${i.nombre}`,
                        precio_compra: `Precio actual por ${unit} de ${i.nombre}`,
                      };
                      return (
                        <tr key={i.id}>
                          <th>{i.nombre}</th>
                          {[
                            "existencia",
                            "costo_unitario",
                            "precio_compra",
                          ].map((key) => (
                            <td key={key}>
                              <label>
                                <span>
                                  {key === "existencia"
                                    ? unit
                                    : `S/ por ${unit}`}
                                </span>
                                <input
                                  aria-label={labels[key]}
                                  required
                                  disabled={key === "costo_unitario" && noStock}
                                  type="number"
                                  min="0"
                                  step="0.0001"
                                  placeholder={
                                    key === "existencia"
                                      ? "0 si no tienes"
                                      : key === "costo_unitario"
                                        ? "Precio que pagaste"
                                        : "Precio de hoy"
                                  }
                                  value={form.insumos[i.id]?.[key] ?? ""}
                                  onChange={(e) =>
                                    ingredient(i.id, key, e.target.value)
                                  }
                                />
                              </label>
                              {key === "costo_unitario" && noStock && (
                                <small>
                                  No necesitas llenarlo: no tienes este
                                  ingrediente.
                                </small>
                              )}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p>
                ¿No recuerdas cuánto pagaste por lo que tienes? Puedes usar el
                precio de hoy como aproximación. El margen también será
                aproximado.
              </p>
              <button className="primary">
                {busy ? "Procesando…" : "Calcular porciones y compras"}
              </button>
            </fieldset>
          </form>
        )}
      </section>
      {result && (
        <section className="panel">
          <h2>Resultado del menú completo</h2>
          <div className="summary">
            <span>
              Menús <b>{result.cantidad}</b>
            </span>
            <span>
              Precio único <b>{money(result.menu.precio_menu)}</b>
            </span>
            <span>
              Ingresos estimados <b>{money(result.ingreso_estimado)}</b>
            </span>
            <span>
              Ingredientes consumidos <b>{money(result.costo_ingredientes)}</b>
            </span>
            <span>
              Compra <b>{money(result.compra)}</b>
            </span>
            <span>
              Margen estimado <b>{money(result.margen_estimado)}</b>
            </span>
          </div>
          <p>
            El margen descuenta ingredientes; no incluye alquiler, personal ni
            otros gastos. La compra incluye unidades sobrantes que pueden quedar
            en inventario.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ingrediente</th>
                  <th>Necesario</th>
                  <th>Faltante</th>
                  <th>Unidades de compra</th>
                  <th>Compra</th>
                </tr>
              </thead>
              <tbody>
                {result.insumos.map((i) => (
                  <tr key={i.id}>
                    <th>{i.nombre}</th>
                    <td>
                      {quantity(i.necesario)} {i.unidad}
                    </td>
                    <td>
                      {quantity(i.faltante)} {i.unidad}
                    </td>
                    <td>
                      {i.envases} × 1 {i.unidad}
                    </td>
                    <td>{money(i.compra)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!result.factible && (
            <p role="status">
              La compra supera el presupuesto. Ajusta las cantidades o el
              presupuesto.
            </p>
          )}
          <button
            className="primary"
            disabled={busy || !result.factible}
            onClick={save}
          >
            {busy ? "Guardando…" : "Guardar plan completo"}
          </button>
        </section>
      )}
      <section className="panel">
        <h2>Planes de menús completos guardados</h2>
        {!saved.length && <p>Aún no hay planes guardados.</p>}
        {saved.map((p) => (
          <article key={p.id}>
            <h3>
              {p.fecha} · {p.nombre_oferta}
            </h3>
            <p>
              {p.menus_planificados} menús × {money(p.precio_menu)} ={" "}
              {money(p.ingreso_estimado)} de ingresos estimados. Compra:{" "}
              {money(p.compra)}. Ingredientes: {money(p.costo_ingredientes)}.
              Margen estimado:{" "}
              {money(Number(p.ingreso_estimado) - Number(p.costo_ingredientes))}
              .
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
