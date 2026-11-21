# Corte técnico del avance del 20 de noviembre de 2026

## Funcionamiento disponible

- Mi cocina: crear, editar y archivar recetas, agregar ingredientes y guardar existencias y precios de compra con proveedor y ubicación.
- Preparar mi plan: elegir o crear un menú de caldo, segundo y refresco con precio único; ingresar cantidad, presupuesto e insumos; revisar compras y guardar.
- Mis planes: consultar el detalle histórico y descargar resumen y compras en CSV.
- Referencias externas: consulta automática de MIDAGRI al abrir la sección; extracción de pollo vivo mayorista de Arequipa del boletín PDF; fechas y enlace verificable; preservación ante errores.

## Verificación ejecutada

18 pruebas de backend aprobadas con PostgreSQL en esquemas temporales; compilación Vite aprobada; revisión del recorrido en Chrome de escritorio y móvil, sin errores de JavaScript ni desbordamiento horizontal en las vistas revisadas. La navegación posterior al guardado se comprobó en el navegador con respuesta simulada para no crear planes de prueba en el negocio; el guardado real se comprobó en las pruebas de integración. Además se verificó que el plan real permanece en PostgreSQL.

La recuperación real de MIDAGRI se comprobó contra su web y PDF: boletín del 20 de noviembre, precio de pollo vivo del 19 de noviembre. El valor mostrado en esta lectura fue S/6.66 por kg; una nueva consulta puede devolver otro valor o documento. No es un precio de pollo eviscerado ni una oferta garantizada del proveedor.

## Límites actuales

La cantidad esperada la ingresa el usuario y se supone que venderá todos esos menús. El margen solo descuenta ingredientes. Las compras se redondean a kg, L o unidades completos. Guardar un plan no descuenta inventario; los datos de existencias declarados se guardan. Existe un plan por fecha y aún no se edita desde la interfaz.

Pendientes: fuentes privadas y ONG, cierre diario y ventas reales, sobrantes reales, pronóstico desde historial y reportes de resultados. No hay autenticación, gestión de varios negocios, facturación ni JasperReports. El componente legado no se carga en la navegación nueva y no debe utilizarse como evidencia de funciones nuevas terminadas.

## Presentación del avance

1. Abrir una receta y mostrar sus ingredientes y rendimiento.
2. Mostrar una existencia y cotización guardadas.
3. Crear o elegir un menú completo y recorrer sus cuatro pasos.
4. Consultar un plan ya guardado y descargar CSV.
5. Abrir Mi cocina y Referencias externas; mostrar las tres fechas y el PDF de MIDAGRI.
6. Explicar la persistencia y las limitaciones, especialmente que solo hay una fuente estatal integrada.

## Instalación y base de datos

Seguir docs/instalacion/windows.md. Para una instalación limpia usar migraciones y catálogo. Para reproducir exactamente el avance con datos, restaurar el respaldo SQL en una base nueva y configurar esa conexión. No mezclar ambos procedimientos sobre la misma base sin revisar primero su estado.

Este archivo es una guía técnica del corte; no reemplaza el informe académico ni sus diagramas y anexos.
