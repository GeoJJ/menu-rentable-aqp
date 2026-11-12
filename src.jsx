import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ingredients, recipes, products, scenarioOptions, estimate, calculate } from './model';
import { soupRecipes, extraIngredients, extraProducts, weekdays, weekdayOf, shiftDate, demoHistory, traditionUrl } from './weekly';
import { History } from './History';
import { mainRecipes, mainIngredients, mainProducts } from './main-dishes';
import { drinkRecipes, drinkIngredients, drinkProducts } from './drinks';
import { DayMenu, MenuActions, dishCategory, categoryLabels } from './DayMenu';
import { preparations } from './preparations';
import { formatRecipeAmount, picanteriaReference, recipeReferences, recipeSteps } from './recipe-details';
import './style.css';

const money = value => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(value);
const number = value => new Intl.NumberFormat('es-PE', { maximumFractionDigits: 3 }).format(value);
const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Lima' }).format(new Date());
const navigation = [['Planificar', '▦'], ['Recetas', '▤'], ['Insumos y precios', '⌕'], ['Registro diario', '✓'], ['Historial', '↺'], ['Reportes', '▥']];
const defaultMenu = [...recipes.map(recipe => ({ ...recipe, category: 'main', style: 'Menú diario' })), ...mainRecipes, ...soupRecipes, ...drinkRecipes];
const defaultInventory = [...ingredients, ...extraIngredients, ...mainIngredients, ...drinkIngredients];
const defaultCatalog = [...products, ...extraProducts, ...mainProducts, ...drinkProducts];
const examples = demoHistory('2026-11-12', recipes, defaultInventory, defaultCatalog, calculate, scenarioOptions[1]);
const mergeBy = (defaults, saved, key) => [...new Map([...defaults, ...saved].map(item => [key(item), item])).values()];
const links = [
  ['MIDAGRI', 'Referencia de pollo en San Camilo', 'https://siea.midagri.gob.pe/portal/phocadownload/datos_estadisticas/diarias/aves/2025/08/sisap-aves-04ago25.pdf'],
  ['PlazaVea', 'Catálogo para evaluar cobertura en Arequipa', 'https://www.plazavea.com.pe/lbc/arroz-superior-formato-5kg'],
  ['ADRA Perú', 'Resultados del Banco de Alimentos en Arequipa', 'https://adra.org.pe/adra-peru-rescata-mas-de-900-toneladas-de-alimentos-en-2025/'],
];

function useStored(key, initial) {
  const [value, setValue] = useState(() => {
    try { return JSON.parse(localStorage.getItem(key)) ?? initial; } catch { return initial; }
  });
  return [value, next => { setValue(next); localStorage.setItem(key, JSON.stringify(next)); }];
}

