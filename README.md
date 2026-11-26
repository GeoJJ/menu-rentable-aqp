# Menú Rentable AQP

Planificación y seguimiento diario para pequeños negocios de comida de Arequipa. Cada menú completo contiene caldo, segundo y refresco con un precio único. React presenta la interfaz; Python/FastAPI valida las entradas, calcula y guarda los datos en PostgreSQL de Windows.

## Organización del código

```text
backend/app/
  api/routes/          Endpoints pequeños por operación
  schemas/             Clases Pydantic para validar entradas
  services/            Un archivo por cálculo o exportador
  repositories/        Clases de persistencia y transacciones SQL
  integrations/sources/ Conectores MIDAGRI, Plaza Vea y ADRA
  db/connection.py     Database: conexión configurada por DATABASE_URL
backend/tests/         Pruebas unitarias y de API con PostgreSQL aislado
frontend/src/
  features/planning/   Menús, planificación y planes guardados
  features/kitchen/    Recetas, despensa y fuentes externas
  features/operations/ Compras, pérdidas, cierre y resultados
  components/          Ayudas compartidas entre pantallas
  services/api.js      Solicitudes al backend y formatos de presentación
  styles/              Fuentes, estructura, pantallas y tema visual
  App.jsx              Navegación actual
  main.jsx             Punto de entrada
scripts/               Conexión, migración, catálogo, respaldo y pruebas
database/migrations/   Migraciones SQL versionadas
docs/architecture/     Arquitectura y mapa de clases para sustentación
```

[Mapa de clases, métodos, fórmulas y demostración](docs/architecture/defensa_backend.md). Esta guía corresponde al código actual. La documentación de cortes anteriores se retiró del repositorio activo.

## Recorrido completo

1. **Mi cocina:** crear y editar recetas; registrar ingredientes, existencias y cotizaciones manuales.
2. **Preparar mi plan:** elegir o editar el menú (nombre, precio y recetas), ingresar fecha y cantidad, consultar sugerencia histórica si existen cierres, revisar insumos y calcular. Python agrega ingredientes compartidos, calcula faltantes, redondea compras y verifica presupuesto.
3. **Mis planes:** consultar el plan y descargar la lista de compras en CSV o PDF. Mientras esté pendiente, editar fecha, menú, cantidad, presupuesto e insumos; revisar la comparación y guardar con un motivo. El historial conserva las versiones anteriores. Un plan cerrado o cancelado no se edita.
4. **Compras y resultados:** elegir Registrar compra, Registrar pérdida o Ver resultados. En una compra se indica ingrediente, cantidad recibida y total pagado; Python calcula el precio unitario y actualiza el costo promedio ponderado.
5. **Cierre del día:** desde el detalle del plan registrar preparados, vendidos, precio por menú y otros gastos sin ingredientes. Revisar el cierre antes de confirmar; la vista previa no guarda ni descuenta. Se valida stock y se descuenta el consumo de todos los menús preparados una sola vez, dentro de una transacción. Se guardan ingreso, sobrantes y costo real según receta.
6. **Resultados:** comparar planificado y real por fechas, sumar cierres y descargar CSV o PDF generados por Python.
7. **Referencias externas:** recuperar precio mayorista de pollo vivo de MIDAGRI, un producto de arroz del catálogo online de Plaza Vea e indicadores históricos de ADRA sobre rescate en Arequipa. Se guardan fechas y enlace de procedencia. Un error conserva la última lectura válida.

El prototipo antiguo, sus datos de demostración en JavaScript, el selector de versiones y la API legada se retiraron. Solo se carga la aplicación actual. No se borraron los registros históricos de la base local ni el almacenamiento previo del navegador. Una tabla `daily_plans` de instalaciones anteriores puede permanecer sin ser usada por la aplicación.

## Iniciar en Windows

Seguir [instalación](docs/instalacion/windows.md). Después de actualizar:

```powershell
.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
.venv\Scripts\python.exe scripts/migrar_base.py
npm.cmd --prefix frontend ci
npm.cmd run dev
```

En una instalación nueva, ejecutar además `scripts/sembrar_catalogo.py` después de configurar la base. Las migraciones nuevas no borran los datos existentes.

Aplicación: http://127.0.0.1:5173. API documentada: http://127.0.0.1:8000/docs. Mantener abierta la terminal de VS Code y detener con Ctrl+C. Docker no es necesario.

## Comprobar

```powershell
.venv\Scripts\python.exe scripts/probar_backend.py
npm.cmd run build
```

El script utiliza una base separada `menu_rentable_backend_test` y esquemas temporales por prueba. No escribe compras ni cierres ficticios en el negocio. Las pruebas de conectores usan respuestas controladas; una consulta real adicional comprueba disponibilidad actual de las fuentes. Las pruebas no garantizan que una web externa mantenga siempre el mismo formato.

## Alcance y reglas

- Un negocio local; no hay autenticación ni separación de usuarios.
- Un plan por fecha. Puede cancelarse antes del cierre; no se edita ni se reemplaza una fecha histórica.
- Guardar un plan no confirma compras ni descuenta ingredientes. No reemplaza el inventario real existente; solo inicializa ingredientes sin inventario a partir de sus existencias declaradas.
- Cerrar descuenta según la receta histórica y los menús preparados; no representa pesajes reales independientes de cada ingrediente.
- Compra estimada en presentaciones de 1 kg, 1 L o 1 unidad. El ingreso estimado supone vender toda la cantidad indicada.
- El reporte descuenta ingredientes de la producción y gastos adicionales declarados. No es utilidad contable neta. Las mermas de ingredientes quedan en el historial de inventario y no se descuentan automáticamente del margen del reporte.
- Pronóstico: promedio de hasta ocho cierres anteriores del mismo día de semana, o de últimos cierres si no hay comparables. Sin historia se solicita cantidad inicial. Los agotamientos requieren revisar la sugerencia.
- MIDAGRI: pollo vivo referencial, no pollo eviscerado. Colección configurada para 2026. Plaza Vea: precio online sin confirmar entrega en Arequipa. ADRA: datos históricos de una publicación sobre 2025, no disponibilidad de donaciones.
- Caché de seis horas y mínimo un minuto entre intentos por fuente. Las fuentes no cambian automáticamente inventario ni cotizaciones de compra.
- Exportación CSV y PDF. Los PDF se generan en Python con ReportLab y fuentes incluidas en la dependencia.
- `.env`, contraseñas, respaldos, logs y dependencias instaladas no se versionan.

## Ayudas para llenar los datos

La aplicación incluye ¿Qué lleno y en qué orden?, ejemplos visibles y ayudas por campo. Despensa es un conteo que reemplaza existencias; Registrar compra suma lo recibido. No registrar la misma compra por ambos caminos. El cierre se realiza al terminar de vender, muestra los ingredientes que se descontarán y señala faltantes antes de confirmar. No se escribe el total de ventas: Python lo calcula con menús vendidos y precio por menú.

## Limpieza y mantenimiento

Cada cálculo y exportador tiene su archivo en backend/app/services. Los conectores de fuentes están separados por institución. Se retiraron estilos y carpetas del prototipo, imports sin uso, cachés de trabajo y documentos desactualizados del árbol activo. Se conservan paquetes Python, modelos de validación, pruebas, migraciones, catálogo inicial y archivos privados necesarios para ejecutar la aplicación.

## Tema visual

La interfaz usa Archivo Variable y Michroma con fuentes locales. La paleta de grafito, blanco cálido y terracota se centraliza en frontend/src/styles/theme.css. Ver docs/architecture/diseno_visual.md para fuentes, colores y organización de estilos.
