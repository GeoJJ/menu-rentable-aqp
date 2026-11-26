# Mapa del backend para la sustentación

Corte del código: 26 de noviembre de 2026. La interfaz presenta datos; las reglas de negocio están en Python. Las clases de cálculo no dependen de PostgreSQL ni de React. Los repositorios ejecutan SQL y coordinan las transacciones. Los modelos Pydantic validan las entradas antes de ejecutar una operación.

## ¿En qué clase se hace cada operación?

Todos los archivos de la tabla están dentro de `backend/app/`.

| Pregunta del profesor | Clase y método | Archivo |
|---|---|---|
| ¿Dónde se calculan los ingredientes, faltantes, compras e ingresos estimados? | `MenuPlanningCalculator.compute()` | `services/menu_planning.py` |
| ¿Dónde se convierte el total pagado a precio unitario? | `InventoryCalculator.unit_price()` | `services/inventory.py` |
| ¿Dónde se revisa el cierre sin guardar? | `OperationsRepository.preview_closing()` | `repositories/operations.py` |
| ¿Dónde se calcula el costo promedio de una compra? | `InventoryCalculator.purchase()` | `services/inventory.py` |
| ¿Dónde se evita descontar más de lo disponible? | `InventoryCalculator.consume()` | `services/inventory.py` |
| ¿Dónde se escala el consumo según lo realmente preparado? | `DayClosingCalculator.required()` | `services/day_closing.py` |
| ¿Dónde se calculan sobrantes, ingreso y margen real? | `DayClosingCalculator.totals()` | `services/day_closing.py` |
| ¿Dónde se sugiere la cantidad de menús? | `DemandForecaster.forecast()` | `services/demand_forecast.py` |
| ¿Dónde se totaliza el reporte? | `ReportCalculator.summarize()` | `services/reports.py` |
| ¿Dónde se guardan recetas e ingredientes? | `CatalogRepository.save_recipe()` | `repositories/catalog.py` |
| ¿Dónde se edita un menú sin modificar planes anteriores? | `MenuRepository.update_menu()` | `repositories/menus.py` |
| ¿Dónde se genera el reporte PDF? | `ReportPDFExporter.plan()` y `results()` | `services/pdf_reports.py` |
| ¿Dónde se genera el CSV de resultados? | `ReportCSVExporter.results()` | `services/csv_reports.py` |
| ¿Dónde se guarda la oferta con precio único? | `MenuRepository.create_menu()` | `repositories/menus.py` |
| ¿Dónde se guarda el plan histórico? | `MenuPlanRepository.save_menu_plan()` | `repositories/menu_plans.py` |
| ¿Dónde se edita un plan pendiente y se conserva su versión anterior? | `MenuPlanRepository.update_menu_plan()` y `revisions()` | `repositories/menu_plans.py` |
| ¿Dónde se registra una compra o merma? | `OperationsRepository.movement()` | `repositories/operations.py` |
| ¿Dónde se guarda el cierre y descuenta el inventario una sola vez? | `OperationsRepository.close()` | `repositories/operations.py` |
| ¿Dónde se cancela un plan sin borrar su historial? | `OperationsRepository.cancel()` | `repositories/operations.py` |
| ¿Dónde se conecta PostgreSQL? | `Database.connect()` | `db/connection.py` |
| ¿Dónde se lee el PDF de MIDAGRI? | `MidagriConnector.retrieve()` y `parse_arequipa()` | `integrations/sources/midagri.py` |
| ¿Dónde se recupera el producto de Plaza Vea? | `PlazaVeaConnector.retrieve()` y `parse()` | `integrations/sources/plazavea.py` |
| ¿Dónde se recuperan los indicadores de ADRA? | `AdraConnector.retrieve()` y `parse()` | `integrations/sources/adra.py` |
| ¿Dónde se controla la frecuencia de consulta? | `SourceRefreshService.refresh()` | `services/source_refresh.py` |
| ¿Dónde se guardan fuente, intentos y procedencia? | `SourceRepository.success()` | `repositories/sources.py` |

## Recorrido de una petición

