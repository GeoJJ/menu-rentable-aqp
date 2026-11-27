# Estado del proyecto — 26 de noviembre de 2026

## Implementado

Backend organizado por clases de cálculo, persistencia y conectores. Planificación de menú con precio único; recetas, despensa y precios; histórico de planes; compras y mermas; cierre de ventas con consumo de inventario transaccional; cancelación de planes pendientes; sugerencia desde cierres anteriores; reporte de resultados por fechas y CSV generado en Python. Interfaz actual conectada a esas operaciones. Edición de nombre, precio y recetas del menú sin reescribir planes históricos; PDF de resultados por fechas y PDF del plan con lista de compras. Edición de planes pendientes con comparación, motivo e historial de versiones. Prototipo anterior y API legada retirados.

Fuentes: MIDAGRI (precio de pollo vivo), Plaza Vea (producto y precio online de arroz) y ADRA (indicadores históricos de rescate de alimentos en Arequipa). Las tres se comprobaron contra sus sitios y guardaron registros reales. Las fuentes no reemplazan el inventario ni garantizan cobertura comercial.

## Validación

Pruebas unitarias y de integración en una base separada, incluyendo rollback ante falta de stock, protección contra cierre repetido, costos promedio, reportes, pronóstico sin datos futuros y conservación de referencias ante fallos. Resultado final: 40 pruebas aprobadas en PostgreSQL aislado. La ampliación de edición prueba fecha ocupada, presupuesto insuficiente, estado cerrado o cancelado, rollback después de sustituir detalles, historial completo, versiones obsoletas y dos ediciones concurrentes. Un cierre revisado antes de una edición se rechaza sin consumo. También se comprobó en navegador: cancelar edición, cambiar menú, fecha, cantidad e insumos, exigir motivo, comparar, guardar, consultar historial, descargar PDF con versión, recargar y cerrar usando el nuevo plan. La vista móvil no desborda la página. Todas las compras y ventas de pruebas usan bases separadas del negocio.

## Límites

Aplicación local para un negocio, sin login. Un plan por fecha; edición solo mientras esté pendiente, con versión anterior conservada. Corrección de cierres todavía pendiente. Consumo calculado por receta histórica y producción declarada. Margen de cierres con ingredientes y gastos declarados, sin sumar automáticamente mermas de ingredientes. Reporte CSV y PDF generados en Python con ReportLab. Promedio histórico simple, no predicción de demanda no atendida. Referencias externas sujetas a formato y disponibilidad; MIDAGRI usa colección anual 2026.

## Para sustentar

Usar docs/architecture/defensa_backend.md para localizar clase, método y fórmula. Los documentos PDF y Word de cortes anteriores no reflejan todavía esta reorganización.

## Claridad de formularios

Compras, pérdidas y resultados se presentan por separado. Los formularios explican qué llenar y con qué unidad. Compras recibe cantidad y total pagado; el precio unitario se calcula en Python. El cierre tiene revisión previa sin escritura y confirma después, con faltantes por ingrediente y revalidación del stock. Se añadieron ejemplos de recetas, conteos, planificación y gastos para evitar sumar dos veces una compra o descontar como pérdida lo que ya se consumió al cerrar. La navegación móvil muestra los cuatro destinos completos.

## Organización y limpieza

Servicios de cálculo y exportadores separados en archivos por responsabilidad. Conectores privados y ONG separados; descarga y excepción de lectura compartidas. Pantallas agrupadas en features/planning, features/kitchen y features/operations. Se retiraron 207 selectores CSS sin uso, imports sobrantes y carpetas del prototipo; las guías antiguas y archivos de pruebas se archivaron fuera del repositorio activo. La edición reutiliza CompleteMenuPlanner y MenuPlanningCalculator; PlanRevisionHistory presenta las versiones anteriores. Hay cinco migraciones; la quinta agrega el historial sin alterar los datos de planes existentes.


## Mejoras de uso

Planificador con resumen del menú durante los pasos; planes con filtros por estado, nombre y fecha; recetas con estado de integridad devuelto por Python; despensa con filtros de existencias o precios pendientes; confirmación detallada de compras y pérdidas, e historial visible con filtros y paginación. Se comprobaron estos recorridos en escritorio y móvil sin errores de consola. La prueba de integridad de recetas distingue ausencia de ingredientes, ingredientes inactivos y falta de inventario. El recorrido de compra, cierre y PDF se volvió a comprobar en PostgreSQL aislado.
