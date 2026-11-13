const ins = 'https://repositorio.ins.gob.pe/items/d06a2e77-b7f9-4ef1-8bb0-c618dfd6c555/full';
const tradition = 'https://sociedadpicanteradearequipa.pe/picanteria/';
export const recipeReferences = {
  'rocoto-pastel': ['PROMPERÚ · Rocoto relleno', 'https://www.peru.travel/es/inspirate/rocoto-relleno-simbolo-de-la-gastronomia-arequipena-que-conquista-al-mundo'],
  'locro-pecho': ['Instituto Nacional de Salud · La mejor receta Arequipa', ins],
  'lomo-saltado': ['PROMPERÚ · Lomo saltado', 'https://www.peru.travel/gastronomia/es/recetas/platos-de-fondo/lomo-saltado.html'],
  'aji-gallina': ['PROMPERÚ · Ají de gallina', 'https://www.peru.travel/gastronomia/pe/recetas/platos-de-fondo/aji-de-gallina.html'],
  'chicha-morada': ['PROMPERÚ · Chicha morada', 'https://www.peru.travel/es/inspirate/chicha-morada-bebida-prehispanica-de-origen-peruano'],
};
export const picanteriaReference = ['Sociedad Picantera de Arequipa · Contexto del plato', tradition];

export const stepsByRecipe = {
  'arroz-pollo': [
    'Lava y escurre {arroz}. Pica {cebolla} y separa {pollo} en piezas de tamaño parejo.',
    'Usa parte de {aceite} para dorar el pollo por tandas. Retira las piezas y sofríe la cebolla en la misma olla.',
    'Mezcla el arroz con el aderezo. Añade agua según el tipo de arroz y devuelve el pollo a la olla. Tapa y cocina a fuego bajo hasta que el arroz esté tierno y el pollo cocido por completo.',
    'Deja reposar tapado unos minutos, separa los granos con un tenedor y reparte en porciones.',
  ],
  estofado: [
    'Corta {pollo} en piezas parejas. Pica {cebolla} y corta {papa} en trozos grandes.',
    'Dora el pollo por tandas con parte de {aceite}. Retíralo y sofríe la cebolla con el resto, raspando el fondo de la olla.',
    'Devuelve el pollo, agrega agua suficiente para formar la salsa y tapa. Incorpora la papa cuando el pollo lleve unos minutos de cocción.',
    'Cocina a fuego suave hasta que el pollo esté completamente cocido y la papa se pueda atravesar con un tenedor. Destapa al final si la salsa necesita reducir.',
  ],
  puchero: [
    'Corta {res} en piezas grandes y ponlas a cocer en agua. Retira la espuma y mantén un hervor suave hasta que la carne empiece a ablandar.',
    'Pela y trocea {papa} y {zapallo}. Agrega primero la papa y después el zapallo para que conserve la forma.',
    'Corta {repollo} en gajos y añádelo en los últimos minutos. Sirve cada porción con carne, verduras y caldo.',
  ],
  chaque: [
    'Enjuaga {trigo} y remójalo si la presentación lo requiere. Corta {res} en trozos y empieza el caldo con agua suficiente para cubrirla.',
    'Incorpora el trigo al hervor suave. Cuando empiece a abrirse, agrega {papa} cortada en trozos.',
    'Chanca parte de la papa dentro de la olla para dar cuerpo. Añade {repollo} en tiras al final y reparte carne, trigo y caldo entre las porciones.',
  ],
  chairo: [
    'Remoja {chuno} según su presentación, enjuágalo y escúrrelo. Trocea {res}, {papa} y {zapallo}.',
    'Cuece la carne en agua a fuego suave hasta que comience a ablandar. Añade el chuño y deja que se hidrate por completo en el caldo.',
    'Agrega la papa y luego el zapallo. Cocina hasta que todo esté tierno. Remueve antes de servir para repartir los sólidos por igual.',
  ],
  chochoca: [
    'Pica {cebolla} y corta {res} y {papa} en trozos. Cuece la carne con la cebolla en agua hasta que empiece a ablandar.',
    'Agrega la papa. Aparte, humedece {maiz} con agua fría y deshaz los grumos antes de incorporarlo poco a poco al caldo.',
    'Cocina a fuego suave, removiendo el fondo hasta que el maíz esté cocido y el caldo haya espesado. Ajusta la consistencia con un poco de agua si hace falta.',
  ],
  'chupe-chuno': [
    'Remoja y enjuaga {chuno}. Corta {papa} en cubos y {queso} en dados pequeños.',
    'Cuece el chuño y la papa en agua hasta que estén tiernos. Aplasta una parte de la papa para espesar.',
    'Baja el fuego, incorpora {leche} y luego el queso. Calienta suavemente y sirve con una distribución pareja de papa, chuño y queso.',
  ],
  'chupe-viernes': [
    'Enjuaga {arroz}, corta {papa} y divide {pescado} en piezas parejas. Corta {queso} en cubos.',
    'Cuece el arroz y la papa en agua. Cuando estén casi tiernos, añade el pescado y cocina con hervor suave hasta que esté cocido.',
    'Baja el fuego y agrega {leche} y el queso. Mezcla con cuidado para mantener enteras las piezas de pescado y distribúyelas entre los platos.',
  ],
  'caldo-blanco': [
    'Cuece {cordero} con {cebolla} en agua, retirando la espuma del inicio. Mantén un hervor suave hasta que la carne ablande.',
    'Añade {arroz} enjuagado y {papa} cortada en trozos grandes. Cocina hasta que estén tiernos.',
    'Separa la carne en porciones y completa cada plato con papa, arroz y caldo caliente.',
  ],
  timpusca: [
    'Enjuaga {trigo}. Cocina {res} con agua y retira la espuma que suba al inicio.',
    'Agrega el trigo y mantén un hervor suave hasta que empiece a ablandar. Incorpora {papa} en trozos y, unos minutos después, {zapallo}.',
    'Cocina hasta que el trigo y la carne estén tiernos. Reparte el caldo y los sólidos en partes parejas.',
  ],
  'rocoto-pastel': [
    'Corta una tapa a los rocotos de {rocoto}. Retira semillas y venas con guantes. Blanquéalos en agua, cambiándola entre hervores, y escúrrelos.',
    'Cocina {res} picada con {cebolla} hasta que el relleno pierda el exceso de líquido. Rellena los rocotos y usa parte de {queso} para cubrirlos.',
    'Para el pastel, corta {papa} en láminas finas y ponlas en capas con el queso restante. Bate {huevo} con {leche} y vierte la mezcla sobre las capas.',
    'Hornea en fuentes separadas a 180 °C. Retira cada una al estar lista: rocotos tiernos y gratinados, y pastel con la papa suave y la mezcla cuajada. Corta el pastel en porciones.',
  ],
  'locro-pecho': [
    'Cuece {res} hasta que se pueda cortar fácilmente. Reserva la carne y su caldo.',
    'Sofríe {cebolla} con parte de {aceite} y añade {aji}. Incorpora {papa}, caldo suficiente y la carne troceada.',
    'Cuando la papa ablande, aplasta parte de ella para espesar. Cocina {arroz} aparte y reparte locro y arroz en porciones.',
  ],
  matasca: [
    'Corta {res} y {papa} en cubos. Pica {cebolla} y {tomate}.',
    'Dora la carne y cocina aparte la cebolla, el tomate y {aji} hasta que se forme un aderezo. Reúne todo y agrega agua suficiente para guisar.',
    'Cuando la carne esté casi tierna, incorpora la papa y cocina hasta que espese. Prepara {arroz} por separado y sirve como acompañamiento.',
  ],
  malaya: [
    'Cocina {res} en agua a fuego suave hasta que esté tierna. Escurre, deja que pierda el vapor y córtala en porciones.',
    'Hierve {papa} hasta que esté tierna y corta {cebolla} en tiras finas.',
    'Seca la superficie de la carne y dórala por tandas con {aceite}. Sirve con las papas y la cebolla.',
  ],
  hiro: [
    'Pica {cebolla} y corta {zapallo} y {papa} en cubos. Cocina la cebolla y agrega las verduras con un poco de agua.',
    'Tapa y cocina hasta que estén suaves. Aplasta una parte para dar cuerpo y añade {leche} y {queso} al final.',
    'Cocina {arroz} por separado. Reparte el hiro en porciones y sirve acompañado del arroz.',
  ],
  'lomo-saltado': [
    'Cocina {arroz} por separado. Corta {papa} en bastones, sécalos y fríelos con parte de {aceite}. Resérvalos escurridos.',
    'Corta {res} en tiras y {cebolla} y {tomate} en gajos. Calienta bien el wok o sartén.',
    'Sella la carne con el aceite restante en tandas pequeñas. Saltea brevemente la cebolla y el tomate, reincorpora la carne y agrega {sillao}.',
    'Sirve enseguida con el arroz y las papas para conservar la textura del salteado.',
  ],
  'aji-gallina': [
    'Cuece {pollo}, reserva parte del caldo y deshilacha la carne. Remoja {pan} en {leche} y tritura hasta obtener una mezcla lisa.',
    'Cocina {aji} a fuego suave con un poco del caldo. Agrega la mezcla de pan y remueve a fuego suave hasta que espese.',
    'Añade el pollo y ajusta la textura con el caldo reservado. Cocina {papa} y {arroz} aparte y cocina {huevo} en una tortilla fina para acompañar.',
    'Sirve la crema sobre la papa, con arroz y tiras de tortilla. Distribuye el pollo de forma pareja entre las porciones.',
  ],
  'tallarines-rojos': [
    'Pica {cebolla}, {tomate} y {zanahoria}. Separa {pollo} en piezas parejas.',
    'Dora el pollo con parte de {aceite}. Retíralo y cocina las verduras con el resto del aceite hasta formar una salsa.',
    'Devuelve el pollo a la salsa y cocina tapado hasta que esté completamente cocido. Hierve {pasta} según el envase y escúrrela.',
    'Mezcla la pasta con la salsa o sírvela encima. Reparte las piezas de pollo entre las porciones.',
  ],
  chaufa: [
    'Cocina {arroz} y deja que pierda el vapor antes de saltearlo. Pica {cebollaChina} y corta {pollo} en cubos pequeños.',
    'Con parte de {aceite}, cocina {huevo} batido en una tortilla fina. Córtala en tiras y reserva.',
    'Saltea el pollo por tandas con el resto del aceite hasta que esté bien cocido. Agrega el arroz, {sillao} y el huevo, y mezcla a fuego alto.',
    'Incorpora la cebolla china al final y sirve porciones parejas.',
  ],
  lentejas: [
    'Enjuaga {lenteja} y cuécela en agua hasta que esté tierna. Cocina {arroz} por separado.',
    'Pica {cebolla} y {zanahoria}, sofríelas en {aceite} e incorpóralas a las lentejas. Cocina unos minutos para integrar el aderezo.',
    'Prepara una tortilla con {huevo} y repártela con las lentejas y el arroz en cada porción.',
  ],
  'pescado-frito': [
    'Cocina {arroz}. Lava y corta {repollo} y {tomate} para la ensalada y resérvalos aparte.',
    'Divide {pescado} en piezas del mismo grosor y seca la superficie. Calienta {aceite} y fríe por tandas hasta que el pescado esté cocido y dorado.',
    'Escurre cada pieza y sírvela con una porción de arroz y ensalada.',
  ],
  'pollo-plancha': [
    'Divide {pollo} en piezas de grosor parejo. Corta {papa} y {zanahoria} y cuécelas hasta que estén tiernas.',
    'Cocina {arroz} aparte. Unta la plancha con {aceite} y cocina el pollo en tandas, dorando ambos lados y comprobando que el centro esté completamente cocido.',
    'Deja reposar brevemente y reparte pollo, papas, zanahoria y arroz entre las porciones.',
  ],
  'chicha-morada': [
    'Enjuaga {maiz-morado} y corta {pina} en trozos. Cuécelos en {agua} a hervor suave hasta que el líquido adquiera color intenso.',
    'Cuela y disuelve {azucar} en el líquido todavía tibio. Deja enfriar y añade el jugo extraído de {limon}.',
    'Refrigera, mide el volumen final y distribúyelo en los vasos indicados por el rendimiento del lote.',
  ],
  'refresco-cebada': [
    'Hierve {cebada} en {agua} a fuego moderado hasta obtener una infusión de sabor tostado. Cuela con un colador fino.',
    'Disuelve {azucar} mientras la infusión está tibia. Deja enfriar y añade el jugo de {limon}.',
    'Refrigera y reparte el volumen final en los vasos del lote.',
  ],
  maracuya: [
    'Mezcla {maracuya} con una parte de {agua}. Remueve para separar la pulpa de las semillas y cuela.',
    'Disuelve {azucar} en el resto del agua y mezcla con la pulpa colada. Prueba y mezcla nuevamente antes de enfriar.',
    'Refrigera y reparte el volumen final en los vasos del lote.',
  ],
  limonada: [
    'Lava y exprime {limon}. Cuela el jugo para retirar las semillas.',
    'Disuelve {azucar} en {agua}, añade el jugo y mezcla. Refrigera hasta que esté fría.',
    'Remueve antes de servir y reparte en los vasos del lote.',
  ],
};

export function formatRecipeAmount(quantity, unit, format) {
  if (quantity < 1 && unit === 'kg') return format(quantity * 1000) + ' g';
  if (quantity < 1 && unit === 'L') return format(quantity * 1000) + ' ml';
  return format(quantity) + ' ' + unit;
}

export function recipeSteps(recipe, inventory, format) {
  const templates = stepsByRecipe[recipe.id] ?? [];
  const ids = new Set(templates.flatMap(step => [...step.matchAll(/\{([^}]+)\}/g)].map(match => match[1])));
  if ([...ids].some(id => !(recipe.items[id] > 0) || !inventory.some(item => item.id === id))) return [];
  return templates.map(step => step.replace(/\{([^}]+)\}/g, (_, id) => {
    const item = inventory.find(ingredient => ingredient.id === id);
    return formatRecipeAmount(recipe.items[id], item.unit, format) + ' de ' + item.name.toLocaleLowerCase('es-PE');
  }));
}


