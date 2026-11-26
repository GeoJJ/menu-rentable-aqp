# Coordinación del equipo

## Base común

Menú completo con caldo, segundo y refresco y un precio único. Backend Python/FastAPI, frontend React y PostgreSQL de Windows. Aplicación local para un negocio. El código del prototipo anterior se retiró; usar únicamente las pantallas actuales.

## Sergio: integración y sustentación técnica

Revisar el mapa de clases en docs/architecture/defensa_backend.md. Verificar el ciclo de planificación, compras, cierre, inventario y resultados en una base de demostración. Ejecutar pruebas y compilación antes de integrar cambios. Conservar evidencia de ejecuciones reales y proteger .env.

## Integrante de frontend y manual

Documentar Preparar mi plan, Mi cocina, Mis planes y Compras y resultados. Incluir compras y pérdidas, cierre diario, estados del plan, sugerencia histórica y las tres referencias externas. Explicar los campos con unidades. Capturar mensajes reales, incluyendo inventario insuficiente. Probar escritorio y móvil.

## Integrante de informe y diseños

Actualizar requisitos, casos de uso y BPMN para incluir edición de planes con historial, cierre de ventas, sobrantes, consumo de inventario y consultas de resultados. Actualizar el modelo con las migraciones 003, 004 y 005. Relacionar clases del código con los diagramas. Distinguir una planificación de una venta real y no presentar el margen como utilidad contable neta.

## Base independiente de cada integrante

Seguir docs/instalacion/windows.md: crear base vacía, configurar su propia conexión, ejecutar migraciones y sembrar catálogo inicial. Git comparte el código y el esquema; no comparte contraseñas ni los planes personales de otro integrante.

## Funcionalidades y límites

Se implementaron planificación, catálogo, movimientos, cierre transaccional, pronóstico histórico simple, reportes CSV/PDF y conectores estatal (MIDAGRI), privado (Plaza Vea) y ONG (ADRA). Leer el alcance y límites actuales en README.md antes de describirlos en el informe. Plaza Vea no garantiza entrega en Arequipa; ADRA aporta cifras históricas, no un servicio automático de recepción de sobrantes. Los PDF se generan con ReportLab en Python. Autenticación y varios negocios no forman parte de esta implementación.

No inventar resultados de reducción de desperdicios, entrevistas, encuestas ni porcentajes de avance. Las pruebas con datos ficticios deben identificarse y ejecutarse en una base de demostración o de pruebas.
