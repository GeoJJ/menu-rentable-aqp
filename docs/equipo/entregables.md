# Entregables y coordinación del equipo

## Base común

Tema aprobado: planificación de porciones para pequeños negocios de comida. Precio único por menú completo, compuesto por caldo, segundo y refresco. Un negocio local, sin autenticación en este avance. Backend Python/FastAPI, frontend React y PostgreSQL instalado en Windows. La recuperación automática de datos de Estado, privados y ONG es una condición del profesor y está parcialmente implementada: ya existe MIDAGRI; las fuentes privadas y ONG siguen pendientes.

## Sergio e integración técnica

Mantener backend, migraciones, integración con PostgreSQL y pruebas. Continuar conectores externos. Entregar script de base versionado e instrucciones; preparar respaldo revisado para la entrega. Integrar el trabajo del equipo y comprobar el recorrido final. Conservar evidencias de lo realmente ejecutado.

## Integrante de frontend y manual

Probar Menús completos y Planificar menú completo. Documentar pasos, campos, resultados y mensajes reales con capturas. Revisar legibilidad y uso en pantalla pequeña. Registrar errores indicando pasos y resultado esperado. Coordinar cambios en App.jsx para evitar conflictos. Diferenciar pantallas legadas y nuevas, sin afirmar que se sincronizan mientras no ocurra.

## Integrante de informe y diseños

Usar la plantilla del docente: problema, objetivos, justificación, alcance, RF/RNF, equipo y cronograma. Preparar BPMN, casos de uso, arquitectura y documentación de interfaces. Incorporar docs/database/modelo_datos.md y contrastarlo con el script SQL implementado. La base física usa numeric, FK, CHECK y transacciones; no documentar tablas o funciones que no existan como terminadas.

## Qué hace cada compañero para crear su base

1. Seguir docs/instalacion/windows.md con su usuario y contraseña locales.
2. Crear solo la base vacía menu_rentable en pgAdmin.
3. Generar .env con scripts/configurar_conexion.py.
4. Ejecutar scripts/migrar_base.py y scripts/sembrar_catalogo.py.
5. Iniciar backend y frontend y comprobar guardado y recuperación.

Cada base es independiente: los datos de Sergio no aparecen en la PC de otra persona. Lo que Git comparte es código, esquema y catálogo inicial. Las contraseñas y planes del negocio no se comparten por Git.

## Estado para el informe

Implementado: mantenimiento de recetas e ingredientes; existencias y cotizaciones manuales; menú con precio único; cálculo de cantidades y compras; planes relacionales y consulta de detalle histórico; descarga CSV; primera recuperación automática de MIDAGRI con procedencia y fechas.

Pendiente: conectores privados y ONG; ventas reales por menú y sobrantes; pronóstico histórico; reportes de resultados diarios/semanales; edición de menús y planes; JasperReports. La revisión visual ejecutada cubre el recorrido principal, editor de recetas y panel de MIDAGRI, no todos los casos de uso posibles.

No afirmar que ya se redujeron desperdicios ni que se recuperan precios de todas las categorías de fuentes. La evidencia automática actual corresponde únicamente a MIDAGRI y a pollo vivo mayorista de Arequipa. No inventar entrevistas, encuestas, porcentajes de avance o resultados de negocio. El margen actual solo descuenta ingredientes.

## Antes de integrar y entregar

- Cada integrante informa archivos modificados, pruebas realizadas y pendientes.
- Reunir editables y PDFs de documentación, código, script de BD y respaldo revisado.
- Revisar las credenciales y archivos excluidos antes del commit y del ZIP.
- Probar la instalación en otra PC y ensayar una explicación del código que cada uno domina.
- Mantener autorización del docente para tres integrantes: el lineamiento general revisado indicaba máximo dos.
