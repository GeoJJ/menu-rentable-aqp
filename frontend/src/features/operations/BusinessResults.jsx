import React, { useEffect, useState } from "react";
import {
  api,
  apiBase,
  money,
  amount,
  downloadFile,
} from "../../services/api.js";
import { GuidedField } from "../../components/FormHelp.jsx";
const today = () =>
  new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Lima" }).format(
    new Date(),
  );
const movementNames = {
  compra: "Compra recibida",
  merma: "Pérdida de ingrediente",
  consumo: "Uso al cerrar el día",
  ajuste: "Conteo de despensa",
};
const unitHints = {
  kg: "Escribe kilos: una bolsa de 5 kg es 5; 500 gramos es 0.5.",
  L: "Escribe litros: dos botellas de 1 L son 2; 500 ml es 0.5.",
  unidad: "Escribe cuántas piezas recibiste: una docena son 12 unidades.",
};

export function BusinessResults({ onChanged, onViewPlans = () => {} }) {
  const [tab, setTab] = useState("purchase"),
    [selected, setSelected] = useState("");
  const [ingredients, setIngredients] = useState([]),
    [movements, setMovements] = useState([]),
    [report, setReport] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [pdfBusy, setPdfBusy] = useState(false);
  const [range, setRange] = useState({
    desde: today().slice(0, 8) + "01",
    hasta: today(),
  });
  const ingredient = ingredients.find((i) => String(i.id) === selected);
  const unit = ingredient?.unidad_codigo ?? "";
  const buying = tab === "purchase";
  async function load() {
    const [i, m] = await Promise.all([
      api("ingredients"),
      api("inventory/movements"),
    ]);
    setIngredients(i);
    setMovements(m);
  }
  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);
  function changeTab(next) {
    setTab(next);
    setSelected("");
    setError("");
    setMessage("");
  }
  async function movement(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const element = event.currentTarget,
      f = new FormData(element),
      name = ingredient.nombre,
      unitCode = unit;
    try {
      const result = await api("inventory/movements", {
        body: {
          ingrediente_id: Number(selected),
          tipo: buying ? "compra" : "merma",
          cantidad: f.get("cantidad"),
          ...(buying ? { importe_total: f.get("total") } : {}),
          motivo: f.get("motivo"),
        },
      });
      setMessage(
        `${buying ? "Compra" : "Pérdida"} registrada: ${name}. Ahora tienes ${amount(result.saldo)} ${unitCode} en tu cocina.`,
      );
      element.reset();
      setSelected("");
      onChanged();
      try {
        await load();
      } catch {
        setError(
          "El registro sí se guardó, pero no pudimos refrescar la lista. Recarga la página; no lo registres otra vez.",
        );
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function query(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setReport(null);
    try {
      setReport(
        await api(`reports/results?desde=${range.desde}&hasta=${range.hasta}`),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function downloadPdf() {
    setPdfBusy(true);
    setError("");
    try {
      await downloadFile(
        `reports/results.pdf?desde=${report.desde}&hasta=${report.hasta}`,
        `resultados-${report.desde}-${report.hasta}.pdf`,
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setPdfBusy(false);
    }
  }
  return (
    <>
      <div
        className="kitchen-tabs"
        role="group"
        aria-label="Compras y resultados"
      >
        {[
          ["purchase", "Registrar compra"],
          ["loss", "Registrar pérdida"],
          ["reports", "Ver resultados"],
        ].map(([value, label]) => (
          <button
            key={value}
            className={tab === value ? "primary" : "secondary"}
            aria-pressed={tab === value}
            disabled={busy}
            onClick={() => changeTab(value)}
          >
            {label}
          </button>
        ))}
      </div>
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="success-note" role="status">
          {message}
        </p>
      )}
      {tab !== "reports" && (
        <section className="panel flow-panel operations-panel">
          <span className="flow-eyebrow">
            {buying
              ? "DESPUÉS DE HACER UNA COMPRA"
              : "SOLO SI PERDISTE UN INGREDIENTE"}
          </span>
          <h2>
            {buying
              ? "Registra lo que compraste"
              : "Registra un ingrediente que ya no puedes usar"}
          </h2>
          <p>
            {buying
              ? "Ten a mano la cantidad que recibiste y lo que pagaste por ese ingrediente. Registra un ingrediente por vez."
              : "Usa esta opción si un ingrediente se malogró, se derramó o se perdió. Los menús cocinados que no vendiste se registran como sobrantes en el cierre del día."}
          </p>
          <div className="example-note">
            <strong>Ejemplo de llenado</strong>
            <p>
              {buying
                ? "Compraste una bolsa de arroz de 5 kg por S/20: elige Arroz, escribe 5 en cantidad y 20 en total pagado. El sistema calcula el precio por kilo."
                : "Se malogró medio kilo de papa: elige Papa, escribe 0.5 kg y explica el motivo. No necesitas ingresar un precio."}
            </p>
          </div>
          <form key={tab} onSubmit={movement}>
            <fieldset disabled={busy}>
              <div className="form-grid">
                <GuidedField
                  id="movement-ingredient"
                  label={
                    buying
                      ? "¿Qué ingrediente compraste?"
                      : "¿Qué ingrediente perdiste?"
                  }
                  hint="La unidad del ingrediente se muestra junto al nombre. Si no aparece, créalo primero en Mi cocina → Despensa y precios."
                >
                  <select
                    value={selected}
                    onChange={(e) => setSelected(e.target.value)}
                    required
                  >
                    <option value="">Selecciona un ingrediente</option>
                    {ingredients.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.nombre} ({i.unidad_codigo})
                      </option>
                    ))}
                  </select>
                </GuidedField>
                <GuidedField
                  id="movement-quantity"
                  label={
                    buying
                      ? `Cantidad que compraste${unit ? ` (${unit})` : ""}`
                      : `Cantidad que perdiste${unit ? ` (${unit})` : ""}`
                  }
                  hint={
                    ingredient
                      ? unitHints[unit]
                      : "Selecciona primero el ingrediente para ver la unidad."
                  }
                >
                  <input
                    name="cantidad"
                    type="number"
                    min="0.0001"
                    step="0.0001"
                    placeholder={unit === "unidad" ? "Ej. 12" : "Ej. 5"}
                    required
                    disabled={!ingredient}
                  />
                </GuidedField>
                {buying && (
                  <GuidedField
                    id="movement-total"
                    label="Total que pagaste por ese ingrediente (S/)"
                    hint="Es el importe completo de esta compra, no el precio por kilo y no el total de una boleta con varios ingredientes. Si lo recibiste gratis, escribe 0."
                  >
                    <input
                      name="total"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Ej. 20.00"
                      required
                      disabled={!ingredient}
                    />
                  </GuidedField>
                )}
                <GuidedField
                  id="movement-reason"
                  label={
                    buying
                      ? "¿Dónde compraste o qué comprobante tienes?"
                      : "¿Por qué se perdió?"
                  }
                  hint={
                    buying
                      ? "Puede ser el mercado, la tienda o el número de boleta. Ejemplo: Mercado San Camilo, puesto 12."
                      : "Describe lo que pasó. Ejemplo: papa malograda o aceite derramado."
                  }
                >
                  <input
                    name="motivo"
                    minLength="3"
                    maxLength="500"
                    placeholder={
                      buying ? "Ej. Mercado San Camilo" : "Ej. Se malogró"
                    }
                    required
                  />
                </GuidedField>
              </div>
              {ingredient && (
                <p className="stock-note">
                  Existencia registrada de {ingredient.nombre}:{" "}
                  <strong>
                    {amount(ingredient.existencia ?? 0)} {unit}
                  </strong>
                  .{" "}
                  {buying
                    ? "Al guardar se sumará la cantidad que recibiste. No la vuelvas a sumar en Despensa."
                    : "Al guardar se restará la cantidad perdida."}
                </p>
              )}
              <button className="primary" disabled={!ingredient}>
                {busy
                  ? "Guardando…"
                  : buying
                    ? "Guardar compra y sumar a mi cocina"
                    : "Guardar pérdida y descontar"}
              </button>
            </fieldset>
          </form>
          <p className="field-help">
            La fecha del movimiento es hoy. Regístralo cuando recibas la compra
            o detectes la pérdida, antes de cerrar el día correspondiente.
          </p>
          <details>
            <summary>Ver compras y cambios de existencias registrados</summary>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Ingrediente</th>
                    <th>Qué ocurrió</th>
                    <th>Cantidad</th>
                    <th>Quedó en cocina</th>
                    <th>Referencia</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id}>
                      <td>
                        {new Intl.DateTimeFormat("es-PE", {
                          dateStyle: "short",
                          timeStyle: "short",
                          timeZone: "America/Lima",
                        }).format(new Date(m.creado_en))}
                      </td>
                      <td>{m.nombre}</td>
                      <td>{movementNames[m.tipo] ?? m.tipo}</td>
                      <td>
                        {amount(m.cantidad)} {m.unidad_codigo}
                      </td>
                      <td>
                        {amount(m.saldo)} {m.unidad_codigo}
                      </td>
                      <td>{m.motivo}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
          <div className="flow-actions">
            <span>
              ¿Ya terminaste de vender? El cierre se hace desde tu plan.
            </span>
            <button type="button" className="secondary" onClick={onViewPlans}>
              Ir a Mis planes para cerrar el día
            </button>
          </div>
        </section>
      )}
      {tab === "reports" && (
        <section className="panel flow-panel operations-panel">
          <span className="flow-eyebrow">DESPUÉS DE REGISTRAR TUS CIERRES</span>
          <h2>Resultados del negocio</h2>
          <p>
            Elige el primer y el último día que quieres revisar. Se sumarán las
            ventas de los planes que ya cerraste en esas fechas; no se cuentan
            los planes pendientes.
          </p>
          <form onSubmit={query}>
            <div className="form-grid">
              <GuidedField
                id="report-start"
                label="Desde qué día"
                hint="Primer día que quieres incluir en el reporte."
              >
                <input
                  type="date"
                  value={range.desde}
                  onChange={(e) => {
                    setRange({ ...range, desde: e.target.value });
                    setReport(null);
                  }}
                  required
                />
              </GuidedField>
              <GuidedField
                id="report-end"
                label="Hasta qué día"
                hint="Último día que quieres incluir, también se cuenta."
              >
                <input
                  type="date"
                  min={range.desde}
                  value={range.hasta}
                  onChange={(e) => {
                    setRange({ ...range, hasta: e.target.value });
                    setReport(null);
                  }}
                  required
                />
              </GuidedField>
            </div>
            <button className="primary" disabled={busy}>
              {busy ? "Consultando…" : "Consultar resultados"}
            </button>
          </form>
          {report && (
            <>
              {report.dias_cerrados === 0 && (
                <div className="example-note">
                  <strong>Todavía no hay cierres en estas fechas.</strong>
                  <p>
                    Guardar un plan no registra ventas. Abre un plan en Mis
                    planes y completa el cierre cuando hayas terminado de
                    vender.
                  </p>
                  <button className="secondary" onClick={onViewPlans}>
                    Ver mis planes pendientes
                  </button>
                </div>
              )}
              <p>
                Días cerrados: {report.dias_cerrados} · Preparados:{" "}
                {report.preparadas} · Vendidos: {report.vendidas} · Sobrantes:{" "}
                {report.sobrantes}
              </p>
              <div className="plan-metrics">
                <div>
                  <span>Dinero de las ventas</span>
                  <b>{money(report.ingreso_real)}</b>
                </div>
                <div>
                  <span>Costo de ingredientes usados</span>
                  <b>{money(report.costo_ingredientes_real)}</b>
                </div>
                <div>
                  <span>Margen tras los gastos registrados</span>
                  <b>{money(report.margen_real)}</b>
                </div>
              </div>
              <p>
                Otros gastos que declaraste: {money(report.gastos_adicionales)}.
                El margen es lo que queda de las ventas después de los
                ingredientes usados y esos gastos. No es dinero disponible en
                caja ni garantiza incluir todos los gastos del negocio.
              </p>
              <div className="flow-actions">
                <button
                  type="button"
                  className="secondary"
                  disabled={pdfBusy}
                  onClick={downloadPdf}
                >
                  {pdfBusy ? "Generando PDF…" : "Descargar reporte PDF"}
                </button>
                <a
                  href={`${apiBase}/reports/results.csv?desde=${report.desde}&hasta=${report.hasta}`}
                >
                  Descargar reporte CSV
                </a>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Menú</th>
                      <th>Planeabas preparar</th>
                      <th>Preparaste</th>
                      <th>Vendiste</th>
                      <th>Venta estimada</th>
                      <th>Venta real</th>
                      <th>Margen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.detalle.map((r) => (
                      <tr key={r.plan_id}>
                        <td>{r.fecha}</td>
                        <td>{r.nombre_oferta}</td>
                        <td>{r.menus_planificados}</td>
                        <td>{r.preparadas}</td>
                        <td>{r.vendidas}</td>
                        <td>{money(r.ingreso_estimado)}</td>
                        <td>{money(r.ingreso_real)}</td>
                        <td>{money(r.margen_real)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
