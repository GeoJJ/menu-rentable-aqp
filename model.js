export const ingredients = [
  { id: 'arroz', name: 'Arroz crudo', unit: 'kg', stock: 1.6, cost: 4.2 },
  { id: 'pollo', name: 'Pollo eviscerado', unit: 'kg', stock: 5, cost: 11.5 },
  { id: 'aceite', name: 'Aceite vegetal', unit: 'L', stock: 1, cost: 9 },
  { id: 'papa', name: 'Papa blanca', unit: 'kg', stock: 2, cost: 3 },
  { id: 'cebolla', name: 'Cebolla roja', unit: 'kg', stock: 0.8, cost: 3.5 },
];
export const recipes = [
  { id: 'arroz-pollo', name: 'Arroz con pollo', yield: 10, price: 12, items: { arroz: 1.2, pollo: 2, aceite: 0.25, cebolla: 0.2 } },
  { id: 'estofado', name: 'Estofado de pollo', yield: 10, price: 13, items: { pollo: 1.8, papa: 1.5, cebolla: 0.4, aceite: 0.15 } },
];
export const products = [
  { id: 'a5', ingredient: 'arroz', name: 'Arroz superior · bolsa de 5 kg', size: 5, price: 20 },
  { id: 'a1', ingredient: 'arroz', name: 'Arroz superior · bolsa de 1 kg', size: 1, price: 4.6 },
  { id: 'p1', ingredient: 'pollo', name: 'Pollo eviscerado · 1 kg', size: 1, price: 11.5 },
  { id: 'o1', ingredient: 'aceite', name: 'Aceite vegetal · botella de 1 L', size: 1, price: 9 },
  { id: 't1', ingredient: 'papa', name: 'Papa blanca · 1 kg', size: 1, price: 3 },
  { id: 'c1', ingredient: 'cebolla', name: 'Cebolla roja · 1 kg', size: 1, price: 3.5 },
];
export const scenarioOptions = [
  { name: 'Conservador', factor: 0.85 },
  { name: 'Base', factor: 1 },
  { name: 'Ampliado', factor: 1.15 },
];
export const demoDemand = { 'arroz-pollo': 30, estofado: 20 };
const dayOfWeek = date => new Date(date + 'T12:00:00').getDay();
export function estimate(recipe, date, entries) {
  const matching = entries.filter(row => row.date < date && row.recipeId === recipe.id && dayOfWeek(row.date) === dayOfWeek(date));
  const actual = matching.filter(row => !row.demo);
  const comparable = actual.length ? actual : matching;
  if (!comparable.length) return { count: demoDemand[recipe.id] ?? recipe.yield, samples: 0, soldOut: 0 };
  return {
    count: Math.round(comparable.reduce((sum, row) => sum + row.sold, 0) / comparable.length),
    samples: comparable.length, demo: !actual.length,
    soldOut: comparable.filter(row => row.soldOut).length,
  };
}
export function calculate(option, selected, inventory, catalog, choices, estimates, budget, overrides) {
  const plates = selected.map(recipe => {
    const demand = estimates[recipe.id].count;
    const quantity = overrides[recipe.id] ?? Math.round(demand * option.factor);
    const sold = Math.min(quantity, demand);
    return { recipe, quantity, sold, leftovers: quantity - sold };
  });
  const supplies = inventory.map(ingredient => {
    const required = plates.reduce((sum, { recipe, quantity }) =>
      sum + (recipe.items[ingredient.id] || 0) * quantity / recipe.yield, 0);
    const missing = Math.max(0, required - ingredient.stock);
    const product = catalog.find(item => item.id === choices[ingredient.id]) ??
      catalog.find(item => item.ingredient === ingredient.id);
    const packages = missing > 1e-8 && product ? Math.ceil(missing / product.size - 1e-8) : 0;
    return { ...ingredient, required, missing, product, packages,
      purchase: packages * (product?.price ?? 0),
      consumed: Math.min(required, ingredient.stock) * ingredient.cost +
        missing * (product ? product.price / product.size : ingredient.cost),
      remaining: Math.max(0, ingredient.stock + packages * (product?.size ?? 0) - required),
    };
  }).filter(item => item.required > 0);
  const totals = plates.reduce((sum, plate) => ({
    quantity: sum.quantity + plate.quantity, sold: sum.sold + plate.sold,
    leftovers: sum.leftovers + plate.leftovers, revenue: sum.revenue + plate.sold * plate.recipe.price,
  }), { quantity: 0, sold: 0, leftovers: 0, revenue: 0 });
  const purchase = supplies.reduce((sum, item) => sum + item.purchase, 0);
  const consumed = supplies.reduce((sum, item) => sum + item.consumed, 0);
  const pending = supplies.some(item => item.missing > 1e-8 && !item.product);
  return { ...option, ...totals, plates, supplies, purchase, consumed, pending,
    margin: totals.revenue - consumed, feasible: !pending && purchase <= budget + 1e-8 };
}

