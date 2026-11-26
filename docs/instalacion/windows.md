# Instalación en Windows para el equipo

Cada integrante instala una copia independiente con su propia contraseña de PostgreSQL. Docker no es necesario. Hay dos opciones: empezar con el catálogo inicial o restaurar un respaldo para disponer de los mismos planes, compras y cierres. No combinar ambas instalaciones en la misma base.

## Requisitos

- PostgreSQL 18 y pgAdmin, con servicio iniciado y contraseña de su usuario local conocida.
- Python 3.12 y Node.js 22.12 o superior compatible con Vite 7.
- Git y VS Code.

## Descargar el proyecto

Abrir PowerShell en la carpeta donde se quiera guardar el proyecto:

```powershell
git clone https://github.com/GeoJJ/menu-rentable-aqp.git
cd menu-rentable-aqp
code .
```

Los siguientes comandos se ejecutan desde esa carpeta, donde están README.md, backend, frontend y scripts. Si ya tienen una copia, usar la sección Actualizar una instalación existente.

## Crear la base

En pgAdmin, conectar al servidor local. Clic derecho en Databases, Create, Database. Nombre: menu_rentable; propietario: el usuario local autorizado (habitualmente postgres). Guardar. No crear manualmente las tablas: las migraciones preparan el esquema.

La configuración habitual es host 127.0.0.1 y puerto 5432. Si su instalación usa otro puerto, indicarlo al configurar la conexión.

## Preparar Python y configurar la conexión

Abrir una terminal PowerShell en la raíz del repositorio:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
.venv\Scripts\python.exe scripts/configurar_conexion.py
```

El script solicita host, puerto, base, usuario y contraseña. La contraseña no se muestra. Primero comprueba la conexión y luego genera .env; si ya existe, pide confirmación para reemplazarlo. Este script no cambia la contraseña del servidor ni crea la base.

Alternativamente, copiar .env.example a .env y editar DATABASE_URL con sus propios datos. No publicar una captura que muestre esa URL.

## Crear tablas e importar el catálogo

```powershell
.venv\Scripts\python.exe scripts/migrar_base.py
.venv\Scripts\python.exe scripts/sembrar_catalogo.py
```

Las cinco migraciones actuales crean el esquema relacional, los movimientos de inventario, el estado del plan, las tres fuentes externas y el historial de ediciones. Se puede repetir: las migraciones aplicadas no se ejecutan nuevamente. El catálogo agrega 26 recetas y 32 ingredientes sin reemplazar registros existentes. No agrega menús completos, existencias, precios de compra ni ventas. Las recetas son una base inicial revisable, no una validación de costos del negocio.

En pgAdmin: Databases, menu_rentable, Schemas, public, Tables; pulsar Refresh. Deben aparecer las tablas relacionales y schema_migrations. Una instalación anterior puede conservar daily_plans sin uso.

No modificar una migración que ya ejecutó otro integrante. Para cambios posteriores se crea un nuevo archivo SQL numerado, que registra su versión en schema_migrations dentro de la misma transacción.

## Iniciar backend y frontend

Terminal 1, raíz del proyecto:

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --env-file .env --host 127.0.0.1 --port 8000
```

Terminal 2, raíz del proyecto:

```powershell
Copy-Item frontend/.env.example frontend/.env
npm.cmd --prefix frontend ci
npm.cmd --prefix frontend run dev -- --host 127.0.0.1
```

Si frontend/.env ya existe, revisarlo antes de sobrescribirlo. Abrir http://127.0.0.1:5173. El archivo de ejemplo del frontend apunta al backend local en el puerto 8000.

## Comprobación por integrante

1. Abrir http://127.0.0.1:8000/api/health y verificar status ok.
2. Entrar en Preparar mi plan, crear una combinación en el paso Menú y guardar su precio único.
3. Recargar: el menú debe permanecer.
4. Continuar por Cantidad e Insumos; ingresar cantidades, existencias y precios reales o de una prueba claramente identificada.
5. Calcular: ingreso = número de menús por precio único.
6. Guardar un plan dentro del presupuesto y recargar; debe aparecer en Mis planes, con detalle y descarga CSV y PDF.
7. Abrir Editar plan pendiente, cambiar cantidad, recalcular y guardar con motivo. Consultar la versión anterior en Historial del plan.
8. Registrar las compras que falten en Compras y resultados. Revisar el cierre antes de confirmar: preparados, vendidos, precio por menú y otros gastos sin ingredientes. Solo se puede cerrar el día del plan o después.
9. Consultar resultados por fechas y descargar PDF. Los planes cerrados o cancelados no se editan.
10. Si falla, compartir el mensaje, paso y captura sin credenciales. No resetear la base como primera solución.

