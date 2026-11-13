export const drinkIngredients = [
  ['maiz-morado', 'Maíz morado', 'kg', 0.6, 9],
  ['pina', 'Piña', 'kg', 0.8, 6],
  ['limon', 'Limón', 'kg', 0.6, 5],
  ['cebada', 'Cebada tostada', 'kg', 0.5, 7],
  ['maracuya', 'Pulpa de maracuyá', 'kg', 0.5, 12],
  ['azucar', 'Azúcar', 'kg', 1, 4],
  ['agua', 'Agua potable', 'L', 20, 0.2],
].map(([id, name, unit, stock, cost]) => ({ id, name, unit, stock, cost }));

export const drinkRecipes = [
  { id: 'chicha-morada', name: 'Chicha morada', items: { 'maiz-morado': 0.35, pina: 0.3, limon: 0.12, azucar: 0.2, agua: 3 },
    preparation: 'Hierve el maíz morado con la piña. Cuela, deja enfriar y añade azúcar y limón al gusto.' },
  { id: 'refresco-cebada', name: 'Refresco de cebada', items: { cebada: 0.3, limon: 0.12, azucar: 0.2, agua: 3 },
    preparation: 'Hierve la cebada tostada en agua. Cuela, deja enfriar y agrega azúcar y limón al gusto.' },
  { id: 'maracuya', name: 'Refresco de maracuyá', items: { maracuya: 0.45, azucar: 0.2, agua: 2.6 },
    preparation: 'Mezcla la pulpa con agua, cuela las semillas, endulza al gusto y refrigera.' },
  { id: 'limonada', name: 'Limonada', items: { limon: 0.55, azucar: 0.2, agua: 2.6 },
    preparation: 'Exprime los limones, mezcla el jugo con agua y azúcar al gusto, y sirve frío.' },
].map(recipe => ({ ...recipe, category: 'drink', yield: 10, price: 3 }));

export const drinkProducts = drinkIngredients.map(({ id, name, unit, cost }) => ({
  id: 'demo-' + id, ingredient: id, name: name + ' · 1 ' + unit, size: 1, price: cost,
}));
