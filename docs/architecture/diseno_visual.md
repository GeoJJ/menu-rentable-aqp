# Tipografía y tema visual

La referencia indicada para esta propuesta fue https://millionhair.vercel.app/. Se tomó su jerarquía de encabezados, contraste y uso de Archivo; la aplicación conserva su recorrido de planificación y sus formularios. La identidad visual usa grafito, blanco cálido y terracota para diferenciarla de la referencia.

## Archivos

- `frontend/src/styles/fonts.css`: declaración de las fuentes locales.
- `frontend/src/styles/base.css`: estructura general, campos, botones y tablas.
- `frontend/src/styles/workspace.css`: estructura de las pantallas y ayudas de llenado.
- `frontend/src/styles/theme.css`: paleta, tipografía, marca y ajustes visuales por tamaño de pantalla.
- `frontend/public/fonts/`: fuentes WOFF2, créditos y licencias SIL OFL.

Los estilos se cargan en ese orden. El tema adapta la presentación de los componentes sin modificar sus cálculos ni las solicitudes a la API.

## Fuentes

Archivo Variable se usa en títulos, contenido y cifras. Los encabezados principales tienen peso 800 y mayúsculas; los campos conservan texto normal para facilitar la lectura. Michroma se reserva para la marca. Los archivos incluyen los caracteres latinos necesarios para español y se sirven desde la propia aplicación, sin consultas a Google Fonts al abrirla.

## Colores principales

| Variable | Valor | Uso |
|---|---|---|
| `--sidebar` | `#1b2426` | Navegación en grafito |
| `--background` | `#f3f4f0` | Fondo de la aplicación |
| `--surface` | `#ffffff` | Paneles y formularios |
| `--text` | `#20292a` | Títulos y texto principal |
| `--muted` | `#596365` | Ayudas y texto secundario |
| `--accent` | `#b5402d` | Acciones y paso activo |
| `--success` | `#27604a` | Confirmaciones y cierres |

Las advertencias y confirmaciones conservan sus mensajes escritos; el significado no depende únicamente del color. La navegación móvil muestra las cuatro secciones y las tablas largas se desplazan dentro de su contenedor.

## Reportes PDF

`backend/app/services/pdf_reports.py` presenta planes y resultados con la misma identidad: marca de plato y cubiertos, cabecera grafito, acentos terracota, títulos en Archivo 800 y paneles de cifras. Las tablas repiten sus encabezados al cambiar de página y el pie indica fecha de generación y número de página.

Las fuentes estáticas y sus licencias están en `backend/app/assets/fonts/`. Se incrustan en el documento para conservar el aspecto en otras computadoras. La generación usa ReportLab y los datos ya calculados por los servicios; el cambio visual no modifica importes, inventario ni ventas.
