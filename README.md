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

La navegación principal tiene dos destinos: Preparar mi plan y Mis planes.

1. Menú: elegir una combinación guardada o crearla en el mismo paso con caldo, segundo, refresco y precio único.
2. Cantidad: indicar fecha, menús esperados y presupuesto.
3. Insumos: revisar existencias y precios con ayudas y unidades visibles.
4. Resultado: revisar costos y compras, ajustar si hace falta y guardar.
5. Mis planes: el guardado abre el resumen histórico y permite descargarlo con su lista de compras en CSV. Un plan anterior puede abrirse desde la misma lista.

La información del borrador se conserva al cambiar entre Preparar mi plan y Mis planes durante la sesión. Guardar o pulsar Preparar otro plan inicia un borrador nuevo. No se persiste el borrador al recargar la página.

Las compras se redondean a unidades de 1 kg, 1 L o 1 unidad. Los ingresos suponen vender todos los menús ingresados. El margen descuenta ingredientes; no personal, alquiler ni otros gastos. Guardar no descuenta inventario. Se permite un plan por fecha; aún no se edita ni reemplaza desde la interfaz.

## Compatibilidad y pendientes

La navegación de las pantallas anteriores fue retirada para evitar dos recorridos con datos distintos. El componente anterior se conserva en frontend/src/legacy/LegacyApp.jsx y sus datos locales no se borran. No se carga en la aplicación principal. Los catálogos del navegador y PostgreSQL todavía no se sincronizan.

Prioridades siguientes: conectores automáticos de fuentes estatales, privadas y ONG; mantenimiento relacional de recetas e inventario; registro de ventas por menú y pronóstico histórico. Las tablas de fuentes ya existen, pero los conectores no están implementados. JasperReports no está integrado.

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