## Actualizar una instalación existente

Detener el proyecto con Ctrl+C y comprobar `git status`. Si hay trabajo propio pendiente, guardarlo en su rama antes de actualizar. Con la copia limpia, desde la raíz:

```powershell
git switch main
git pull --ff-only origin main
.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
.venv\Scripts\python.exe scripts/migrar_base.py
npm.cmd --prefix frontend ci
npm.cmd run dev
```

Si Git informa conflictos o que no puede avanzar, conservar el mensaje y coordinar la integración; no usar reset para descartar trabajo. No hace falta volver a crear la base ni copiar .env otra vez. La migración 005 agrega el historial sin borrar los planes anteriores.

## Tener los mismos planes, compras y cierres

GitHub contiene código, migraciones y catálogo. Los ejemplos cargados en la computadora de Sergio están en su PostgreSQL local y no aparecen automáticamente al clonar.

Para disponer de esos registros, Sergio debe generar y compartir un respaldo SQL con el comando de la sección siguiente. Quien lo recibe debe restaurarlo en una base nueva y vacía siguiendo Respaldo y restauración, configurar su .env para esa base y arrancar el proyecto. No ejecutar primero las migraciones ni el catálogo en esa base: el respaldo ya incluye tablas y datos. Después de futuras actualizaciones, sí ejecutar migrar_base.py para aplicar las migraciones nuevas.

## Respaldo y restauración

Con PostgreSQL 18 instalado en la ruta habitual:

```powershell
.venv\Scripts\python.exe scripts/respaldar_base.py
```

Genera database/backups/menu_rentable.sql, excluido de Git. Si PostgreSQL está en otra ruta, usar --pg-dump con la ruta completa del ejecutable. El respaldo contiene datos; compartirlo solo cuando sea necesario para la entrega y revisarlo antes.

Para restaurar, crear una base nueva y vacía menu_rentable_restaurada en pgAdmin. No usar la base activa. Ejecutar:

```powershell
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -h 127.0.0.1 -p 5432 -U postgres -d menu_rentable_restaurada -W -v ON_ERROR_STOP=1 -f database/backups/menu_rentable.sql
```

La terminal solicita la contraseña. No ejecutar las migraciones primero en la base de restauración: el respaldo ya contiene esquema y datos.

## Trabajo con ramas

Cada persona crea su rama desde el avance compartido. Acordar antes qué archivos editará cada integrante. Antes de un merge, verificar compilación, pruebas y que README y modelo de datos coincidan con el comportamiento. No subir node_modules, .venv, .env ni respaldos personales.

## Inicio conjunto opcional

Una vez preparados .venv, .env y las dependencias del frontend, se puede ejecutar `npm.cmd run dev` desde la raíz para iniciar ambos servicios. Usa únicamente .venv y .env de la raíz. Mantener la terminal abierta; Ctrl+C detiene ambos servicios. Detén antes los procesos que ya usen 8000 y 5173.

## Errores frecuentes

| Mensaje o situación | Qué revisar |
|---|---|
| PostgreSQL rechaza la contraseña | Usar la contraseña del usuario de su propio servidor, no la contraseña maestra de pgAdmin ni asumir que es 123456. Repetir configurar_conexion.py. |
| No existe menu_rentable | Crear la base antes de configurar la conexión. |
| Falta una tabla, como plan_revisiones | Detener el backend, ejecutar migrar_base.py y volver a iniciarlo. |
| No aparecen recetas | Ejecutar sembrar_catalogo.py en una instalación nueva y refrescar la web. |
| No aparecen los planes de Sergio | Es normal al clonar; seguir Tener los mismos planes, compras y cierres. |
| PowerShell bloquea npm.ps1 | Usar npm.cmd como en los comandos de esta guía. |
| Puerto 8000 o 5173 ocupado | Detener la otra instancia del proyecto antes de iniciar una nueva. |
| La web dice Sin conexión | Revisar que el backend siga activo y abrir http://127.0.0.1:8000/api/health. |

Para validar código y compilación, desde la raíz:

```powershell
.venv\Scripts\python.exe scripts/probar_backend.py
npm.cmd run build
```

Las pruebas usan una base separada. Si el usuario de PostgreSQL no tiene permiso para crear bases, crear menu_rentable_backend_test con un usuario autorizado antes de ejecutarlas.
