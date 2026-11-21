# Instalación en Windows para el equipo

Cada integrante instala una copia independiente. No debe usar la contraseña de otra persona ni restaurar un respaldo de Sergio para crear las tablas. El esquema se construye con las migraciones del repositorio; los planes personales no son necesarios.

## Requisitos

- PostgreSQL 18 y pgAdmin, con servicio iniciado y contraseña de su usuario local conocida.
- Python 3.12 y Node.js 22.12 o superior compatible con Vite 7.
- Git y VS Code.

## Crear la base

En pgAdmin, conectar al servidor local. Clic derecho en Databases, Create, Database. Nombre: menu_rentable; propietario: el usuario local autorizado (habitualmente postgres). Guardar. No crear manualmente las 19 tablas.

La configuración habitual es host 127.0.0.1 y puerto 5432. Si su instalación usa otro puerto, indicarlo al configurar la conexión.

## Preparar Python y configurar la conexión

Abrir una terminal PowerShell en la raíz del repositorio:

```powershell
python -m venv .venv
.venv\Scripts\python.exe -m pip install -r backend/requirements-lock.txt
.venv\Scripts\python.exe scripts/configurar_conexion.py
```

El asistente solicita host, puerto, base, usuario y contraseña. La contraseña no se muestra. Primero comprueba la conexión y luego genera .env; si ya existe, pide confirmación para reemplazarlo. Este script no cambia la contraseña del servidor ni crea la base.

Alternativamente, copiar .env.example a .env y editar DATABASE_URL con sus propios datos. No publicar una captura que muestre esa URL.

## Crear tablas e importar el catálogo

```powershell
.venv\Scripts\python.exe scripts/migrar_base.py
.venv\Scripts\python.exe scripts/sembrar_catalogo.py
```

La migración crea el esquema relacional y la tabla legada de compatibilidad. Se puede repetir: las migraciones aplicadas no se ejecutan nuevamente. El catálogo agrega 26 recetas y 32 ingredientes sin reemplazar registros existentes. No agrega existencias, precios de compra ni ventas ficticias. Las recetas son una base inicial revisable, no una validación de costos del negocio.

En pgAdmin: Databases, menu_rentable, Schemas, public, Tables; pulsar Refresh. Deben aparecer las tablas relacionales, schema_migrations y daily_plans.

No modificar una migración que ya ejecutó otro integrante. Para cambios posteriores se crea un nuevo archivo SQL numerado, que registra su versión en schema_migrations dentro de la misma transacción.

## Iniciar backend y frontend

Terminal 1, raíz del proyecto:

```powershell
.venv\Scripts\python.exe -m uvicorn app.main:app --app-dir backend --env-file .env --host 127.0.0.1 --port 8000
```

Terminal 2, raíz del proyecto:

```powershell
Copy-Item frontend/.env.example frontend/.env
npm --prefix frontend ci
npm --prefix frontend run dev -- --host 127.0.0.1
```

Si frontend/.env ya existe, revisarlo antes de sobrescribirlo. Abrir http://127.0.0.1:5173. El archivo de ejemplo del frontend apunta al backend local en el puerto 8000.

## Comprobación por integrante

1. Abrir http://127.0.0.1:8000/api/health y verificar status ok.
2. Entrar en Preparar mi plan, crear una combinación en el paso Menú y guardar su precio único.
3. Recargar: el menú debe permanecer.
4. Continuar por Cantidad e Insumos; ingresar cantidades, existencias y precios reales o de una prueba claramente identificada.
5. Calcular: ingreso = número de menús por precio único.
6. Guardar un plan dentro del presupuesto y recargar; debe aparecer en Mis planes, con detalle y descarga CSV.
7. Si falla, compartir el mensaje, paso y captura sin credenciales. No resetear la base como primera solución.

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

Una vez preparados .venv, .env y las dependencias del frontend, se puede ejecutar npm run dev desde la raíz para iniciar ambos servicios. Usa .venv de la raíz (o backend/.venv como compatibilidad) y carga el .env de la raíz. Detén antes los procesos que ya usen 8000 y 5173.
