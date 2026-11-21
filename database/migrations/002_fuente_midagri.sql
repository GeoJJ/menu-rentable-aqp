BEGIN;
INSERT INTO fuentes_externas(nombre,tipo,url_base,conector,activo)
VALUES ('MIDAGRI · Aves en Arequipa','estado','https://www.gob.pe/institucion/midagri/colecciones/94858-boletin-de-comercializacion-y-precios-de-aves-ano-2026','midagri_aves_arequipa',true)
ON CONFLICT(conector) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES ('002_fuente_midagri');
COMMIT;
