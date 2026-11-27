# Tipografía y tema visual

La referencia indicada para esta propuesta fue https://millionhair.vercel.app/. Se tomó su jerarquía de encabezados, contraste y uso de Archivo; la aplicación conserva su recorrido de planificación y sus formularios. La identidad visual usa sillar cálido, grafito y terracota para diferenciarla de la referencia.

## Archivos

- `frontend/src/styles/fonts.css`: declaración de las fuentes locales.
- `frontend/src/styles/base.css`: estructura general, campos, botones y tablas.
- `frontend/src/styles/workspace.css`: estructura de las pantallas y ayudas de llenado.
- `frontend/src/styles/theme.css`: paleta, tipografía, marca y ajustes visuales por tamaño de pantalla.
- `frontend/src/styles/home.css`: imagen principal, ilustraciones y secciones de Inicio.
- `frontend/src/styles/operations.css`: resúmenes, filtros y tarjetas de las pantallas de trabajo.
- `frontend/src/styles/navigation.css`: cabecera superior, navegación móvil y composición de la landing.
- `frontend/public/fonts/`: fuentes WOFF2, créditos y licencias SIL OFL.

Los estilos se cargan en ese orden. El tema adapta la presentación de los componentes sin modificar sus cálculos ni las solicitudes a la API.

## Fuentes

La interfaz usa Optik neutral de `@shieldfont/font` 0.3.4, la tipografía de SHIELD(FONT). El archivo `optik-n` conserva el texto original: no se activa el codificador ni la sustitución de palabras. Sus archivos se sirven desde el paquete mediante Vite, sin depender de un CDN durante el uso. Optik pertenece a Playtype y se distribuye dentro de ShieldFont según el permiso descrito en el NOTICE del paquete; no se trata de una fuente SIL OFL. Incluye caracteres españoles; el corte neutral es regular y el navegador sintetiza los pesos superiores. Archivo queda como respaldo y continúa en los PDF; el logo aprobado permanece igual.

## Animaciones

`frontend/src/hooks/usePageMotion.js` observa la entrada de secciones y tarjetas al área visible, también al cargar contenido. Cada elemento aparece una vez por visita a la sección. `frontend/src/styles/motion.css` controla las entradas, el movimiento de ilustraciones al interactuar, los diálogos y el menú móvil. No agrega librerías de animación ni modifica los cálculos. La preferencia `prefers-reduced-motion` desactiva los efectos y el desplazamiento suave, incluso si se cambia con la página abierta. Los elementos con foco permanecen visibles.

## Colores principales

| Variable | Valor | Uso |
|---|---|---|
| `--sidebar` | `#1b2426` | Navegación en grafito |
| `--background` | `#ede3d4` | Fondo arena inspirado en el sillar |
| `--surface` | `#fffaf2` | Paneles y formularios en crema claro |
| `--text` | `#20292a` | Títulos y texto principal |
| `--muted` | `#655e54` | Ayudas y texto secundario |
| `--accent` | `#b5402d` | Acciones y paso activo |
| `--success` | `#27604a` | Confirmaciones y cierres |

Las advertencias y confirmaciones conservan sus mensajes escritos; el significado no depende únicamente del color. La navegación móvil muestra las cuatro secciones y las tablas largas se desplazan dentro de su contenedor.

## Reportes PDF

`backend/app/services/pdf_reports.py` presenta planes y resultados con la misma identidad: marca de plato y cubiertos, cabecera grafito, acentos terracota, títulos en Archivo 800 y paneles de cifras. Las tablas repiten sus encabezados al cambiar de página y el pie indica fecha de generación y número de página.

Las fuentes estáticas y sus licencias están en `backend/app/assets/fonts/`. Se incrustan en el documento para conservar el aspecto en otras computadoras. El logo aprobado está en `backend/app/assets/brand/`, sobre un panel blanco para que su texto grafito contraste con la cabecera oscura. La generación usa ReportLab y los datos ya calculados por los servicios; el cambio visual no modifica importes, inventario ni ventas.

## Inicio y recursos gráficos