1. React envía JSON a un endpoint de `api/routes/`.
2. Pydantic construye un modelo de `schemas/` y rechaza datos inválidos.
3. El endpoint llama a una clase de repositorio o de servicio.
4. La clase de cálculo aplica las fórmulas con `Decimal`; el repositorio lee o escribe PostgreSQL.
5. FastAPI devuelve JSON. El navegador lo muestra y da formato, sin volver a calcular los resultados del negocio.

`database_call()` en `api/errors.py` es una función auxiliar que traduce errores a HTTP. No necesita ser una clase: no representa una entidad ni tiene fórmulas. Los endpoints también son funciones pequeñas, como es habitual en FastAPI.

## Fórmulas que debes poder explicar

### Planificación

- Necesario = cantidad de la receta × menús × porciones por menú / rendimiento base.
- Si varias recetas usan un ingrediente, primero se suman sus necesidades por identificador.
- Faltante = máximo entre cero y necesario − existencia indicada.
- Unidades a comprar = redondeo del faltante hacia arriba. La presentación actual es de 1 kg, 1 L o 1 unidad.
- Compra estimada = unidades a comprar × precio por unidad.
- Costo consumido = existencia utilizada × costo anterior + faltante × precio actual.
- Ingreso estimado = cantidad de menús × precio único del menú.
- Margen estimado = ingreso estimado − costo de ingredientes.

La compra y el costo consumido no son iguales: una compra puede dejar ingredientes para otro día. La planificación no confirma que se compró ni que se cocinó.

### Compras y cierre real

El usuario puede ingresar cantidad recibida y total pagado. Python calcula precio unitario = total / cantidad, con hasta ocho decimales. La API conserva la alternativa de precio unitario por compatibilidad, pero no acepta ambos importes a la vez. La vista previa del cierre reutiliza los mismos datos y fórmulas que el guardado; no crea movimientos ni ventas. La confirmación vuelve a comprobar existencias dentro de una transacción.

- Costo promedio = (existencia anterior × costo anterior + compra × precio de compra) / nueva existencia.
- Consumo real = necesario del plan × preparados reales / menús planificados.
- Sobrantes de menús = preparados − vendidos.
- Ingreso real = vendidos × precio real del menú.
- Margen real = ingreso real − costo de ingredientes preparados − gastos adicionales declarados.

Ejemplo de prueba: existencia de 1 kg a S/2; compra de 3 kg a S/4. Hay 4 kg a costo promedio S/3.50. Si se usan 3 kg, el costo es S/10.50 y queda 1 kg. Con 10 menús preparados, 8 vendidos a S/12 y S/5 de otros gastos: ingreso S/96, sobrantes 2 y margen S/80.50.

Los ingredientes se consumen por los menús preparados, incluidos los no vendidos. Los sobrantes de comida no se convierten nuevamente en ingredientes crudos. La merma de un ingrediente se registra por separado como movimiento de inventario.

## Transacciones y protección de datos

- El cierre bloquea el plan y las existencias, valida disponibilidad y guarda cierre, consumo y estado en una transacción.
- Un error revierte todo: no queda medio cierre ni un descuento parcial.
- Un cierre repetido se rechaza: no se descuenta dos veces.
- Un plan cerrado no se cancela; cancelar solo afecta planes pendientes y no elimina datos.
- Guardar un nuevo plan no reemplaza las existencias reales ya registradas. Si un ingrediente nunca tuvo inventario, se inicializa con la existencia declarada; cambios posteriores se hacen en la despensa o mediante movimientos.
- El plan conserva nombres, cantidades y precios históricos, aunque cambie el catálogo después.
- Editar un plan pendiente vuelve a llamar a `MenuPlanningCalculator.compute()` con las recetas y el precio actuales del menú seleccionado. La comparación permite revisar esos cambios antes de confirmar.
- `MenuPlanUpdate` exige versión y motivo. `update_menu_plan()` bloquea la cabecera, valida estado, fecha disponible y presupuesto, guarda la captura completa anterior en `plan_revisiones` y sustituye los detalles en una sola transacción. Mantiene el identificador y aumenta `planes_diarios.version`.
- La edición no cambia inventario ni registra compras o ventas. Si la edición falla, también se revierte la inserción del historial. Dos ediciones de la misma versión no se sobrescriben: la segunda debe volver a abrir el plan.
- El cierre también comprueba la versión revisada. Un cierre preparado antes de una edición no puede consumir ingredientes hasta revisar el plan vigente.
- Las compras y mermas quedan en `movimientos_inventario`; los ajustes manuales de la despensa también dejan movimiento cuando cambia la cantidad.
- Las consultas SQL reciben parámetros; las contraseñas provienen de `.env`, nunca de React.

