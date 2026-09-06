-- ---------------------------------------------------------------------
-- Usuario de solo lectura para el backend de CLAPINO.
--
-- El backend NO se conecta como root: usa este usuario, que únicamente
-- puede hacer SELECT. Aunque alguien lograse colar una sentencia de
-- escritura, MySQL la rechazaría.
--
-- Se ejecuta automáticamente al crear la base de datos por primera vez.
-- ---------------------------------------------------------------------

CREATE USER IF NOT EXISTS 'clapino_ro'@'%'
  IDENTIFIED BY 'clapino_ro';

GRANT SELECT ON ciclismo.* TO 'clapino_ro'@'%';

-- Si algún día añades más bases de datos, dale permiso aquí también:
-- GRANT SELECT ON biblioteca.* TO 'clapino_ro'@'%';

FLUSH PRIVILEGES;