La primera pantalla es Inicio, implementada en `frontend/src/features/home/Home.jsx`, con estilos en home.css y navigation.css. La fotografía de presentación y las cuatro ilustraciones se encuentran en `frontend/public/images/`. Se conservan los originales PNG y se sirven versiones WebP más ligeras; las ilustraciones cargan al acercarse al área visible.

`frontend/src/components/SiteHeader.jsx` reemplaza la barra lateral por una cabecera superior. En Inicio ofrece enlaces a las secciones y acceso al planificador; en las pantallas de trabajo presenta Inicio y las cuatro áreas operativas. En celular y tablet el menú se despliega con un botón accesible y se cierra al navegar, pulsar Escape o tocar fuera. Los enlaces de sección dejan espacio para la cabecera fija.

La landing incluye beneficios concretos, el recorrido ilustrado, consejos y preguntas frecuentes basadas en el comportamiento de la aplicación. El pie enlaza las secciones y el repositorio real del proyecto. No se añadieron cuentas sociales ni datos de contacto ficticios.

El recorrido Planifica, Compra, Prepara y Cierra dirige a las pantallas existentes. La sección de consejos explica cuándo registrar cada dato. La imagen principal es una escena de presentación inspirada en referencias de Arequipa; no representa un local asociado al proyecto.

El logo aprobado se utiliza desde `frontend/public/brand/menu-rentable-logo-v1.png`. El icono de pestaña es una adaptación vectorial del símbolo en `frontend/public/brand/favicon.svg`. Los cambios gráficos se revisaron en escritorio, móvil y PDF.

## Secciones de operación

`frontend/src/styles/operations.css` adapta las secciones a la identidad de Inicio. `SectionIntro.jsx` reutiliza las ilustraciones como orientación breve. El planificador conserva un resumen del menú y los datos ingresados durante los pasos; en celular queda dentro del flujo para no tapar los campos.

Mis planes permite filtrar por estado, nombre y fechas. Las tarjetas muestran acciones acordes al estado; el cierre de fechas futuras se deshabilita como ayuda visual, y el backend mantiene su validación definitiva.

Mi cocina filtra recetas por categoría e ingredientes por información pendiente. La API devuelve cantidad de ingredientes y si la receta está completa; este indicador no garantiza existencias. Compras y resultados muestra una confirmación del movimiento guardado y una pestaña Historial con búsqueda, tipo de movimiento y carga de más filas. Los indicadores económicos y de producción siguen utilizando los resultados de Python.


El fondo general y la cabecera usan tonos arena y crema. La sección de beneficios contrasta con un bloque grafito y tarjetas oscuras; los formularios y las tablas mantienen superficies claras. Las confirmaciones y advertencias conservan sus colores semánticos.


Los recuadros destacados usan tokens --card-background, --card-text, --card-muted, --card-line y --card-accent de theme.css. cards.css se carga al final y aplica grafito a las tarjetas de Inicio, preguntas frecuentes, planes, recetas y resúmenes. Los formularios y las tablas permanecen claros para distinguir la entrada de datos de los resúmenes.


La cabecera superior usa grafito con la marca sobre una base crema. Los enlaces emplean texto claro y una pastilla terracota señala la página activa. El desplegable móvil mantiene esos mismos colores y los controles de foco tienen un contorno claro visible.


## Contacto y pie de página

SiteFooter.jsx y footer.css presentan la marca, accesos al sistema, enlaces de ayuda y WhatsApp al +51 934 416 482, proporcionado por el responsable del proyecto. Reclamos y sugerencias abre un diálogo accesible que prepara un mensaje de WhatsApp. El usuario debe revisarlo y enviarlo: no existe envío automático, registro en la base ni generación de constancia. Se identifica como canal de atención del proyecto académico, no como Libro de Reclamaciones oficial.


El pie de página está fuera del contenedor central y ocupa todo el ancho. footer-inner conserva el contenido alineado con la landing o el espacio de trabajo. buttons.css unifica las acciones principales y secundarias con contornos redondeados, relieve sutil y estados de interacción; respeta la preferencia de movimiento reducido.
