# Arquitectura implementada

React presenta dos recorridos: menús completos y planificación relacional, y pantallas legadas de la versión previa. Los componentes nuevos están separados de App.jsx. Todavía queda extraer las pantallas legadas del componente principal.

Flujo nuevo:

1. components/MenuOffers.jsx o components/CompleteMenuPlanner.jsx consultan la API.
2. api/routes/menus.py valida entradas con schemas/menus.py y schemas/menu_plans.py.
3. repositories/menus.py administra catálogo y ofertas; repositories/menu_plans.py consulta datos y guarda planes dentro de una transacción.
4. services/menu_planning.py calcula ingredientes, compras e ingresos con Decimal sin realizar consultas SQL.
5. db/plans.py proporciona la conexión a PostgreSQL de Windows. También conserva el acceso a daily_plans de la versión legada.

El planificador anterior usa api/routes/planning.py y services/planning.py; calcula por plato y está advertido en pantalla. Se conserva para no eliminar el trabajo anterior mientras se adapta el resto de los módulos.

Las migraciones viven en database/migrations y el catálogo inicial en database/catalogo_demo.json. Los scripts de la raíz scripts/ aplican la configuración y las migraciones. La información de autenticación se lee de .env local, excluido de Git.

Las tablas de fuentes externas ya existen. Los conectores automáticos aún no están implementados. Cuando se incorporen, se creará un módulo de integraciones con adaptadores por fuente y persistencia de consultas y resultados.
