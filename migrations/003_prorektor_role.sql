BEGIN;
ALTER TABLE ut_users DROP CONSTRAINT IF EXISTS ut_users_role_check;
ALTER TABLE ut_users ADD CONSTRAINT ut_users_role_check CHECK (role IN ('ADMIN','PROREKTOR','DIRECTOR','WORKER'));
ALTER TABLE ut_role_permissions DROP CONSTRAINT IF EXISTS ut_role_permissions_role_check;
ALTER TABLE ut_role_permissions ADD CONSTRAINT ut_role_permissions_role_check CHECK (role IN ('ADMIN','PROREKTOR','DIRECTOR','WORKER'));
INSERT INTO ut_schema_migrations(version) VALUES(3) ON CONFLICT DO NOTHING;
COMMIT;
