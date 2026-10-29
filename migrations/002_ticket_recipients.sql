BEGIN;
ALTER TABLE ut_tickets ADD COLUMN IF NOT EXISTS recipient_user_id text REFERENCES ut_users(id) ON DELETE RESTRICT;
ALTER TABLE ut_tickets ADD COLUMN IF NOT EXISTS resolved_by_id text REFERENCES ut_users(id) ON DELETE RESTRICT;
CREATE INDEX IF NOT EXISTS ut_tickets_recipient ON ut_tickets(recipient_user_id);
CREATE INDEX IF NOT EXISTS ut_tickets_department ON ut_tickets(department_id);
INSERT INTO ut_schema_migrations(version) VALUES(2) ON CONFLICT DO NOTHING;
COMMIT;
