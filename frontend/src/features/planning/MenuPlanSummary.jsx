import React from "react";
import { money, amount } from "../../services/api.js";
export function MenuPlanSummary({ plan }) {
  return (
    <>
      <div className="plan-heading">
        <div>
          <span className="flow-eyebrow">{plan.fecha}</span>
          <h2>{plan.menu.nombre}</h2>
          <p>
            {plan.cantidad} menús × {money(plan.menu.precio_menu)} por menú
            completo
          </p>
        </div>
        <strong>
          {money(plan.ingreso_estimado)}
          <small>Ingresos estimados</small>
        </strong>
      </div>
      <div className="plan-metrics">
        <div>
          <span>Lo que gastarías en comprar</span>
          <b>{money(plan.compra)}</b>
        </div>
        <div>
          <span>Costo de ingredientes que usarías</span>
          <b>{money(plan.costo_ingredientes)}</b>
        </div>
        <div>
          <span>Margen estimado</span>
          <b>{money(plan.margen_estimado)}</b>
        </div>
      </div>
      <ul className="flow-courses">
        {[...plan.componentes]
          .sort(
            (a, b) =>
              ["caldo", "segundo", "refresco"].indexOf(a.categoria) -
              ["caldo", "segundo", "refresco"].indexOf(b.categoria),
          )
          .map((c) => (
            <li key={c.id}>
              <span>{c.categoria}</span>
              <b>{c.nombre}</b>
            </li>
          ))}
      </ul>
      <h3>Lista de compras</h3>
      <p>
        Esta lista es una recomendación, no una compra registrada. Después de
        comprar, registra la cantidad recibida y el total pagado en Compras y
        resultados.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Usarías para cocinar</th>
              <th>Falta según tu plan</th>
              <th>Compra sugerida</th>
              <th>Gasto estimado</th>
            </tr>
          </thead>
          <tbody>
            {plan.insumos.map((i) => (
              <tr key={i.id}>
                <th>{i.nombre}</th>
                <td>
                  {amount(i.necesario)} {i.unidad}
                </td>
                <td>
                  {amount(i.faltante)} {i.unidad}
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
      <p className="flow-footnote">
        Se supone la venta de todos los menús planificados. El margen descuenta
        ingredientes; no incluye alquiler, personal ni otros gastos. Las compras
        se redondean a kilos, litros o unidades completos. Guardar el plan no
        descuenta las existencias.
      </p>
    </>
  );
}
