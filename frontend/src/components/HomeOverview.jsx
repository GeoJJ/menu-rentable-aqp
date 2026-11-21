import React from 'react';

export function HomeOverview({ recipes, inventory, selected, entries, date, apiStatus, navigate }) {
  const records = entries.filter(row => !row.demo && row.date <= date);
  const latest = records.sort((a, b) => b.date.localeCompare(a.date))[0];
  const latestRows = latest ? records.filter(row => row.date === latest.date) : [];
  const sold = latestRows.reduce((sum, row) => sum + row.sold, 0);
  const lowStock = inventory.filter(item => item.stock <= 0);
  const dishNames = selected.map(recipe => recipe.name);
  return <div className="home-bento" aria-label="Resumen del negocio">
    <section className="bento-welcome">
      <span className="bento-eyebrow">MENÚRENTABLE AQP</span>
      <h2>Todo listo para<br />cocinar el día.</h2>
      <p>Elige tus platos y convierte el menú en un plan de compras.</p>
      <div className="api-indicator" role="status"><i className={apiStatus === 'connected' ? 'online' : ''} />
        {apiStatus === 'connected' ? 'Servidor conectado' : apiStatus === 'checking' ? 'Conectando con el servidor…' : 'Servidor sin conexión'}
      </div>
    </section>
    <button className="bento-card bento-recipes" onClick={() => navigate('Recetas')}>
      <span className="bento-top">Tu recetario <span aria-hidden="true">↗</span></span>
      <strong>{recipes.length}</strong><span>recetas para elegir</span>
    </button>
    <button className="bento-card bento-stock" onClick={() => navigate('Insumos y precios')}>
      <span className="bento-top">Despensa <span aria-hidden="true">↗</span></span>
      <strong>{inventory.length}</strong><span>ingredientes registrados</span>
      <small>{lowStock.length ? lowStock.length + ' sin existencias' : 'Consulta cantidades y cotizaciones'}</small>
    </button>
    <button className="bento-card bento-menu" onClick={() => navigate('Recetas del menú')}>
      <span className="bento-top">Selección del día <span aria-hidden="true">↗</span></span>
      <strong className="bento-dishes">{dishNames.length ? dishNames.join(' · ') : 'Arma tu menú abajo'}</strong>
      <span>{date}</span>
    </button>
    <button className="bento-card bento-results" onClick={() => navigate('Historial')}>
      <span className="bento-top">Último cierre <span aria-hidden="true">↗</span></span>
      {latest ? <><strong>{sold}</strong><span>porciones vendidas · {latest.date}</span></> :
        <><strong className="bento-dishes">Explora el historial</strong><span>Incluye 28 días de demostración</span></>}
    </button>
  </div>;
}
