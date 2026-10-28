-- PostgreSQL reference design; not a migration applied to the current D1 app.
-- Trusted service sets SET LOCAL omni.tenant_id after authenticating each transaction.
-- Tenant/project FKs reference production authority; credentials/roles/grants excluded here.
CREATE SCHEMA IF NOT EXISTS knowledge;
CREATE TABLE knowledge.entities (
 tenant_id uuid NOT NULL, entity_id uuid NOT NULL, kind text NOT NULL,
 source_namespace text NOT NULL, external_key text NOT NULL,
 identity_version integer NOT NULL CHECK(identity_version > 0),
 home_partition text NOT NULL, lifecycle text NOT NULL,
 PRIMARY KEY(tenant_id,entity_id), UNIQUE(tenant_id,source_namespace,external_key)
);
CREATE TABLE knowledge.evidence (
 tenant_id uuid NOT NULL, evidence_id uuid NOT NULL, artifact_id uuid NOT NULL,
 digest text NOT NULL CHECK(digest ~ '^sha256:[a-f0-9]{64}$'),
 selector jsonb NOT NULL, producer text NOT NULL, method text NOT NULL,
 access_policy_id uuid NOT NULL, retention_policy_id uuid NOT NULL,
 PRIMARY KEY(tenant_id,evidence_id)
);
CREATE TABLE knowledge.assertions (
 tenant_id uuid NOT NULL, assertion_id uuid NOT NULL, subject_id uuid NOT NULL,
 predicate text NOT NULL, object_id uuid, literal_value jsonb, context_id uuid NOT NULL,
 modality text NOT NULL CHECK(modality IN ('observed','human_asserted','inferred','predicted')),
 status text NOT NULL CHECK(status IN ('proposed','accepted','disputed','superseded','retracted')),
 valid_range tstzrange NOT NULL, recorded_range tstzrange NOT NULL,
 access_policy_id uuid NOT NULL, source_revision text NOT NULL,
 confidence_record jsonb NOT NULL,
 PRIMARY KEY(tenant_id,assertion_id),
 FOREIGN KEY(tenant_id,subject_id) REFERENCES knowledge.entities(tenant_id,entity_id),
 FOREIGN KEY(tenant_id,object_id) REFERENCES knowledge.entities(tenant_id,entity_id),
 CHECK((object_id IS NOT NULL) <> (literal_value IS NOT NULL)),
 CHECK(NOT isempty(valid_range) AND lower(valid_range) IS NOT NULL),
 CHECK(NOT isempty(recorded_range) AND lower(recorded_range) IS NOT NULL)
);
CREATE TABLE knowledge.assertion_evidence (
 tenant_id uuid NOT NULL, assertion_id uuid NOT NULL, evidence_id uuid NOT NULL,
 PRIMARY KEY(tenant_id,assertion_id,evidence_id),
 FOREIGN KEY(tenant_id,assertion_id) REFERENCES knowledge.assertions(tenant_id,assertion_id),
 FOREIGN KEY(tenant_id,evidence_id) REFERENCES knowledge.evidence(tenant_id,evidence_id)
);
CREATE TABLE knowledge.memories (
 tenant_id uuid NOT NULL, memory_id uuid NOT NULL, layer smallint NOT NULL CHECK(layer BETWEEN 1 AND 8),
 scope_id uuid NOT NULL, memory_kind text NOT NULL, modality text NOT NULL,
 state text NOT NULL, content_artifact uuid NOT NULL, created_by uuid NOT NULL,
 created_at timestamptz NOT NULL, valid_range tstzrange NOT NULL, recorded_range tstzrange NOT NULL,
 access_policy_id uuid NOT NULL, retention_policy_id uuid NOT NULL,
 consent_basis text NOT NULL, retrieval_generation bigint NOT NULL CHECK(retrieval_generation>0),
 PRIMARY KEY(tenant_id,memory_id)
);
CREATE TABLE knowledge.decisions (
 tenant_id uuid NOT NULL, decision_id uuid NOT NULL, revision integer NOT NULL CHECK(revision>0),
 memory_id uuid NOT NULL, title text NOT NULL, status text NOT NULL,
 problem text NOT NULL, proposer uuid NOT NULL, accountable_decider uuid,
 decided_at timestamptz, effective_at timestamptz, alternatives jsonb NOT NULL,
 selected_option text, rationale text, risks jsonb NOT NULL, expected_outcomes jsonb NOT NULL,
 actual_outcomes jsonb NOT NULL, lessons jsonb NOT NULL, verification_plan jsonb NOT NULL,
 supersedes_id uuid,
 PRIMARY KEY(tenant_id,decision_id,revision),
 FOREIGN KEY(tenant_id,memory_id) REFERENCES knowledge.memories(tenant_id,memory_id)
);
CREATE INDEX assertion_subject_context ON knowledge.assertions(tenant_id,subject_id,predicate,context_id);
CREATE INDEX assertion_valid_time ON knowledge.assertions USING gist(valid_range);
CREATE INDEX assertion_recorded_time ON knowledge.assertions USING gist(recorded_range);
CREATE INDEX memory_scope_layer ON knowledge.memories(tenant_id,scope_id,layer,created_at);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['entities','evidence','assertions','assertion_evidence','memories','decisions'] LOOP
  EXECUTE format('ALTER TABLE knowledge.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE knowledge.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_isolation ON knowledge.%I USING (tenant_id = nullif(current_setting(''omni.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''omni.tenant_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
-- Production must additionally enforce source-policy/endpoint permission intersection,
-- nonempty evidence admission, context FKs, version supersession, decision state transitions,
-- temporal half-open intervals and immutable history via trusted procedures/roles.
-- Tenant RLS does not replace project/resource ABAC or protect from privileged BYPASSRLS roles.