function download(filename, rows) {
  const csv = rows.map(row => row.map(cell => '"' + String(cell ?? '').replaceAll('"', '""') + '"').join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Panel({ title, children, action }) {
  return <section className="panel"><div className="panel-head"><h2>{title}</h2>{action}</div>{children}</section>;
}

function App() {
  const [page, setPage] = useState('Planificar');
  const [savedMenu, setMenu] = useStored('mr-recipes', []);
  const [savedInventory, setInventory] = useStored('mr-inventory', []);
  const [savedCatalog, setCatalog] = useStored('mr-catalog', []);
  const [savedEntries, setEntries] = useStored('mr-records', []);
  const [savedPlans, setPlans] = useStored('mr-plans', []);
  const [dailyMenus, setDailyMenus] = useStored('mr-daily-menus', {});
  const menu = mergeBy(defaultMenu, savedMenu, item => item.id).map(recipe => {
    const original = preparations[recipe.id] ?? drinkRecipes.find(drink => drink.id === recipe.id)?.preparation;
    return recipe.preparation === original ? { ...recipe, preparation: '' } : recipe;
  });
  const inventory = mergeBy(defaultInventory, savedInventory, item => item.id);
  const catalog = mergeBy(defaultCatalog, savedCatalog, item => item.id);
  const entries = mergeBy(examples.entries, savedEntries, row => row.date + ':' + row.recipeId);
  const plans = mergeBy(examples.plans, savedPlans, row => row.date);
  const [date, setDate] = useState(today);
  const day = weekdayOf(date);
  const dayPlan = plans.find(plan => plan.date === date);
  const dailyMenu = dailyMenus[date];
  const budget = dailyMenu?.budget ?? dayPlan?.budget ?? 160;
  const selectedIds = dailyMenu?.ids ?? dayPlan?.plates.map(plate => plate.recipe.id) ?? [soupRecipes[day].id];
  const [scenario, setScenario] = useState('');
  const [choices, setChoices] = useState({});
  const [overrides, setOverrides] = useState({});
  const [generated, setGenerated] = useState(false);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [reportDate, setReportDate] = useState(today);
  const selected = selectedIds.map(id => menu.find(recipe => recipe.id === id)).filter(Boolean);
  const setDayMenu = (ids, amount = budget) => setDailyMenus({ ...dailyMenus, [date]: { ids, budget: amount } });
  const setPlanDate = next => {
    if (!next || next === date) return;
    setDate(next);
    setScenario('');
    setChoices({});
    setOverrides({});
    setNotice('');
  };
  const changeDishes = ids => {
    setDayMenu(ids);
    setOverrides({});
    setScenario('');
    setNotice('');
  };
  function toggleSecond(id) {
    changeDishes(selectedIds.includes(id) ? selectedIds.filter(item => item !== id) : [...selectedIds, id]);
  }
  function changeDish(category, id) {
    changeDishes([
      ...selected.filter(recipe => dishCategory(recipe) !== category).map(recipe => recipe.id),
      ...(id ? [id] : []),
    ]);
  }
  function generateMenu() {
    setDayMenu(selectedIds);
    setGenerated(true);
  }
  const estimates = Object.fromEntries(selected.map(recipe => [recipe.id, estimate(recipe, date, entries)]));
  const scenarios = scenarioOptions.map(option => calculate(option, selected, inventory, catalog, choices, estimates, Number(budget), {}));
  const recommendation = scenarios.filter(item => item.feasible).sort((a, b) => b.margin - a.margin)[0];
  const base = scenarios.find(item => item.name === scenario) ?? recommendation ?? scenarios[1];
  const active = calculate(base, selected, inventory, catalog, choices, estimates, Number(budget), overrides);
  const currentPlan = plans.find(plan => plan.date === reportDate);
  const weekStart = new Date(reportDate + 'T12:00:00Z');
  weekStart.setUTCDate(weekStart.getUTCDate() - (weekStart.getUTCDay() + 6) % 7);
  const week = weekStart.toISOString().slice(0, 10);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 6);
  const end = weekEnd.toISOString().slice(0, 10);
  const weekly = entries.filter(row => row.date >= week && row.date <= end).sort((a, b) => a.date.localeCompare(b.date));
  const weeklyPlans = plans.filter(plan => plan.date >= week && plan.date <= end)
    .flatMap(plan => plan.plates.map(plate => ({ date: plan.date, recipeId: plate.recipe.id })));
  const weeklyKeys = [...new Map([...weeklyPlans, ...weekly].map(row => [row.date + row.recipeId, row])).values()]
    .sort((a, b) => a.date.localeCompare(b.date));
  const weeklyRows = weeklyKeys.map(row => {
    const actual = weekly.find(entry => entry.date === row.date && entry.recipeId === row.recipeId);
    const plate = plans.find(plan => plan.date === row.date)?.plates.find(item => item.recipe.id === row.recipeId);
    return [row.date, actual?.name ?? plate?.recipe.name, plate?.quantity ?? '', actual?.made ?? '', actual?.sold ?? '', actual?.left ?? '', actual ? (actual.soldOut ? 'Sí' : 'No') : ''];
  });
  const catalogResults = catalog.filter(product => (product.name + ' ' + product.ingredient).toLowerCase().includes(filter.toLowerCase().trim()));
  const navigate = next => {
    setPage(next);
    setNotice('');
    setEditing(null);
    setGenerated(false);
    window.scrollTo(0, 0);
  };
  function savePlan() {
    setPlans([...savedPlans.filter(plan => plan.date !== date), { ...active, date, budget }]);
    setReportDate(date);
    setNotice('Plan guardado. Ya puedes descargarlo desde Reportes.');
  }
  function saveRecipe(event) {
    event.preventDefault();
    if (!Object.values(editing.items).some(quantity => quantity > 0)) {
      setNotice('Agrega al menos un ingrediente con cantidad mayor que cero.');
      return;
    }
    const recipe = { ...editing, name: editing.name.trim(), yield: Number(editing.yield), price: Number(editing.price), id: editing.id || crypto.randomUUID() };
    setMenu(editing.id ? menu.map(item => item.id === recipe.id ? recipe : item) : [...menu, recipe]);
    setEditing(null);
    setNotice('Receta guardada.');
  }
  function saveEntry(event, recipe) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const made = Number(form.get('made'));
    const sold = Number(form.get('sold'));
    if (sold > made) { setNotice('Las ventas deben ser iguales o menores que las porciones preparadas.'); return; }
    const row = { date, recipeId: recipe.id, name: recipe.name, made, sold, left: made - sold, soldOut: made > 0 && sold === made };
    setEntries([...savedEntries.filter(item => item.date !== date || item.recipeId !== recipe.id), row]);
    setNotice('Registro guardado para ' + recipe.name + '.');
  }

  return <div className="shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-icon" aria-hidden="true">◈</span><div>MenúRentable<small>AREQUIPA</small></div></div>
      <nav aria-label="Navegación principal">{navigation.map(([label, icon]) =>
        <button key={label} aria-current={page === label || (label === 'Planificar' && ['Detalle', 'Recetas del menú'].includes(page)) ? 'page' : undefined} className={page === label || (label === 'Planificar' && ['Detalle', 'Recetas del menú'].includes(page)) ? 'nav active' : 'nav'} onClick={() => navigate(label)}><span aria-hidden="true">{icon}</span>{label}</button>
      )}</nav>
      <div className="sidebar-note"><i /> Datos de demostración</div>
    </aside>
    <main>
      <header className="top"><span>MenúRentable AQP <b> / </b> {page}</span><span className="location">Arequipa, Perú</span></header>
      <div className="content">
        <div className="page-heading"><div><h1>{{ Planificar: 'Arma tu menú', Detalle: 'Detalle del menú', 'Recetas del menú': 'Recetas del menú', Recetas: 'Recetas', 'Insumos y precios': 'Insumos y precios', 'Registro diario': 'Registro diario', Historial: 'Historial', Reportes: 'Reportes' }[page]}</h1>
          <p>{{ Planificar: 'Elige qué vas a servir.', Detalle: 'Compara las porciones, los costos y las compras para la fecha elegida.', 'Recetas del menú': 'Consulta las cantidades y la preparación de los platos elegidos.', Recetas: 'Configura el rendimiento y los ingredientes de cada plato.', 'Insumos y precios': 'Consulta el catálogo de prueba y mantén tu inventario al día.', 'Registro diario': 'Guarda los resultados de producción y venta de cada plato.', Historial: 'Revisa los menús, las porciones, las compras y los resultados de cada fecha.', Reportes: 'Consulta el plan guardado y revisa el resultado de la semana.' }[page]}</p></div>
          {page === 'Recetas' && <button className="primary" onClick={() => { setEditing({ name: '', category: 'main', yield: 10, price: 0, items: {} }); setNotice(''); }}>+ Nueva receta</button>}
        </div>
        {notice && <div className="notice" role="status">{notice}</div>}

        {page === 'Planificar' && <>
          <DayMenu date={date} menu={menu} selected={selected} onDateChange={setPlanDate}
            onDishChange={changeDish} onSecondToggle={toggleSecond} onGenerate={generateMenu} />
          {generated && <MenuActions date={date} dishes={selected} onClose={() => setGenerated(false)}
            onDetails={() => navigate('Detalle')} onRecipes={() => navigate('Recetas del menú')} />}
        </>}

        {page === 'Detalle' && <>
          <div className="back-row"><button className="secondary" onClick={() => navigate('Planificar')}>← Volver al menú</button><button className="secondary" onClick={() => navigate('Recetas del menú')}>Ver recetas elegidas</button></div>
          <Panel title={weekdays[day] + ' · ' + date}>
            <div className="detail-controls">
              <ul className="ingredient-list">{selected.map(recipe => <li key={recipe.id}><span>{categoryLabels[dishCategory(recipe)]}</span><b>{recipe.name}</b></li>)}</ul>
              <label>Presupuesto de compras (S/)<input type="number" min="0" step="0.01" value={budget} onChange={event => setDayMenu(selectedIds, event.target.value === '' ? '' : Math.max(0, Number(event.target.value)))} /></label>
            </div>
          </Panel>
          {selected.length ? <>
            <div className="section-heading"><h2>Escenarios de producción</h2><span>Estimaciones según las ventas registradas</span></div>
            <div className="scenarios">{scenarios.map(item => <button key={item.name} className={'scenario ' + (base.name === item.name ? 'picked' : '')} aria-pressed={base.name === item.name}
              onClick={() => { setScenario(item.name); setOverrides({}); setNotice(''); }}>
              <div className="scenario-top"><strong>{item.name}</strong>{recommendation?.name === item.name && <span className="badge">Recomendado</span>}</div>
              <div className="quantity">{item.quantity} <small>porciones</small></div>
              <div className="metric"><span>Ventas estimadas</span><b>{item.sold}</b></div>
              <div className="metric"><span>Sobrantes estimados</span><b>{item.leftovers}</b></div>
              <div className="metric"><span>Compra estimada</span><b>{money(item.purchase)}</b></div>
              <div className="metric last"><span>Margen estimado</span><b>{money(item.margin)}</b></div>
              {!item.feasible && <span className="warn">{item.pending ? 'Pendiente de cotización' : 'Supera el presupuesto'}</span>}
            </button>)}</div>
            <Panel title={'Detalle del escenario · ' + base.name} action={<button className="primary" disabled={!active.feasible || !active.quantity} onClick={savePlan}>Guardar plan</button>}>
              <div className="summary"><span>Compra <b>{money(active.purchase)}</b></span><span>Ingredientes utilizados <b>{money(active.consumed)}</b></span><span>Margen estimado <b>{money(active.margin)}</b></span></div>
              {!active.feasible && <p className="warn">{active.pending ? 'Hay ingredientes pendientes de cotización.' : 'La compra supera el presupuesto disponible.'}</p>}
              <div className="plate-grid">{active.plates.map(({ recipe, quantity, sold, leftovers }) => {
                const data = estimates[recipe.id];
                return <label className="plate" key={recipe.id}>{recipe.name}
                  <input type="number" min="0" step="1" value={quantity} onChange={event => setOverrides({ ...overrides, [recipe.id]: Math.max(0, Math.trunc(Number(event.target.value))) })} />
                  <small>{sold} ventas estimadas · {leftovers} sobrantes</small>
                  <small>{data.samples ? data.samples + (data.demo ? ' días de ejemplo · ' : ' días comparables · ') + data.soldOut + ' con agotamiento' : 'Estimación inicial de demostración'}</small>
                </label>;
              })}</div>
              <div className="table-wrap"><table><thead><tr><th>Ingrediente</th><th>Necesario</th><th>En stock</th><th>Faltante</th><th>Presentación de compra</th><th>Compra</th><th>Stock final</th></tr></thead><tbody>
                {active.supplies.map(item => <tr key={item.id}><th>{item.name}</th><td>{number(item.required)} {item.unit}</td><td>{number(item.stock)} {item.unit}</td>
                  <td>{number(item.missing)} {item.unit}</td><td>{item.missing > 1e-8 ? <><select aria-label={'Producto para ' + item.name} value={item.product?.id ?? ''} onChange={event => setChoices({ ...choices, [item.id]: event.target.value })}>
                    {catalog.filter(product => product.ingredient === item.id).map(product => <option key={product.id} value={product.id}>{product.name} · {money(product.price)}</option>)}
                    {!item.product && <option value="">Sin cotización</option>}</select><small className="table-note">{item.packages} envase(s) · {item.product?.source ?? 'Catálogo de demostración'}</small></> : '—'}</td>
                  <td>{money(item.purchase)}</td><td>{number(item.remaining)} {item.unit}</td></tr>)}
              </tbody></table></div>
            </Panel>
          </> : <Panel title="Escenarios de producción"><p>Selecciona al menos un plato para calcular el plan.</p></Panel>}
        </>}

        {(page === 'Recetas' || page === 'Recetas del menú') && <>
          {page === 'Recetas del menú' && <div className="back-row"><button className="secondary" onClick={() => navigate('Planificar')}>← Volver al menú</button><button className="secondary" onClick={() => navigate('Detalle')}>Ver detalles del menú</button></div>}
          {editing && <Panel title={editing.id ? 'Editar receta' : 'Nueva receta'}>
            <form onSubmit={saveRecipe}>
              <div className="form-grid"><label>Nombre<input required value={editing.name} onChange={event => setEditing({ ...editing, name: event.target.value })} /></label>
              <label>Tipo de plato<select value={editing.category ?? 'main'} onChange={event => setEditing({ ...editing, category: event.target.value })}><option value="main">Segundo</option><option value="soup">Caldo</option><option value="drink">Refresco</option></select></label>
              <label>{editing.category === 'drink' ? 'Rendimiento (vasos)' : 'Rendimiento (porciones)'}<input required type="number" min="1" step="1" value={editing.yield} onChange={event => setEditing({ ...editing, yield: event.target.value })} /></label>
              <label>Precio de venta por porción (S/)<input required type="number" min="0" step="0.01" value={editing.price} onChange={event => setEditing({ ...editing, price: event.target.value })} /></label></div>
              <label className="preparation-input">Preparación personalizada<textarea rows="4" placeholder="Déjalo vacío para mostrar los pasos de la receta base, si están disponibles." value={editing.preparation ?? ''} onChange={event => setEditing({ ...editing, preparation: event.target.value })} /></label>
              <h3>Ingredientes por lote</h3><div className="form-grid">{inventory.map(item => <label key={item.id}>{item.name} ({item.unit})<input type="number" min="0" step="0.001" value={editing.items[item.id] ?? ''} onChange={event => setEditing({ ...editing, items: { ...editing.items, [item.id]: Number(event.target.value) } })} /></label>)}</div>
              <div className="actions"><button className="primary">Guardar receta</button><button className="secondary" type="button" onClick={() => setEditing(null)}>Cancelar</button></div>
            </form>
          </Panel>}
          <div className="recipe-grid">{(page === 'Recetas del menú' ? selected : menu).map(recipe => {
            const cost = inventory.reduce((sum, item) => sum + (recipe.items[item.id] || 0) * item.cost, 0);
            const steps = recipeSteps(recipe, inventory, number);
            const reference = recipeReferences[recipe.id] ?? (recipe.category === 'soup' || recipe.style === 'Picantería' ? picanteriaReference : null);
            return <Panel key={recipe.id} title={recipe.name} action={<button className="secondary" onClick={() => { setEditing(recipe); setNotice(''); }}>Editar</button>}>
              <p>{categoryLabels[dishCategory(recipe)]} · {recipe.yield} {recipe.category === 'drink' ? 'vasos' : 'porciones'} · Venta {money(recipe.price)} por {recipe.category === 'drink' ? 'vaso' : 'porción'}</p>
                            <h3>Ingredientes para el lote</h3>
              <ul className="ingredient-list">{inventory.filter(item => recipe.items[item.id] > 0).map(item => <li key={item.id}><span>{item.name}</span><b>{formatRecipeAmount(recipe.items[item.id], item.unit, number)}</b></li>)}</ul>
              {recipe.preparation?.trim() ? <><h3>Preparación personalizada</h3><p className="recipe-custom">{recipe.preparation}</p></> :
                steps.length ? <><h3>Preparación paso a paso</h3><ol className="recipe-steps">{steps.map(step => <li key={step}>{step}</li>)}</ol></> :
                <p>Agrega una preparación que corresponda a los ingredientes del lote.</p>}
              {reference && <p className="recipe-reference"><a href={reference[1]} target="_blank" rel="noreferrer">{reference[0]} ↗</a></p>}
              <div className="summary"><span>Costo del lote <b>{money(cost)}</b></span><span>Costo por porción <b>{money(cost / recipe.yield)}</b></span></div>
            </Panel>;
          })}</div>
        </>}

        {page === 'Insumos y precios' && <>
          <Panel title="Catálogo de productos">
            <label>Buscar ingrediente o producto<input type="search" placeholder="Ej. arroz" value={filter} onChange={event => setFilter(event.target.value)} /></label>
            <div className="table-wrap"><table><thead><tr><th>Producto</th><th>Precio por envase</th><th>Precio unitario</th><th>Procedencia</th></tr></thead><tbody>
              {catalogResults.map(item => <tr key={item.id}><th>{item.name}</th><td>{money(item.price)}</td><td>{money(item.price / item.size)} / {inventory.find(ingredient => ingredient.id === item.ingredient)?.unit}</td><td>{item.source ?? 'Demostración'}</td></tr>)}
            </tbody></table></div>{!catalogResults.length && <p>No se encontraron productos.</p>}
            <h3>Agregar cotización local</h3>
            <form className="form-grid" onSubmit={event => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const ingredient = inventory.find(item => item.id === data.get('ingredient'));
              const size = Number(data.get('size'));
              const price = Number(data.get('price'));
              setCatalog([...catalog, { id: crypto.randomUUID(), ingredient: ingredient.id, name: data.get('product'), size, price, source: data.get('source') + ' · ' + today }]);
              event.currentTarget.reset();
              setNotice('Cotización agregada al catálogo.');
            }}>
              <label>Ingrediente<select name="ingredient">{inventory.map(item => <option key={item.id} value={item.id}>{item.name} ({item.unit})</option>)}</select></label>
              <label>Producto<input name="product" required /></label><label>Contenido (kg o L)<input name="size" type="number" required min="0.001" step="0.001" /></label>
              <label>Precio por envase (S/)<input name="price" type="number" required min="0.01" step="0.01" /></label><label>Proveedor o comercio<input name="source" required /></label>
              <div className="form-submit"><button className="primary">Agregar cotización</button></div>
            </form>
          </Panel>
          <Panel title="Inventario"><form key={inventory.map(item => item.stock + ':' + item.cost).join('|')} onSubmit={event => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            setInventory(inventory.map(item => ({ ...item, stock: Number(form.get(item.id)), cost: Number(form.get(item.id + '-cost')) })));
            setNotice('Inventario guardado.');
          }}>
            <div className="table-wrap"><table><thead><tr><th>Ingrediente</th><th>Existencias</th><th>Costo del inventario</th></tr></thead><tbody>{inventory.map(item => <tr key={item.id}><th>{item.name}</th><td><input required type="number" min="0" step="0.001" name={item.id} defaultValue={item.stock} aria-label={'Existencias de ' + item.name + ' en ' + item.unit} /> {item.unit}</td><td><input required type="number" min="0" step="0.01" name={item.id + '-cost'} defaultValue={item.cost} aria-label={'Costo de ' + item.name} /> S/ por {item.unit}</td></tr>)}</tbody></table></div>
            <button className="primary">Guardar inventario</button>
          </form></Panel>
          <Panel title="Fuentes externas">
            <p>Integración automática pendiente. El catálogo de prueba y las cotizaciones locales permiten simular compras.</p>
            <ul className="source-list">{links.map(([name, description, url]) => <li key={name}><b>{name}</b><span>{description}</span><a href={url} target="_blank" rel="noreferrer">Ver fuente ↗</a></li>)}</ul>
          </Panel>
        </>}

        {page === 'Registro diario' && <>
          <Panel title="Fecha de cierre"><label>Fecha<input type="date" value={date} onChange={event => { setPlanDate(event.target.value); }} /></label></Panel>
          {!selected.length && <Panel title="Platos del día"><p>Selecciona los platos desde Planificar para registrar el cierre.</p></Panel>}
          {menu.filter(recipe => selectedIds.includes(recipe.id) || entries.some(row => row.date === date && row.recipeId === recipe.id)).map(recipe => {
            const row = entries.find(item => item.date === date && item.recipeId === recipe.id);
            const planned = plans.find(plan => plan.date === date)?.plates.find(item => item.recipe.id === recipe.id)?.quantity;
            return <Panel key={date + recipe.id} title={recipe.name}>
              <p>Planificadas: {planned ?? 'Sin plan guardado'}</p>
              <form className="form-grid" onSubmit={event => saveEntry(event, recipe)}>
                <label>Preparadas<input required name="made" type="number" min="0" step="1" defaultValue={row?.made ?? planned ?? 0} /></label>
                <label>Vendidas<input required name="sold" type="number" min="0" step="1" defaultValue={row?.sold ?? 0} /></label>
                <div className="form-submit"><button className="primary">Guardar registro</button></div>
              </form>
              {row && <p>{row.left} porciones sobrantes · {row.soldOut ? 'Plato agotado' : 'Sin agotamiento registrado'}</p>}
            </Panel>;
          })}
        </>}

        {page === 'Historial' && <History plans={plans} entries={entries} dailyMenus={dailyMenus} menu={menu} today={today}
          money={money} number={number} weekdays={weekdays} weekdayOf={weekdayOf}
          openReport={next => { setReportDate(next); navigate('Reportes'); }}
          resume={next => { setPlanDate(next); navigate('Planificar'); }} />}

        {page === 'Reportes' && <>
          <Panel title="Fecha del reporte"><label>Fecha<input type="date" value={reportDate} onChange={event => { if (event.target.value) setReportDate(event.target.value); }} /></label></Panel>
          <Panel title="Plan diario de producción y compras" action={currentPlan && <button className="secondary" onClick={() => download('plan-' + reportDate + '.csv', [
            ['Fecha', reportDate], ['Escenario', currentPlan.name], ['Presupuesto', currentPlan.budget], ['Desembolso', currentPlan.purchase], ['Margen estimado', currentPlan.margin], [],
            ['Plato', 'Porciones', 'Ventas estimadas', 'Sobrantes estimados'], ...currentPlan.plates.map(plate => [plate.recipe.name, plate.quantity, plate.sold, plate.leftovers]), [],
            ['Ingrediente', 'Unidad', 'Necesario', 'Faltante', 'Producto', 'Envases', 'Compra', 'Stock final', 'Procedencia'],
            ...currentPlan.supplies.map(item => [item.name, item.unit, item.required, item.missing, item.packages ? item.product.name : '', item.packages, item.purchase, item.remaining, item.packages ? item.product.source ?? 'Demostración' : 'Inventario']),
          ])}>Descargar CSV</button>}>
            {currentPlan ? <>
              {currentPlan.demo && <p className="demo-note">Plan de demostración</p>}
              <div className="summary"><span>Porciones <b>{currentPlan.quantity}</b></span><span>Compra <b>{money(currentPlan.purchase)}</b></span><span>Margen estimado <b>{money(currentPlan.margin)}</b></span></div>
              <ul className="ingredient-list">{currentPlan.plates.map(plate => <li key={plate.recipe.id}><span>{plate.recipe.name}</span><b>{plate.quantity} porciones</b></li>)}</ul>
              <div className="table-wrap"><table><thead><tr><th>Ingrediente</th><th>Faltante</th><th>Producto</th><th>Envases</th><th>Compra</th><th>Procedencia</th></tr></thead><tbody>{currentPlan.supplies.map(item => <tr key={item.id}><th>{item.name}</th><td>{number(item.missing)} {item.unit}</td><td>{item.packages ? item.product.name : '—'}</td><td>{item.packages}</td><td>{money(item.purchase)}</td><td>{item.packages ? item.product.source ?? 'Demostración' : 'Inventario'}</td></tr>)}</tbody></table></div>
            </> : <p>Guarda un plan para esta fecha desde Planificar.</p>}
          </Panel>
          <Panel title="Resumen semanal" action={weeklyRows.length > 0 && <button className="secondary" onClick={() => download('semana-' + week + '.csv', [
            ['Fecha', 'Plato', 'Planificadas', 'Preparadas', 'Vendidas', 'Sobrantes', 'Agotado'], ...weeklyRows, [],
            ['Referencia externa', 'Región', 'Periodo', 'Toneladas rescatadas', 'Personas beneficiadas (aprox.)', 'Fuente'],
            ['Banco de Alimentos de ADRA Perú', 'Arequipa', 2025, 372.54, 85000, links[2][2]],
          ])}>Descargar CSV</button>}>
            <p>{week} a {end}</p>
            {weeklyRows.length ? <div className="table-wrap"><table><thead><tr>{['Fecha', 'Plato', 'Planificadas', 'Preparadas', 'Vendidas', 'Sobrantes', 'Agotado'].map(label => <th key={label}>{label}</th>)}</tr></thead><tbody>{weeklyRows.map((row, index) => <tr key={index}>{row.map((value, column) => <td key={column}>{value === '' ? '—' : value}</td>)}</tr>)}</tbody></table></div> : <p>Aún no hay planes ni registros para esta semana.</p>}
            <div className="context"><b>Rescate de alimentos en Arequipa · ADRA Perú, 2025</b><p>372,54 toneladas rescatadas y aproximadamente 85 000 personas beneficiadas en la región.</p><a href={links[2][2]} target="_blank" rel="noreferrer">Consultar publicación ↗</a></div>
          </Panel>
        </>}
      </div>
    </main>
  </div>;
}
createRoot(document.getElementById('root')).render(<App />);






