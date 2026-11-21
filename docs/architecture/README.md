# Arquitectura implementada

React presenta un recorrido principal en cuatro pasos: Menú, Cantidad, Insumos y Resultado. La creación de combinaciones está integrada en el primer paso. El guardado abre Mis planes, donde se consultan capturas históricas y se descarga el CSV. App.jsx contiene el marco y la navegación; la versión anterior se conserva fuera del recorrido principal en legacy/LegacyApp.jsx.

Flujo nuevo:

1. components/CompleteMenuPlanner.jsx dirige los cuatro pasos y usa MenuOffers.jsx para crear combinaciones. services/api.js centraliza solicitudes y formatos. SavedMenuPlans.jsx consulta los planes y su detalle, y MenuPlanSummary.jsx comparte el resumen entre resultado e historial.
2. api/routes/menus.py valida entradas con schemas/menus.py y schemas/menu_plans.py.
3. repositories/menus.py administra catálogo y ofertas; repositories/menu_plans.py consulta datos y guarda planes dentro de una transacción.
4. services/menu_planning.py calcula ingredientes, compras e ingresos con Decimal sin realizar consultas SQL.
5. db/plans.py proporciona la conexión a PostgreSQL de Windows. También conserva el acceso a daily_plans de la versión legada.

El planificador anterior usa api/routes/planning.py y services/planning.py; calcula por plato y está advertido en pantalla. Se conserva en código como legado, sin cargarlo desde la navegación principal. Los datos locales previos permanecen intactos.

Las migraciones viven en database/migrations y el catálogo inicial en database/catalogo_demo.json. Los scripts de la raíz scripts/ aplican la configuración y las migraciones. La información de autenticación se lee de .env local, excluido de Git.

Las tablas de fuentes externas ya existen. Los conectores automáticos aún no están implementados. Cuando se incorporen, se creará un módulo de integraciones con adaptadores por fuente y persistencia de consultas y resultados.