## Pronóstico y fuentes externas

El pronóstico usa hasta ocho cierres anteriores del mismo día de semana; si no hay, usa hasta ocho cierres anteriores disponibles. No usa datos futuros ni demostraciones. Sin cierres no inventa una sugerencia. Si se vendió todo, avisa que podría haber demanda no atendida. Es un promedio histórico, no un modelo de inteligencia artificial.

MIDAGRI recupera una referencia de pollo vivo mayorista de Arequipa, que no equivale al pollo eviscerado de las recetas. Plaza Vea consulta un catálogo público de arroz y obtiene presentación, precio observado y precio por kg; no confirma cobertura de entrega en Arequipa ni condiciones promocionales. ADRA extrae indicadores históricos de rescate de alimentos de una publicación específica sobre 2025; no es disponibilidad de donaciones en tiempo real. Ninguno modifica automáticamente el inventario.

Las lecturas conservan enlace y fechas. Hay caché de seis horas y al menos un minuto entre intentos por fuente. Un error conserva la última lectura correcta. La colección de MIDAGRI está configurada para 2026 y debe actualizarse cuando cambie el año o el formato.

## Demostración sin confundir planes con ventas

1. Mostrar una receta y señalar `CatalogRepository.save_recipe()`.
2. Calcular un plan y abrir `MenuPlanningCalculator.compute()`.
3. Guardar el plan y explicar sus capturas históricas. Antes del cierre, abrir Editar plan pendiente, cambiar cantidad, revisar la comparación y guardar con motivo. Mostrar la versión anterior en Historial del plan y localizar `update_menu_plan()`.
4. Registrar compras reales en Compras y resultados.
5. En Mis planes, abrir el plan y completar su cierre. Confirmar los movimientos y el saldo.
6. Consultar resultados por fechas y descargar CSV o PDF generados en Python. Desde Mis planes también se descarga el plan y su lista de compras en PDF.
7. En el primer paso de planificación, elegir un menú y pulsar Editar este menú. Mostrar `MenuRepository.update_menu()` y comprobar que un plan anterior conserva su nombre, precio y recetas originales.
8. Consultar la sugerencia histórica al planificar el siguiente día.
9. Consultar las tres fuentes y comprobar sus enlaces y fechas.

Para una demostración que escriba compras o ventas ficticias, usar una base de demostración separada. Las pruebas automáticas usan `menu_rentable_backend_test` con esquemas temporales, no los registros del negocio.

## Alcance y límites

Aplicación local para un negocio, sin autenticación ni separación de usuarios. Un plan por fecha; los pendientes pueden editarse con historial o cancelarse. Los cerrados y cancelados conservan sus datos sin edición; la corrección de cierres todavía no está implementada. El consumo real se estima con las cantidades de la receta congeladas en la versión vigente del plan, no por pesaje de cada ingrediente utilizado. El margen incluye solo los costos y gastos declarados; no debe presentarse como utilidad contable neta. Las mermas de ingredientes se auditan en inventario, pero no se agregan automáticamente al margen del reporte de cierres. Se exportan CSV y PDF desde Python; los PDF se construyen con ReportLab. El prototipo y su API antigua fueron retirados; las tablas históricas existentes no se borraron.

Este mapa es la documentación vigente. Las guías de cortes anteriores se retiraron del repositorio activo para evitar referencias a archivos eliminados.

## Archivos que parecen vacíos, pero sí se necesitan

Los `__init__.py` identifican los paquetes de Python y explican su función con una descripción breve. Los modelos Pydantic pueden no tener métodos: sus campos y restricciones son la validación que ejecuta FastAPI. `SourceError` es una excepción específica usada para reconocer fallos de lectura de fuentes y conservar la última referencia válida. Ninguno de estos casos es una clase de negocio abandonada.
