import React, { useEffect, useState } from "react";
import { api, money, amount } from "../../services/api.js";
import { GuidedField } from "../../components/FormHelp.jsx";

export function DayClosing({ plan, onChanged, onPurchases = () => {} }) {
  const [closing, setClosing] = useState(null),
    [preview, setPreview] = useState(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [prepared, setPrepared] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api(`menu-plans/${plan.id}/closing`, { signal: controller.signal })
      .then(setClosing)
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [plan.id]);
  async function review(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);
    const f = new FormData(event.currentTarget);
    try {
      setPreview(
        await api(`menu-plans/${plan.id}/closing-preview`, {
          body: {
            preparadas: Number(f.get("preparadas")),
            vendidas: Number(f.get("vendidas")),
            precio_menu_real: f.get("precio"),
            gastos_adicionales: f.get("gastos"),
          },
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  async function close() {
    setBusy(true);
    setError("");
    try {
      setClosing(
        await api(`menu-plans/${plan.id}/close`, { body: preview.datos }),
      );
      setPreview(null);
      onChanged();
    } catch (e) {
      setError(e.message);
      setPreview(null);
    } finally {
      setBusy(false);
    }
  }
  async function cancel(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(event.currentTarget);
    try {
      await api(`menu-plans/${plan.id}/cancel`, {
        body: { motivo: f.get("motivo") },
      });
      onChanged();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <section id="day-closing" className="panel flow-panel operations-panel">
      <span className="flow-eyebrow">CUANDO TERMINES DE VENDER</span>
      <h2>Cierre del día</h2>
      <p>
        <strong>{plan.menu.nombre}</strong> · Día del plan: {plan.fecha}. Aquí
        registras lo que realmente pasó, aunque sea distinto a lo que habías
        planificado.
      </p>
      {error && (
        <p className="flow-error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <p role="status">Revisando si este día ya fue cerrado…</p>
      ) : closing ? (
        <div className="closing-complete" role="status">
          <h3>Este día ya quedó cerrado</h3>
          <p>
            Preparaste {closing.preparadas} menús, vendiste {closing.vendidas} y
            quedaron {closing.sobrantes} sin vender.
          </p>
          <div className="plan-metrics">
            <div>
              <span>Dinero de las ventas</span>
              <b>{money(closing.ingreso_real)}</b>
            </div>
            <div>
              <span>Ingredientes usados</span>
              <b>{money(closing.costo_ingredientes_real)}</b>
            </div>
            <div>
              <span>Margen del día</span>
              <b>{money(closing.margen_real)}</b>
            </div>
          </div>
          <p>
            Otros gastos registrados: {money(closing.gastos_adicionales)}. Los
            ingredientes de todos los menús preparados ya se descontaron de tu
            cocina. No vuelvas a registrar este consumo como pérdida.
          </p>
          <p>
            Este cierre no se aplica otra vez. Puedes consultarlo y descargar
            sus resultados en Compras y resultados → Ver resultados.
          </p>
        </div>
      ) : plan.estado === "cancelado" ? (
        <p>
          Este plan está cancelado. No registró ventas ni descontó ingredientes;
          se conserva para consultar su historial.
        </p>
      ) : (
        <>
          <div className="example-note">
            <strong>¿Qué necesitas tener a mano?</strong>
            <p>
              El número de menús que cocinaste, el número que vendiste, el
              precio cobrado por cada menú y los otros gastos de ese día.
            </p>
            <p>
              Ejemplo: preparaste 30 y vendiste 26. Escribe 30 y 26; el sistema
              registra los 4 sobrantes. En el precio escribe lo que cobraste por
              un menú, no el total de ventas.
            </p>
          </div>
          <p>
            Antes de cerrar, registra las compras que recibiste. Si ya las
            sumaste a la despensa, no las vuelvas a ingresar.
          </p>
          <button type="button" className="text-action" onClick={onPurchases}>
            Me falta registrar una compra →
          </button>
          <form onSubmit={review} onChange={() => setPreview(null)}>
            <fieldset disabled={busy}>
              <div className="form-grid">
                <GuidedField
                  id={`prepared-${plan.id}`}
                  label="¿Cuántos menús preparaste realmente?"
                  hint={`Habías planificado ${plan.cantidad}. Cuenta todos los que cocinaste, incluso los que no vendiste. Si no cocinaste, escribe 0.`}
                >
                  <input
                    name="preparadas"
                    type="number"
                    min="0"
                    max="100000"
                    step="1"
                    value={prepared}
                    onChange={(e) => setPrepared(e.target.value)}
                    placeholder={`Ej. ${plan.cantidad}`}
                    required
                  />
                </GuidedField>
                <GuidedField
                  id={`sold-${plan.id}`}
                  label="¿Cuántos de esos menús vendiste?"
                  hint="Cuenta menús completos, no platos ni soles. No puede superar lo preparado. Si no vendiste ninguno, escribe 0."
                >
                  <input
                    name="vendidas"
                    type="number"
                    min="0"
                    max={prepared === "" ? "100000" : prepared}
                    step="1"
                    placeholder="Ej. 26"
                    required
                  />
                </GuidedField>
                <GuidedField
                  id={`price-${plan.id}`}
                  label="¿Cuánto cobraste por cada menú? (S/)"
                  hint="Precio de un menú completo: caldo, segundo y refresco. El sistema calcula el total de ventas. Esta versión usa un mismo precio para todos los menús vendidos ese día."
                >
                  <input
                    name="precio"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={plan.menu.precio_menu}
                    required
                  />
                </GuidedField>
                <GuidedField
                  id={`expenses-${plan.id}`}
                  label="Otros gastos de ese día, sin ingredientes (S/)"
                  hint="Escribe el total de otros gastos que quieras incluir: por ejemplo, S/5 de transporte + S/10 de gas = 15. No repitas aquí las compras de ingredientes. Si no hay otros gastos, deja 0."
                >
                  <input
                    name="gastos"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue="0"
                    required
                  />
                </GuidedField>
              </div>
              <button className="secondary">
                {busy ? "Revisando…" : "Revisar datos antes de cerrar"}
              </button>
            </fieldset>
          </form>
          {preview && (
            <div className="closing-review" aria-label="Revisión del cierre">
              <h3>
                {preview.puede_cerrar
                  ? "Revisa lo que se guardará"
                  : "Faltan ingredientes en la existencia registrada"}
              </h3>
              <p>Aún no se guardó el cierre ni se descontaron ingredientes.</p>
              <p>
                Preparados: <strong>{preview.datos.preparadas}</strong> ·
                Vendidos: <strong>{preview.datos.vendidas}</strong> · Precio por
                menú: <strong>{money(preview.datos.precio_menu_real)}</strong> ·
                Otros gastos:{" "}
                <strong>{money(preview.datos.gastos_adicionales)}</strong>.
              </p>
              {preview.resultado && (
                <p>
                  Sobrantes: {preview.resultado.sobrantes} · Total de ventas:{" "}
                  {money(preview.resultado.ingreso_real)} · Costo de
                  ingredientes usados:{" "}
                  {money(preview.resultado.costo_ingredientes_real)} · Margen
                  del día: {money(preview.resultado.margen_real)}.
                </p>
              )}
              <details open={!preview.puede_cerrar}>
                <summary>
                  Ingredientes que se usarán para los {preview.datos.preparadas}{" "}
                  menús preparados
                </summary>
                <p>
                  Se calculan con la receta guardada en este plan. Los
                  ingredientes de los menús sobrantes también fueron usados al
                  cocinar.
                </p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Ingrediente</th>
                        <th>Tienes registrado</th>
                        <th>Se descontará</th>
                        <th>Te falta registrar</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.insumos.map((i) => (
                        <tr key={i.ingrediente_id}>
                          <td>{i.nombre}</td>
                          <td>
                            {amount(i.disponible)} {i.unidad}
                          </td>
                          <td>
                            {amount(i.necesario)} {i.unidad}
                          </td>
                          <td>
                            {amount(i.faltante)} {i.unidad}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              {preview.puede_cerrar ? (
                <>
                  <p>
                    Al confirmar se guardarán las ventas y se descontarán estos
                    ingredientes una sola vez. Revisa los datos: después no
                    podrás editar este cierre desde la aplicación.
                  </p>
                  <button className="primary" disabled={busy} onClick={close}>
                    {busy ? "Guardando…" : "Confirmar el cierre de este día"}
                  </button>
                </>
              ) : (
                <>
                  <p>
                    Si compraste ingredientes y todavía no los registraste,
                    hazlo primero. Si la cantidad de tu cocina está mal contada,
                    corrígela en Mi cocina → Despensa y precios. Después vuelve
                    a revisar este cierre.
                  </p>
                  <button className="primary" onClick={onPurchases}>
                    Registrar la compra que falta
                  </button>
                </>
              )}
            </div>
          )}
          <details>
            <summary>No voy a usar este plan: cancelarlo</summary>
            <p>
              Úsalo si al final no trabajarás con este plan. Cancelar no
              registra ventas, no descuenta ingredientes y conserva el
              historial.
            </p>
            <form onSubmit={cancel}>
              <GuidedField
                id={`cancel-${plan.id}`}
                label="¿Por qué cancelas el plan?"
                hint="Ejemplo: el negocio no abrió o se cambió la preparación."
              >
                <input name="motivo" minLength="3" maxLength="500" required />
              </GuidedField>
              <button className="secondary" disabled={busy}>
                Confirmar cancelación
              </button>
            </form>
          </details>
        </>
      )}
    </section>
  );
}
