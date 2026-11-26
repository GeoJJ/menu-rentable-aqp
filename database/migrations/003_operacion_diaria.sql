BEGIN;
ALTER TABLE planes_diarios ADD COLUMN estado varchar(12) NOT NULL DEFAULT 'planificado'
    CHECK (estado IN ('planificado','cerrado','cancelado'));
ALTER TABLE planes_diarios ADD COLUMN motivo_cancelacion text;
ALTER TABLE registros_diarios ADD COLUMN plan_id bigint UNIQUE REFERENCES planes_diarios;
ALTER TABLE registros_diarios ADD COLUMN costo_ingredientes_real numeric(14,4) NOT NULL DEFAULT 0 CHECK(costo_ingredientes_real>=0);
ALTER TABLE registros_diarios ADD COLUMN gastos_adicionales numeric(14,2) NOT NULL DEFAULT 0 CHECK(gastos_adicionales>=0);
CREATE TABLE movimientos_inventario (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 ingrediente_id bigint NOT NULL REFERENCES ingredientes,
 plan_id bigint REFERENCES planes_diarios,
 tipo varchar(12) NOT NULL CHECK(tipo IN ('compra','consumo','merma','ajuste')),
 cantidad numeric(18,8) NOT NULL CHECK(cantidad<>0),
 costo_unitario numeric(18,8) NOT NULL CHECK(costo_unitario>=0),
 saldo numeric(18,8) NOT NULL CHECK(saldo>=0),
 motivo text NOT NULL CHECK(length(trim(motivo))>0),
 creado_en timestamptz NOT NULL DEFAULT now(),
 CHECK((tipo='compra' AND cantidad>0) OR (tipo IN ('consumo','merma') AND cantidad<0) OR tipo='ajuste')
);
ALTER TABLE inventario ALTER COLUMN existencia TYPE numeric(18,8);
ALTER TABLE inventario ALTER COLUMN costo_unitario TYPE numeric(18,8);
CREATE INDEX ON movimientos_inventario(ingrediente_id,creado_en);
CREATE UNIQUE INDEX ON movimientos_inventario(plan_id,ingrediente_id) WHERE tipo='consumo';
INSERT INTO schema_migrations(version) VALUES ('003_operacion_diaria');
COMMIT;
