CREATE TABLE IF NOT EXISTS ut_execution_items (
 id text PRIMARY KEY, department_id text NOT NULL REFERENCES ut_departments(id),
 source_file text NOT NULL, source_number integer NOT NULL, title text NOT NULL,
 schedule text NOT NULL, source_responsible text NOT NULL,
 assignee_ids text[] NOT NULL DEFAULT '{}', unresolved_roles text[] NOT NULL DEFAULT '{}',
 first_reviewer_id text NOT NULL REFERENCES ut_users(id), final_reviewer_id text NOT NULL REFERENCES ut_users(id),
 status text NOT NULL DEFAULT 'ASSIGNED' CHECK(status IN ('ASSIGNED','FIRST_REVIEW','FINAL_REVIEW','RETURNED','COMPLETED')),
 cycle integer NOT NULL DEFAULT 1, version integer NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(source_file,source_number), CHECK(first_reviewer_id<>final_reviewer_id)
);
CREATE TABLE IF NOT EXISTS ut_execution_evidence (
 id text PRIMARY KEY, item_id text NOT NULL REFERENCES ut_execution_items(id),
 user_id text NOT NULL REFERENCES ut_users(id), cycle integer NOT NULL,
 note text NOT NULL, filename text NOT NULL, mime text NOT NULL, content bytea NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(item_id,user_id,cycle)
);
CREATE TABLE IF NOT EXISTS ut_execution_reviews (
 id text PRIMARY KEY, item_id text NOT NULL REFERENCES ut_execution_items(id),
 reviewer_id text NOT NULL REFERENCES ut_users(id), cycle integer NOT NULL,
 stage text NOT NULL CHECK(stage IN ('FIRST','FINAL')), decision text NOT NULL CHECK(decision IN ('APPROVED','REJECTED')),
 remarks text NOT NULL DEFAULT '', created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(item_id,cycle,stage)
);
CREATE INDEX IF NOT EXISTS ut_execution_items_department ON ut_execution_items(department_id);
CREATE INDEX IF NOT EXISTS ut_execution_items_assignees ON ut_execution_items USING gin(assignee_ids);
DO $$ DECLARE tab text; BEGIN
 FOREACH tab IN ARRAY ARRAY['ut_execution_reviews','ut_execution_evidence'] LOOP
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname=tab||'_immutable' AND tgrelid=tab::regclass) THEN
   EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION ut_immutable_record()',tab||'_immutable',tab);
  END IF;
 END LOOP;
END $$;
INSERT INTO ut_schema_migrations(version) VALUES(6) ON CONFLICT DO NOTHING;
