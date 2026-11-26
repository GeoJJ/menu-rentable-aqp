# Arquitectura actual

El backend separa cuatro responsabilidades: las rutas HTTP reciben las solicitudes; las clases Pydantic validan; las clases de servicios calculan; las clases de repositorios consultan y persisten en PostgreSQL. Los conectores externos recuperan y validan información de sus fuentes.

La planificación usa MenuPlanningCalculator; el cierre y el inventario usan DayClosingCalculator e InventoryCalculator; el pronóstico usa DemandForecaster y los totales ReportCalculator. Cada operación conserva su transacción en el repositorio correspondiente.

[Mapa completo de clases, métodos, fórmulas y guion de demostración](defensa_backend.md).

La versión antigua de React y su API fueron retiradas. Se conserva la información histórica ya existente en la base, sin rutas que sigan usando la tabla daily_plans.

## Archivos principales

```text
backend/app/
  api/routes/          Solicitudes HTTP, sin fórmulas de negocio
  schemas/             Datos requeridos y restricciones de Pydantic
  services/
    menu_planning.py   MenuPlanningCalculator: porciones y compras estimadas
    inventory.py       InventoryCalculator: precio unitario y costo promedio
    day_closing.py     DayClosingCalculator: producción y resultado diario
    demand_forecast.py DemandForecaster: sugerencia por ventas anteriores
    reports.py         ReportCalculator: resumen del periodo
    csv_reports.py     ReportCSVExporter: archivo CSV
    pdf_reports.py     ReportPDFExporter: documentos PDF
    source_refresh.py  SourceRefreshService: consultas externas y caché
  repositories/        SQL y transacciones; OperationsRepository conserva junto
                       el cierre y sus movimientos para asegurar atomicidad
  integrations/sources/
    midagri.py         Boletín oficial de aves
    plazavea.py        Catálogo privado de arroz
    adra.py            Indicadores publicados por la ONG
    http.py           Descarga compartida de páginas configuradas
    errors.py         SourceError: fallos recuperables de lectura
  db/connection.py     Database: conexión a PostgreSQL
  assets/fonts/        Archivo y Michroma incrustadas en los PDF, con licencias

frontend/src/
  features/planning/   Menús, planificación y consulta de planes
  features/kitchen/    Recetas, despensa y referencias externas
  features/operations/ Compras, pérdidas, cierre y resultados
  components/          FormHelp: ayudas reutilizables
  services/api.js      Peticiones HTTP, descargas y formatos
  styles/              fonts.css, base.css, workspace.css y theme.css
  ../public/fonts/     Fuentes locales y sus licencias
```

Las rutas y las ayudas pequeñas pueden ser funciones: no se crean clases vacías para envolverlas. Cada clase de cálculo tiene su responsabilidad, y sus resultados se verifican en backend/tests. Los paquetes Python y los modelos con campos de validación son necesarios aunque no tengan métodos propios.

[Tipografía, colores y archivos del tema visual](diseno_visual.md).
