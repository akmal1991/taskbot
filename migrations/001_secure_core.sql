BEGIN;
CREATE TABLE IF NOT EXISTS ut_departments (
 id text PRIMARY KEY, code text NOT NULL UNIQUE, name text NOT NULL,
 coordinator_id text, active boolean NOT NULL DEFAULT true,
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_users (
 id text PRIMARY KEY, username text NOT NULL, email text NOT NULL, full_name text NOT NULL,
 role text NOT NULL CHECK (role IN ('ADMIN','DIRECTOR','WORKER')),
 department_id text REFERENCES ut_departments(id) ON DELETE RESTRICT,
 password_hash text, active boolean NOT NULL DEFAULT false,
 auth_version integer NOT NULL DEFAULT 1,
 telegram_id text UNIQUE, telegram_username text,
 data jsonb NOT NULL DEFAULT '{}', created_at timestamptz NOT NULL DEFAULT now(),
 last_login_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS ut_users_username_unique ON ut_users(lower(username));
CREATE UNIQUE INDEX IF NOT EXISTS ut_users_email_unique ON ut_users(lower(email));
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='ut_department_coordinator' AND conrelid='ut_departments'::regclass) THEN
  ALTER TABLE ut_departments ADD CONSTRAINT ut_department_coordinator FOREIGN KEY (coordinator_id) REFERENCES ut_users(id) ON DELETE RESTRICT;
 END IF;
END $$;
CREATE TABLE IF NOT EXISTS ut_memberships (
 user_id text REFERENCES ut_users(id) ON DELETE RESTRICT,
 department_id text REFERENCES ut_departments(id) ON DELETE RESTRICT,
 coordinator boolean NOT NULL DEFAULT false, PRIMARY KEY(user_id,department_id)
);
CREATE TABLE IF NOT EXISTS ut_role_permissions (
 role text PRIMARY KEY CHECK (role IN ('ADMIN','DIRECTOR','WORKER')),
 permissions jsonb NOT NULL
);
CREATE TABLE IF NOT EXISTS ut_sessions (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES ut_users(id) ON DELETE CASCADE,
 csrf_token text NOT NULL, auth_version integer NOT NULL,
 expires_at timestamptz NOT NULL, last_seen_at timestamptz NOT NULL DEFAULT now(),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ut_sessions_user ON ut_sessions(user_id);
CREATE TABLE IF NOT EXISTS ut_account_tokens (
 token_hash text PRIMARY KEY, user_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 purpose text NOT NULL CHECK (purpose IN ('ACTIVATE','RESET','TELEGRAM')),
 expires_at timestamptz NOT NULL, consumed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_login_throttle (
 key text PRIMARY KEY, attempts integer NOT NULL, window_start timestamptz NOT NULL,
 blocked_until timestamptz
);
CREATE TABLE IF NOT EXISTS ut_work_plans (
 id text PRIMARY KEY, title text NOT NULL, year integer NOT NULL CHECK(year BETWEEN 2000 AND 2200),
 active boolean NOT NULL DEFAULT true, data jsonb NOT NULL DEFAULT '{}'
);
CREATE TABLE IF NOT EXISTS ut_sections (
 id text PRIMARY KEY, work_plan_id text NOT NULL REFERENCES ut_work_plans(id) ON DELETE RESTRICT,
 number text NOT NULL, title text NOT NULL, UNIQUE(work_plan_id,number)
);
CREATE TABLE IF NOT EXISTS ut_categories (
 id text PRIMARY KEY, name text NOT NULL UNIQUE, active boolean NOT NULL DEFAULT true
);
CREATE TABLE IF NOT EXISTS ut_tasks (
 id text PRIMARY KEY, plan_code text NOT NULL UNIQUE, title text NOT NULL,
 creator_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 assignee_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 approver_id text REFERENCES ut_users(id) ON DELETE RESTRICT,
 department_id text NOT NULL REFERENCES ut_departments(id) ON DELETE RESTRICT,
 work_plan_id text REFERENCES ut_work_plans(id) ON DELETE RESTRICT,
 section_id text REFERENCES ut_sections(id) ON DELETE RESTRICT,
 category_id text REFERENCES ut_categories(id) ON DELETE RESTRICT,
 deadline date NOT NULL, status text NOT NULL CHECK(status IN ('PENDING','ASSIGNED','IN_PROGRESS','SUBMITTED_FOR_REVIEW','COMPLETED')),
 priority text NOT NULL CHECK(priority IN ('CRITICAL','HIGH','MEDIUM','LOW')),
 progress integer NOT NULL DEFAULT 0 CHECK(progress BETWEEN 0 AND 100),
 requires_evidence boolean NOT NULL DEFAULT true, requires_approval boolean NOT NULL DEFAULT true,
 draft boolean NOT NULL DEFAULT false, archived_at timestamptz,
 version integer NOT NULL DEFAULT 1, data jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ut_tasks_assignee ON ut_tasks(assignee_id,archived_at,status);
CREATE INDEX IF NOT EXISTS ut_tasks_deadline ON ut_tasks(deadline) WHERE status <> 'COMPLETED';
CREATE INDEX IF NOT EXISTS ut_tasks_department ON ut_tasks(department_id,status);
CREATE TABLE IF NOT EXISTS ut_dependencies (
 task_id text REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 depends_on_id text REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 PRIMARY KEY(task_id,depends_on_id), CHECK(task_id <> depends_on_id)
);
CREATE TABLE IF NOT EXISTS ut_attachments (
 id text PRIMARY KEY, task_id text NOT NULL REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 owner_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 filename text NOT NULL, mime text NOT NULL, size integer NOT NULL CHECK(size BETWEEN 1 AND 10485760),
 content bytea NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_evidence (
 id text PRIMARY KEY, task_id text NOT NULL REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 submitted_by text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 type text NOT NULL CHECK(type IN ('IMAGE','DOCUMENT','TEXT_NOTE','URL')),
 note text NOT NULL, artifact_url text, attachment_id text REFERENCES ut_attachments(id) ON DELETE RESTRICT,
 created_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS ut_evidence_task ON ut_evidence(task_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ut_reviews (
 id text PRIMARY KEY, evidence_id text NOT NULL UNIQUE REFERENCES ut_evidence(id) ON DELETE RESTRICT,
 reviewer_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 decision text NOT NULL CHECK(decision IN ('APPROVED','REJECTED')),
 remarks text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_comments (
 id text PRIMARY KEY, task_id text NOT NULL REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 author_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 parent_id text REFERENCES ut_comments(id) ON DELETE RESTRICT,
 content text NOT NULL, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_reactions (
 comment_id text REFERENCES ut_comments(id) ON DELETE CASCADE,
 user_id text REFERENCES ut_users(id) ON DELETE CASCADE,
 emoji text NOT NULL, PRIMARY KEY(comment_id,user_id,emoji)
);
CREATE TABLE IF NOT EXISTS ut_notifications (
 id text PRIMARY KEY, user_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 task_id text REFERENCES ut_tasks(id) ON DELETE RESTRICT,
 type text NOT NULL, title text NOT NULL, body text NOT NULL,
 read_at timestamptz, status text NOT NULL DEFAULT 'WAITING'
 CHECK(status IN ('WAITING','SENT','FAILED')),
 attempts integer NOT NULL DEFAULT 0, last_error text, sent_at timestamptz,
 next_attempt_at timestamptz NOT NULL DEFAULT now(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ut_notifications_user ON ut_notifications(user_id,created_at DESC);
CREATE TABLE IF NOT EXISTS ut_audit (
 id bigserial PRIMARY KEY, actor_id text REFERENCES ut_users(id) ON DELETE RESTRICT,
 actor_name text NOT NULL, actor_role text NOT NULL, action text NOT NULL,
 target_id text, before_data jsonb, after_data jsonb, details text NOT NULL DEFAULT '',
 ip_address text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ut_audit_time ON ut_audit(created_at DESC);
CREATE TABLE IF NOT EXISTS ut_import_jobs (
 id text PRIMARY KEY, operator_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 source text NOT NULL, row_count integer NOT NULL, digest text, report jsonb NOT NULL DEFAULT '{}',
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_settings (
 key text PRIMARY KEY, value jsonb NOT NULL, updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_legacy_snapshots (
 id text PRIMARY KEY, operator_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 digest text NOT NULL UNIQUE, original jsonb NOT NULL, role_mapping jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS ut_tickets (
 id text PRIMARY KEY, number text NOT NULL UNIQUE,
 user_id text NOT NULL REFERENCES ut_users(id) ON DELETE RESTRICT,
 department_id text NOT NULL REFERENCES ut_departments(id) ON DELETE RESTRICT,
 title text NOT NULL, description text NOT NULL, priority text NOT NULL,
 status text NOT NULL DEFAULT 'NEW', response_note text, created_at timestamptz NOT NULL DEFAULT now(), resolved_at timestamptz
);
CREATE OR REPLACE FUNCTION ut_immutable_record() RETURNS trigger LANGUAGE plpgsql AS $$
 BEGIN RAISE EXCEPTION 'Historical records are append-only'; END;
$$;
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['ut_audit','ut_legacy_snapshots','ut_reviews','ut_evidence'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname=tab||'_immutable' AND tgrelid=tab::regclass) THEN
   EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION ut_immutable_record()',tab||'_immutable',tab);
  END IF;
 END LOOP;
END $$;
CREATE TABLE IF NOT EXISTS ut_schema_migrations (version integer PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now());
INSERT INTO ut_schema_migrations(version) VALUES(1) ON CONFLICT DO NOTHING;
COMMIT;
