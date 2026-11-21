BEGIN;
CREATE TABLE IF NOT EXISTS schema_migrations (
    version text PRIMARY KEY,
    applied_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE unidades_medida (
    codigo varchar(8) PRIMARY KEY,
    nombre varchar(40) NOT NULL,
    dimension varchar(12) NOT NULL CHECK(dimension IN ('masa', 'volumen', 'conteo'))
);
INSERT INTO unidades_medida
VALUES ('kg', 'Kilogramo', 'masa'),
('L', 'Litro', 'volumen'),
('unidad', 'Unidad', 'conteo');
CREATE TABLE ingredientes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_legacy varchar(100) UNIQUE,
    nombre varchar(150) NOT NULL CHECK(length(trim(nombre)) > 0),
    unidad_codigo varchar(8) NOT NULL REFERENCES unidades_medida,
    activo boolean NOT NULL DEFAULT true
);
CREATE TABLE recetas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    codigo_legacy varchar(100) UNIQUE,
    nombre varchar(150) NOT NULL CHECK(length(trim(nombre)) > 0),
    categoria varchar(20) NOT NULL CHECK(
        categoria IN ('caldo', 'entrada', 'segundo', 'refresco')
    ),
    estilo varchar(40),
    rendimiento integer NOT NULL CHECK(rendimiento > 0),
    preparacion text,
    activo boolean NOT NULL DEFAULT true
);
CREATE TABLE receta_ingredientes (
    receta_id bigint REFERENCES recetas ON DELETE CASCADE,
    ingrediente_id bigint REFERENCES ingredientes,
    cantidad numeric(14, 4) NOT NULL CHECK(cantidad > 0),
    PRIMARY KEY(receta_id, ingrediente_id)
);
CREATE TABLE inventario (
    ingrediente_id bigint PRIMARY KEY REFERENCES ingredientes,
    existencia numeric(14, 4) NOT NULL CHECK(existencia >= 0),
    costo_unitario numeric(14, 4) NOT NULL CHECK(costo_unitario >= 0),
    actualizado_en timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE fuentes_externas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(150) NOT NULL,
    tipo varchar(12) NOT NULL CHECK(tipo IN ('estado', 'privada', 'ong')),
    url_base text NOT NULL,
    conector varchar(80) UNIQUE,
    activo boolean NOT NULL DEFAULT true
);
CREATE TABLE consultas_fuentes (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fuente_id bigint NOT NULL REFERENCES fuentes_externas,
    iniciado_en timestamptz NOT NULL DEFAULT now(),
    terminado_en timestamptz,
    estado varchar(15) NOT NULL CHECK(
        estado IN ('ejecutando', 'correcto', 'parcial', 'error')
    ),
    registros_obtenidos integer NOT NULL DEFAULT 0 CHECK(registros_obtenidos >= 0),
    mensaje_error text,
    CHECK(
        terminado_en IS NULL
        OR terminado_en >= iniciado_en
    )
);
CREATE TABLE registros_externos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    consulta_id bigint NOT NULL REFERENCES consultas_fuentes,
    clave_externa text,
    tipo_dato varchar(30) NOT NULL CHECK(
        tipo_dato IN ('precio', 'producto', 'programa', 'publicacion')
    ),
    titulo text NOT NULL,
    url_origen text NOT NULL,
    publicado_en date,
    ubicacion text,
    contenido jsonb NOT NULL,
    hash_contenido char(64) NOT NULL,
    UNIQUE(consulta_id, hash_contenido)
);
CREATE TABLE productos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ingrediente_id bigint NOT NULL REFERENCES ingredientes,
    fuente_id bigint REFERENCES fuentes_externas,
    codigo_externo text,
    nombre varchar(200) NOT NULL,
    marca varchar(100),
    contenido_base numeric(14, 4) NOT NULL CHECK(contenido_base > 0),
    url_producto text,
    activo boolean NOT NULL DEFAULT true,
    UNIQUE(id, ingrediente_id)
);
CREATE TABLE cotizaciones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ingrediente_id bigint NOT NULL REFERENCES ingredientes,
    producto_id bigint,
    registro_externo_id bigint REFERENCES registros_externos,
    origen varchar(12) NOT NULL CHECK(origen IN ('manual', 'automatico')),
    tipo_precio varchar(15) NOT NULL CHECK(tipo_precio IN ('referencial', 'compra')),
    proveedor text NOT NULL,
    ubicacion text NOT NULL,
    fecha_precio date,
    recuperado_en timestamptz NOT NULL DEFAULT now(),
    precio numeric(14, 4) NOT NULL CHECK(precio >= 0),
    cantidad_base numeric(14, 4) NOT NULL CHECK(cantidad_base > 0),
    moneda char(3) NOT NULL DEFAULT 'PEN' CHECK(moneda = 'PEN'),
    CHECK(
        origen <> 'automatico'
        OR registro_externo_id IS NOT NULL
    ),
    FOREIGN KEY(producto_id, ingrediente_id) REFERENCES productos(id, ingrediente_id),
    UNIQUE(id, ingrediente_id)
);
CREATE TABLE ofertas_menu (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nombre varchar(150) NOT NULL CHECK(length(trim(nombre)) > 0),
    precio_menu numeric(14, 2) NOT NULL CHECK(precio_menu >= 0),
    activo boolean NOT NULL DEFAULT true
);
CREATE TABLE oferta_componentes (
    oferta_id bigint REFERENCES ofertas_menu ON DELETE CASCADE,
    receta_id bigint REFERENCES recetas,
    porciones_por_menu numeric(14, 4) NOT NULL CHECK(porciones_por_menu > 0),
    PRIMARY KEY(oferta_id, receta_id)
);
CREATE TABLE planes_diarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha date NOT NULL UNIQUE,
    presupuesto numeric(14, 2) NOT NULL CHECK(presupuesto >= 0),
    escenario varchar(15) NOT NULL CHECK(escenario IN ('conservador', 'base', 'ampliado')),
    version integer NOT NULL DEFAULT 1 CHECK(version > 0),
    origen varchar(15) NOT NULL CHECK(origen IN ('propio', 'demostracion')),
    creado_en timestamptz NOT NULL DEFAULT now(),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    version_calculo varchar(30) NOT NULL
);
CREATE TABLE plan_platos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id bigint NOT NULL REFERENCES planes_diarios ON DELETE CASCADE,
    receta_id bigint NOT NULL REFERENCES recetas,
    nombre_receta text NOT NULL,
    categoria varchar(20) NOT NULL,
    rendimiento_base integer NOT NULL CHECK(rendimiento_base > 0),
    porciones integer NOT NULL CHECK(porciones >= 0),
    demanda_estimada integer NOT NULL CHECK(demanda_estimada >= 0),
    ventas_estimadas integer NOT NULL CHECK(
        ventas_estimadas BETWEEN 0 AND porciones
    ),
    muestras_historicas integer NOT NULL CHECK(muestras_historicas >= 0),
    usa_demostracion boolean NOT NULL,
    UNIQUE(plan_id, receta_id),
    UNIQUE(id, plan_id)
);
CREATE TABLE plan_ofertas (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id bigint NOT NULL REFERENCES planes_diarios ON DELETE CASCADE,
    oferta_id bigint NOT NULL REFERENCES ofertas_menu,
    nombre_oferta text NOT NULL,
    precio_menu numeric(14, 2) NOT NULL CHECK(precio_menu >= 0),
    menus_planificados integer NOT NULL CHECK(menus_planificados >= 0),
    demanda_estimada integer NOT NULL CHECK(demanda_estimada >= 0),
    menus_venta_estimada integer NOT NULL CHECK(
        menus_venta_estimada BETWEEN 0 AND menus_planificados
    ),
    UNIQUE(plan_id, oferta_id),
    UNIQUE(id, plan_id)
);
CREATE TABLE plan_oferta_componentes (
    plan_oferta_id bigint NOT NULL,
    plan_plato_id bigint NOT NULL,
    plan_id bigint NOT NULL,
    porciones_por_menu numeric(14, 4) NOT NULL CHECK(porciones_por_menu > 0),
    PRIMARY KEY(plan_oferta_id, plan_plato_id),
    FOREIGN KEY(plan_oferta_id, plan_id) REFERENCES plan_ofertas(id, plan_id) ON DELETE CASCADE,
    FOREIGN KEY(plan_plato_id, plan_id) REFERENCES plan_platos(id, plan_id) ON DELETE CASCADE
);
CREATE TABLE plan_insumos (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id bigint NOT NULL REFERENCES planes_diarios ON DELETE CASCADE,
    ingrediente_id bigint NOT NULL REFERENCES ingredientes,
    producto_id bigint,
    cotizacion_id bigint,
    nombre_ingrediente text NOT NULL,
    unidad_codigo varchar(8) NOT NULL REFERENCES unidades_medida,
    necesario numeric(14, 4) NOT NULL CHECK(necesario >= 0),
    existencia_inicial numeric(14, 4) NOT NULL CHECK(existencia_inicial >= 0),
    faltante numeric(14, 4) NOT NULL CHECK(faltante >= 0),
    costo_existencia_unitario numeric(14, 4) NOT NULL CHECK(costo_existencia_unitario >= 0),
    nombre_producto text,
    contenido_envase numeric(14, 4) CHECK(contenido_envase > 0),
    precio_envase numeric(14, 4) CHECK(precio_envase >= 0),
    envases integer NOT NULL CHECK(envases >= 0),
    costo_consumido numeric(14, 4) NOT NULL CHECK(costo_consumido >= 0),
    procedencia text,
    UNIQUE(plan_id, ingrediente_id),
    FOREIGN KEY(producto_id, ingrediente_id) REFERENCES productos(id, ingrediente_id),
    FOREIGN KEY(cotizacion_id, ingrediente_id) REFERENCES cotizaciones(id, ingrediente_id),
    CHECK(
        envases = 0
        OR (
            producto_id IS NOT NULL
            AND contenido_envase IS NOT NULL
            AND precio_envase IS NOT NULL
        )
    )
);
CREATE TABLE registros_diarios (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    fecha date NOT NULL,
    oferta_id bigint NOT NULL REFERENCES ofertas_menu,
    nombre_oferta text NOT NULL,
    preparadas integer NOT NULL CHECK(preparadas >= 0),
    vendidas integer NOT NULL CHECK(
        vendidas BETWEEN 0 AND preparadas
    ),
    precio_menu_real numeric(14, 2) NOT NULL CHECK(precio_menu_real >= 0),
    origen varchar(15) NOT NULL CHECK(origen IN ('propio', 'demostracion')),
    actualizado_en timestamptz NOT NULL DEFAULT now(),
    UNIQUE(fecha, oferta_id)
);
CREATE INDEX ON receta_ingredientes(ingrediente_id);
CREATE INDEX ON consultas_fuentes(fuente_id, iniciado_en);
CREATE INDEX ON registros_externos(consulta_id);
CREATE INDEX ON productos(ingrediente_id);
CREATE INDEX ON cotizaciones(ingrediente_id, fecha_precio);
CREATE INDEX ON registros_diarios(oferta_id, fecha);
INSERT INTO schema_migrations(version)
VALUES ('001_relacional_menu');
COMMIT;