export const traditionUrl = 'https://sociedadpicanteradearequipa.pe/picanteria/';
export const weekdays = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export const soupRecipes = [
  { id: 'puchero', name: 'Puchero', items: { res: 1.6, papa: 1.4, repollo: 0.8, zapallo: 0.7 } },
  { id: 'chaque', name: 'Chaque', items: { res: 1.2, papa: 1.5, trigo: 0.6, repollo: 0.5 } },
  { id: 'chairo', name: 'Chairo', items: { res: 1, chuno: 0.6, papa: 1, zapallo: 0.5 } },
  { id: 'chochoca', name: 'Chochoca', items: { res: 1, maiz: 0.65, papa: 1.2, cebolla: 0.2 } },
  { id: 'chupe-chuno', name: 'Chupe de chuño', items: { chuno: 0.7, papa: 1.1, leche: 0.8, queso: 0.45 } },
  { id: 'chupe-viernes', name: 'Chupe de viernes', items: { pescado: 1.4, papa: 1.2, leche: 0.75, arroz: 0.25, queso: 0.35 } },
  { id: 'caldo-blanco', name: 'Caldo blanco', items: { cordero: 1.6, papa: 1.4, arroz: 0.3, cebolla: 0.2 } },
  { id: 'timpusca', name: 'Timpusca', items: { res: 1.4, papa: 1.2, trigo: 0.45, zapallo: 0.6 } },
].map(recipe => ({ ...recipe, category: 'soup', yield: 10, price: 7 }));

export const extraIngredients = [
  ['res', 'Carne de res', 'kg', 2, 24],
  ['cordero', 'Carne de cordero', 'kg', 2, 27],
  ['pescado', 'Pescado', 'kg', 1, 17],
  ['chuno', 'Chuño', 'kg', 1, 12],
  ['maiz', 'Maíz para chochoca', 'kg', 1, 8],
  ['trigo', 'Trigo pelado', 'kg', 1, 7],
  ['repollo', 'Repollo', 'kg', 1, 3.5],
  ['zapallo', 'Zapallo', 'kg', 1, 4],
  ['leche', 'Leche', 'L', 1, 6],
  ['queso', 'Queso fresco', 'kg', 0.5, 20],
].map(([id, name, unit, stock, cost]) => ({ id, name, unit, stock, cost }));

export const extraProducts = extraIngredients.map(item => ({
  id: 'demo-' + item.id, ingredient: item.id, name: item.name + ' · 1 ' + item.unit, size: 1, price: item.cost,
}));

export function shiftDate(date, days) {
  const shifted = new Date(date + 'T12:00:00Z');
  shifted.setUTCDate(shifted.getUTCDate() + days);
  return shifted.toISOString().slice(0, 10);
}

export function weekdayOf(date) {
  return new Date(date + 'T12:00:00Z').getUTCDay();
}

export function demoHistory(today, mainRecipes, inventory, catalog, calculate, option) {
  const result = { plans: [], entries: [] };
  for (let offset = 28; offset >= 1; offset--) {
    const date = shiftDate(today, -offset);
    const day = weekdayOf(date);
    const dishes = [soupRecipes[day], mainRecipes[day % mainRecipes.length]];
    const estimates = Object.fromEntries(dishes.map((recipe, index) => [
      recipe.id, { count: 22 + (day * 3 + offset + index * 4) % 10 },
    ]));
    const plan = calculate(option, dishes, inventory, catalog, {}, estimates, 160, {});
    result.plans.push({ ...plan, date, budget: 160, demo: true });
    plan.plates.forEach(({ recipe, quantity }, index) => {
      const made = quantity + (offset + index) % 3;
      const sold = made - (offset + day + index) % 5;
      result.entries.push({ date, recipeId: recipe.id, name: recipe.name, made, sold,
        left: made - sold, soldOut: sold === made, demo: true });
    });
  }
  return result;
}
