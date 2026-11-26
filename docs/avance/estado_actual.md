# Estado del proyecto — 26 de noviembre de 2026

## Implementado

Backend organizado por clases de cálculo, persistencia y conectores. Planificación de menú con precio único; recetas, despensa y precios; histórico de planes; compras y mermas; cierre de ventas con consumo de inventario transaccional; cancelación de planes pendientes; sugerencia desde cierres anteriores; reporte de resultados por fechas y CSV generado en Python. Interfaz actual conectada a esas operaciones. Edición de nombre, precio y recetas del menú sin reescribir planes históricos; PDF de resultados por fechas y PDF del plan con lista de compras. Prototipo anterior y API legada retirados.

Fuentes: MIDAGRI (precio de pollo vivo), Plaza Vea (producto y precio online de arroz) y ADRA (indicadores históricos de rescate de alimentos en Arequipa). Las tres se comprobaron contra sus sitios y guardaron registros reales. Las fuentes no reemplazan el inventario ni garantizan cobertura comercial.

## Validación

Pruebas unitarias y de integración en una base separada, incluyendo rollback ante falta de stock, protección contra cierre repetido, costos promedio, reportes, pronóstico sin datos futuros y conservación de referencias ante fallos. Compilación de frontend y comprobación de navegación de escritorio y móvil. Resultado final: 32 pruebas aprobadas en PostgreSQL aislado, compilación Vite aprobada y recorrido real de compra → cierre → reporte aprobado desde el navegador contra una base de pruebas. Se comprobó doble cierre concurrente: solo uno aplica el consumo. También se probaron edición de menús, validaciones sin cambios parciales, conservación de precios y recetas históricos, PDF sin cierres, PDF con múltiples páginas y descargas desde el navegador. Los conteos de recetas, ingredientes, inventario y planes del negocio coinciden con el respaldo previo; no se registraron ventas ficticias en el negocio.

## Límites

Aplicación local para un negocio, sin login. Un plan por fecha; cancelación sin reescritura del historial. Consumo calculado por receta histórica y producción declarada. Margen de cierres con ingredientes y gastos declarados, sin sumar automáticamente mermas de ingredientes. Reporte CSV y PDF generados en Python con ReportLab. Promedio histórico simple, no predicción de demanda no atendida. Referencias externas sujetas a formato y disponibilidad; MIDAGRI usa colección anual 2026.

## Para sustentar

Usar docs/architecture/defensa_backend.md para localizar clase, método y fórmula. Los documentos PDF y Word de cortes anteriores no reflejan todavía esta reorganización.

## Claridad de formularios

Compras, pérdidas y resultados se presentan por separado. Los formularios explican qué llenar y con qué unidad. Compras recibe cantidad y total pagado; el precio unitario se calcula en Python. El cierre tiene revisión previa sin escritura y confirma después, con faltantes por ingrediente y revalidación del stock. Se añadieron ejemplos de recetas, conteos, planificación y gastos para evitar sumar dos veces una compra o descontar como pérdida lo que ya se consumió al cerrar. La navegación móvil muestra los cuatro destinos completos.

## Organización y limpieza

Servicios de cálculo y exportadores separados en archivos por responsabilidad. Conectores privados y ONG separados; descarga y excepción de lectura compartidas. Pantallas agrupadas en features/planning, features/kitchen y features/operations. Se retiraron 207 selectores CSS sin uso, imports sobrantes y carpetas del prototipo; las guías antiguas y archivos de pruebas se archivaron fuera del repositorio activo. No quedaron módulos JavaScript huérfanos ni enlaces Markdown locales rotos. La instalación desde migraciones y la carga repetida del catálogo inicial se comprobaron en una base de pruebas: 32 ingredientes, 26 recetas y cuatro migraciones. Las capturas comparadas de escritorio y móvil conservaron exactamente la apariencia en las vistas revisadas.
