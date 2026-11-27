import React, { useState } from "react";
import { amount, money, matchesText } from "../../services/api.js";
const names = {
  compra: "Compra recibida",
  merma: "Pérdida de ingrediente",
  consumo: "Uso al cerrar el día",
  ajuste: "Conteo de despensa",
};
export function MovementHistory({ movements }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [limit, setLimit] = useState(20);
  const filtered = movements.filter(
    (m) =>
      (type === "all" || m.tipo === type) &&
      matchesText(`${m.nombre} ${m.motivo}`, query),
  );
  return (
    <section className="panel flow-panel">
      <span className="flow-eyebrow">LO QUE CAMBIÓ EN TU COCINA</span>
      <h2>Historial de inventario</h2>
      <p>
        Consulta hasta los últimos 500 movimientos registrados. Una compra suma
        ingredientes; un cierre o una pérdida los descuenta. El conteo registra
        una corrección de existencias.
      </p>
      <div className="record-filters">
        <label>
          Buscar ingrediente o referencia
          <input
            type="search"
            placeholder="Por ejemplo: arroz"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(20);
            }}
          />
        </label>
        <label>
          Tipo de movimiento
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value);
              setLimit(20);
            }}
          >
            <option value="all">Todos los movimientos</option>
            {Object.entries(names).map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="record-count" role="status">
        {filtered.length} movimientos encontrados · mostrando{" "}
        {Math.min(limit, filtered.length)}
      </p>
      {!filtered.length ? (
        <div className="empty-records">
          <h3>No hay movimientos para mostrar</h3>
          <p>
            Si ya registraste movimientos, prueba otro tipo o cambia la
            búsqueda.
          </p>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Fecha de registro</th>
                <th>Ingrediente</th>
                <th>Qué ocurrió</th>
                <th>Cantidad</th>
                <th>Costo por unidad</th>
                <th>Quedó en cocina</th>
                <th>Referencia</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((m) => (
                <tr key={m.id}>
                  <td>
                    {new Intl.DateTimeFormat("es-PE", {
                      dateStyle: "short",
                      timeStyle: "short",
                      timeZone: "America/Lima",
                    }).format(new Date(m.creado_en))}
                  </td>
                  <th>{m.nombre}</th>
                  <td>
                    <span className={`movement-tag movement-${m.tipo}`}>
                      {names[m.tipo] ?? m.tipo}
                    </span>
                  </td>
                  <td>
                    {Number(m.cantidad) > 0 ? "+" : ""}
                    {amount(m.cantidad)} {m.unidad_codigo}
                  </td>
                  <td>
                    {money(m.costo_unitario)} / {m.unidad_codigo}
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
      )}
      {filtered.length > limit && (
        <button className="secondary" onClick={() => setLimit((n) => n + 20)}>
          Ver más movimientos
        </button>
      )}
    </section>
  );
}
