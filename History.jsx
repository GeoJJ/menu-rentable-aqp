import React, { useState } from 'react';

export function History({ plans, entries, dailyMenus, menu, today, money, number, openReport, resume, weekdays, weekdayOf }) {
  const [origin, setOrigin] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const matches = row => origin === 'all' || (origin === 'demo' ? row.demo : !row.demo);
  const dates = [...new Set([...plans.filter(matches).map(row => row.date),
    ...entries.filter(matches).map(row => row.date), ...(origin === 'demo' ? [] : Object.keys(dailyMenus))])]
    .filter(date => !dateFilter || date === dateFilter).sort((a, b) => b.localeCompare(a));

  return <section className="panel">
    <div className="panel-head"><h2>Actividad por fecha</h2><span className="badge">{dates.length} días</span></div>
    <div className="form-grid history-filters">
      <label>Fecha<input type="date" value={dateFilter} onChange={event => setDateFilter(event.target.value)} /></label>
      <label>Origen<select value={origin} onChange={event => setOrigin(event.target.value)}><option value="all">Todos</option><option value="own">Mis registros</option><option value="demo">Demostración</option></select></label>
      <div className="form-submit"><button className="secondary" onClick={() => { setOrigin('all'); setDateFilter(''); }}>Limpiar filtros</button></div>
    </div>
    {!dates.length && <p>No hay actividad para los filtros seleccionados.</p>}
    {dates.map((date, index) => {
      const plan = plans.find(row => row.date === date && matches(row));
      const actual = entries.filter(row => row.date === date && matches(row));
      const draft = origin === 'demo' ? undefined : dailyMenus[date];
      const ids = [...new Set([...(draft?.ids ?? []), ...(plan?.plates ?? []).map(row => row.recipe.id), ...actual.map(row => row.recipeId)])];
      return <details key={date} className="history-day" open={index === 0 || undefined}>
        <summary><div><strong>{weekdays[weekdayOf(date)]} · {date}</strong><small>{ids.length} platos · {plan ? money(plan.purchase) + ' en compras' : 'Sin plan guardado'}</small></div>
          <span className="badge">{plan?.demo || actual.some(row => row.demo) ? 'Incluye datos de ejemplo' : 'Mi negocio'}</span></summary>
        <div className="history-body">
          <div className="table-wrap"><table><thead><tr>{['Plato', 'Planificadas', 'Preparadas', 'Vendidas', 'Sobrantes', 'Agotado', 'Registro'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
            {ids.map(id => {
              const plate = plan?.plates.find(row => row.recipe.id === id);
              const row = actual.find(item => item.recipeId === id);
              return <tr key={id}><th>{row?.name ?? plate?.recipe.name ?? menu.find(item => item.id === id)?.name ?? id}</th><td>{plate?.quantity ?? '—'}</td><td>{row?.made ?? '—'}</td><td>{row?.sold ?? '—'}</td><td>{row?.left ?? '—'}</td><td>{row ? (row.soldOut ? 'Sí' : 'No') : '—'}</td><td>{row ? (row.demo ? 'Ejemplo' : 'Propio') : '—'}</td></tr>;
            })}
          </tbody></table></div>
          {plan && <>
            <div className="summary"><span>Escenario <b>{plan.name}</b></span><span>Presupuesto <b>{money(plan.budget)}</b></span><span>Compra <b>{money(plan.purchase)}</b></span><span>Margen estimado <b>{money(plan.margin)}</b></span></div>
            <h3>Insumos y compras</h3>
            <div className="table-wrap"><table><thead><tr>{['Ingrediente', 'Necesario', 'Faltante', 'Producto', 'Envases', 'Compra', 'Stock final'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>
              {plan.supplies.map(item => <tr key={item.id}><th>{item.name}</th><td>{number(item.required)} {item.unit}</td><td>{number(item.missing)} {item.unit}</td><td>{item.packages ? item.product.name : '—'}</td><td>{item.packages}</td><td>{money(item.purchase)}</td><td>{number(item.remaining)} {item.unit}</td></tr>)}
            </tbody></table></div>
          </>}
          <div className="actions">
            {plan && <button className="secondary" onClick={() => openReport(date)}>Ver reporte y descargar</button>}
            <button className="secondary" onClick={() => resume(date)}>{date >= today ? 'Continuar menú' : 'Abrir menú del día'}</button>
          </div>
        </div>
      </details>;
    })}
  </section>;
}
