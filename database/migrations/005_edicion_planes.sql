BEGIN;
CREATE TABLE plan_revisiones (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    plan_id bigint NOT NULL REFERENCES planes_diarios,
    version integer NOT NULL CHECK (version > 0),
    motivo text NOT NULL CHECK (length(trim(motivo)) BETWEEN 3 AND 500),
    reemplazado_en timestamptz NOT NULL DEFAULT now(),
    datos jsonb NOT NULL CHECK (jsonb_typeof(datos) = 'object'),
    UNIQUE (plan_id, version)
);
INSERT INTO schema_migrations(version) VALUES ('005_edicion_planes');
COMMIT;
