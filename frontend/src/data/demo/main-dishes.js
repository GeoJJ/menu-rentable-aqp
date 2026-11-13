export const mainRecipes = [
  { id: 'rocoto-pastel', name: 'Rocoto relleno con pastel de papa', style: 'Picantería', price: 20, items: { rocoto: 1.3, res: 1.1, papa: 1.8, queso: 0.6, leche: 0.45, huevo: 0.35, cebolla: 0.45 } },
  { id: 'locro-pecho', name: 'Locro de pecho', style: 'Picantería', price: 18, items: { res: 1.6, papa: 2, cebolla: 0.45, aji: 0.12, arroz: 0.7, aceite: 0.18 } },
  { id: 'matasca', name: 'Matasca de carne', style: 'Picantería', price: 16, items: { res: 1.3, papa: 1.5, cebolla: 0.45, tomate: 0.55, aji: 0.12, arroz: 0.75 } },
  { id: 'malaya', name: 'Malaya dorada con papas', style: 'Picantería', price: 19, items: { res: 1.7, papa: 1.8, cebolla: 0.35, aceite: 0.3 } },
  { id: 'hiro', name: 'Hiro de zapallo con arroz', style: 'Picantería', price: 13, items: { zapallo: 2.3, papa: 1.1, queso: 0.45, leche: 0.35, cebolla: 0.35, arroz: 0.75 } },
  { id: 'lomo-saltado', name: 'Lomo saltado', style: 'Menú diario', price: 17, items: { res: 1.45, papa: 1.6, arroz: 0.8, tomate: 0.65, cebolla: 0.65, sillao: 0.12, aceite: 0.28 } },
  { id: 'aji-gallina', name: 'Ají de gallina', style: 'Menú diario', price: 14, items: { pollo: 1.35, papa: 1.25, arroz: 0.75, leche: 0.65, pan: 0.3, aji: 0.22, huevo: 0.3 } },
  { id: 'tallarines-rojos', name: 'Tallarines rojos con pollo', style: 'Menú diario', price: 13, items: { pasta: 1.1, pollo: 1.6, tomate: 1.2, cebolla: 0.45, zanahoria: 0.35, aceite: 0.15 } },
  { id: 'chaufa', name: 'Arroz chaufa de pollo', style: 'Menú diario', price: 14, items: { arroz: 1.1, pollo: 1.2, huevo: 0.5, sillao: 0.16, aceite: 0.2, cebollaChina: 0.3 } },
  { id: 'lentejas', name: 'Lentejas con arroz y huevo', style: 'Menú diario', price: 11, items: { lenteja: 0.85, arroz: 0.8, huevo: 0.6, cebolla: 0.35, zanahoria: 0.45, aceite: 0.13 } },
  { id: 'pescado-frito', name: 'Pescado frito con arroz y ensalada', style: 'Menú diario', price: 15, items: { pescado: 1.65, arroz: 0.8, repollo: 0.65, tomate: 0.55, aceite: 0.35 } },
  { id: 'pollo-plancha', name: 'Pollo a la plancha con papas', style: 'Menú diario', price: 14, items: { pollo: 1.65, papa: 1.7, arroz: 0.7, zanahoria: 0.45, aceite: 0.22 } },
].map(recipe => ({ ...recipe, category: 'main', yield: 10 }));

export const mainIngredients = [
  ['rocoto', 'Rocoto', 'kg', 0.7, 8],
  ['huevo', 'Huevo sin cáscara', 'kg', 0.6, 10],
  ['aji', 'Pasta de ají amarillo', 'kg', 0.25, 14],
  ['tomate', 'Tomate', 'kg', 0.8, 4.5],
  ['sillao', 'Sillao', 'L', 0.25, 9],
  ['pan', 'Pan', 'kg', 0.3, 9],
  ['pasta', 'Tallarines secos', 'kg', 0.6, 7],
  ['zanahoria', 'Zanahoria', 'kg', 0.5, 3.5],
  ['cebollaChina', 'Cebolla china', 'kg', 0.25, 8],
  ['lenteja', 'Lenteja seca', 'kg', 0.6, 8],
].map(([id, name, unit, stock, cost]) => ({ id, name, unit, stock, cost }));

export const mainProducts = mainIngredients.map(({ id, name, unit, cost }) => ({
  id: 'demo-' + id, ingredient: id, name: name + ' · 1 ' + unit, size: 1, price: cost,
}));
