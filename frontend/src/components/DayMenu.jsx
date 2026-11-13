import React, { useEffect, useRef, useState } from 'react';
import { shiftDate, soupRecipes, traditionUrl, weekdayOf, weekdays } from '../data/demo/weekly.js';

export const categoryLabels = { soup: 'Caldo', main: 'Segundo', drink: 'Refresco' };
export const dishCategory = recipe => recipe.category ?? 'main';

const categories = [
  { id: 'soup', title: 'Caldo', label: 'Elige un caldo', empty: 'Sin caldo', icon: 'soup' },
  { id: 'main', title: 'Segundo', label: 'Elige un segundo', empty: 'Seleccionar segundo', icon: 'main' },
  { id: 'drink', title: 'Refresco', label: 'Elige un refresco', empty: 'Sin refresco', icon: 'drink' },
];

const formatDay = date => new Intl.DateTimeFormat('es-PE', {
  day: 'numeric', month: 'long', timeZone: 'UTC',
}).format(new Date(date + 'T12:00:00Z'));

const icons = { soup: '♨', main: '◉', drink: '♧' };
export function DayMenu({ date, menu, selected, onDateChange, onDishChange, onSecondToggle, onGenerate }) {
  const day = weekdayOf(date);
  const monday = shiftDate(date, -((day + 6) % 7));
  const traditional = soupRecipes[day];
  return <section className="day-menu">
    <div className="day-banner">
      <div><p>MENÚ DEL DÍA</p><h2>{weekdays[day]}, {formatDay(date)}</h2></div>
      <label>Elegir fecha<input type="date" value={date} onChange={event => onDateChange(event.target.value)} /></label>
    </div>
    <div className="day-calendar" aria-label="Días de la semana">
      {Array.from({ length: 7 }, (_, index) => {
        const dayDate = shiftDate(monday, index);
        const weekday = weekdayOf(dayDate);
        return <button key={dayDate} className={dayDate === date ? 'current-day' : ''}
          aria-label={weekdays[weekday] + ' ' + formatDay(dayDate)} aria-pressed={dayDate === date}
          onClick={() => onDateChange(dayDate)}>
          <span>{weekdays[weekday].slice(0, 3)}</span><strong>{Number(dayDate.slice(-2))}</strong>
        </button>;
      })}
    </div>
    <div className="day-courses">
      {categories.map(category => {
        const options = menu.filter(recipe => dishCategory(recipe) === category.id);
        const chosen = selected.filter(recipe => dishCategory(recipe) === category.id);
        const showOptions = dishes => dishes.map(recipe => <option key={recipe.id} value={recipe.id}>{recipe.name}</option>);
        return <article key={category.id} className={'course course-' + category.id + (chosen.length ? ' course-filled' : '')}>
          <span className="course-icon" aria-hidden="true">{icons[category.icon]}</span>
          <h3>{category.title}</h3>
          <p>{category.id === 'soup' ? 'Tradición del día · ' + traditional.name : category.id === 'main' ? 'Agrega uno o varios segundos' : 'Bebidas preparadas por porción'}</p>
          {category.id === 'main' ? <>
            <label className="course-select"><span className="sr-only">Agregar segundo</span>
              <select value="" disabled={chosen.length === options.length}
                onChange={event => { if (event.target.value) onSecondToggle(event.target.value); }}>
                <option value="" disabled>{chosen.length === options.length ? 'Todos los segundos agregados' : '+ Agregar segundo'}</option>
                {['Picantería', 'Menú diario'].map(style => {
                  const available = options.filter(recipe => (recipe.style ?? 'Menú diario') === style && !chosen.some(item => item.id === recipe.id));
                  return available.length ? <optgroup key={style} label={style}>{showOptions(available)}</optgroup> : null;
                })}
              </select>
            </label>
            {chosen.length > 0 && <ul className="selected-seconds" aria-label="Segundos seleccionados">{chosen.map(recipe =>
              <li key={recipe.id}><span>{recipe.name}</span><button type="button" aria-label={'Quitar ' + recipe.name} onClick={() => onSecondToggle(recipe.id)}>×</button></li>
            )}</ul>}
          </> : <label className="course-select"><span className="sr-only">{category.label}</span>
            <select value={chosen[0]?.id ?? ''} onChange={event => onDishChange(category.id, event.target.value)}>
              <option value="">{category.empty}</option>
              {showOptions(options)}
            </select>
          </label>}
        </article>;
      })}
    </div>
    <div className="day-footer">
      <a href={traditionUrl} target="_blank" rel="noreferrer">Calendario de la tradición picantera ↗</a>
      <button className="primary generate-button" disabled={!selected.length} onClick={onGenerate}>Generar menú del día <span aria-hidden="true">→</span></button>
    </div>
  </section>;
}

export function MenuActions({ date, dishes, onClose, onDetails, onRecipes }) {
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    element.showModal();
    return () => { if (element.open) element.close(); };
  }, []);

  return <dialog ref={dialog} className="menu-dialog" aria-labelledby="menu-actions-title"
    onCancel={event => { event.preventDefault(); onClose(); }}>
    <button className="dialog-close" onClick={onClose} aria-label="Cerrar">×</button>
    <p className="dialog-date">{weekdays[weekdayOf(date)]}, {formatDay(date)}</p>
    <h2 id="menu-actions-title">¿Qué deseas hacer?</h2>
    <ul className="menu-confirmation">{categories.flatMap(category => dishes.filter(recipe => dishCategory(recipe) === category.id)).map(recipe => <li key={recipe.id}><b>{categoryLabels[dishCategory(recipe)]}</b><span>{recipe.name}</span></li>)}</ul>
    <div className="menu-actions">
      <button className="primary" onClick={onDetails}>Ver detalles del menú <span aria-hidden="true">→</span></button>
      <button className="secondary" onClick={onRecipes}>Ver recetas elegidas <span aria-hidden="true">→</span></button>
    </div>
  </dialog>;
}


