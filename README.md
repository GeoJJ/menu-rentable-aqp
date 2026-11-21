# Menú Rentable AQP

Aplicación web para planificar menús completos de pequeños negocios de comida en Arequipa. Un menú tiene caldo, segundo y refresco con un precio único. El backend calcula ingredientes, compras e ingresos estimados y guarda planes en PostgreSQL de Windows.

## Empezar

1. Clonar el repositorio y abrir la raíz en VS Code.
2. Seguir [Instalación en Windows](docs/instalacion/windows.md).
3. Revisar [Coordinación del equipo](docs/equipo/entregables.md) para repartir documentación y código.

## Organización

```text
backend/
  app/
    api/routes/       Endpoints HTTP
    schemas/          Validación de entradas
    services/         Reglas y cálculos de negocio
    repositories/     Consultas y transacciones PostgreSQL
    db/               Conexión y tabla de compatibilidad
  tests/              Pruebas de API, cálculo y persistencia
frontend/
  src/components/     Pantallas y componentes React
  src/data/demo/      Datos legados de demostración
  src/usePlanning.js  Acceso al planificador legado
  src/styles/         Estilos
  src/App.jsx         Navegación y pantallas legadas
  package-lock.json   Dependencias reproducibles
scripts/              Configuración, migración, catálogo y respaldo
database/
  migrations/         Esquema SQL versionado
  catalogo_demo.json  Catálogo inicial de recetas e ingredientes
docs/                 Instalación, modelo de datos y coordinación
```

## Recorrido actual

- **Menús completos:** crear una combinación de caldo, segundo y refresco con precio único.
- **Planificar menú completo:** ingresar fecha, menús esperados, presupuesto, existencias y precios por ingrediente. Calcular y guardar. Consultar planes guardados al pie de la misma pantalla.
- Las compras se redondean a unidades de 1 kg, 1 L o 1 unidad. No se manejan otras presentaciones en este recorrido todavía.
- Los ingresos suponen la venta de todos los menús ingresados; no son un pronóstico histórico. El margen descuenta ingredientes, no personal, alquiler ni otros gastos.
- Guardar un plan conserva su precio, composición y cantidades. Guarda existencias iniciales declaradas; no las descuenta. Solo se permite un plan por fecha y todavía no se edita ni reemplaza desde esta pantalla.

## Compatibilidad y pendientes

Las pantallas anteriores de Planificar, Recetas, Insumos, Registro diario, Historial y Reportes se conservan como trabajo previo. Parte de ellas usa localStorage y datos de demostración. El cálculo anterior por plato está advertido y no representa el precio único del menú. Las nuevas recetas de PostgreSQL y las ediciones del recetario legado aún no se sincronizan. Historial y reportes legados aún no muestran los planes relacionales.

Prioridades siguientes: recuperación automática de fuentes estatales, privadas y ONG; mantenimiento relacional de recetas e inventario; registro de ventas por menú; adaptación de historial y reportes. Las tablas de fuentes ya existen, pero los conectores no están implementados. JasperReports no está integrado.

Alcance local: un negocio, sin autenticación ni separación de usuarios. Cada compañero usa su propia base local; PostgreSQL de Windows es suficiente y no se requiere Docker.

## API y pruebas

Con el backend iniciado: http://127.0.0.1:8000/docs.

```powershell
.venv\Scripts\python.exe -m pytest backend/tests -q
npm --prefix frontend run build
```

Sin TEST_DATABASE_URL se omiten las pruebas de integración. Para ejecutarlas, usar una base exclusiva de pruebas y definir esa variable. Las pruebas de menús crean esquemas temporales y los eliminan; la prueba legada utiliza y limpia un registro fijo, por lo que nunca debe apuntar a una base con datos del negocio.

La compilación y las pruebas de API no sustituyen una revisión visual del navegador.

## Base de datos

- [Diseño y diccionario](docs/database/modelo_datos.md).
- [Migración inicial](database/migrations/001_relacional_menu.sql): 19 tablas de dominio y registro schema_migrations.
- La tabla anterior daily_plans se conserva para compatibilidad y respaldo del desarrollo previo.
- Las migraciones no contienen usuarios, contraseñas ni planes personales del equipo.

## Configuración privada

Copiar o generar .env localmente. Nunca subir .env, contraseñas, logs, dependencias instaladas ni respaldos con datos personales. .env.example contiene solo marcadores. Las credenciales con caracteres especiales deben codificarse en la URL; scripts/configurar_conexion.py lo hace automáticamente.
