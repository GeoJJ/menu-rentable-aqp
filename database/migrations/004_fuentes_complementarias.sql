BEGIN;
INSERT INTO fuentes_externas(nombre,tipo,url_base,conector) VALUES
('Plaza Vea · catálogo de arroz','privada','https://www.plazavea.com.pe','plazavea'),
('ADRA Perú · rescate de alimentos','ong','https://adra.org.pe','adra')
ON CONFLICT(conector) DO NOTHING;
INSERT INTO schema_migrations(version) VALUES ('004_fuentes_complementarias');
COMMIT;
