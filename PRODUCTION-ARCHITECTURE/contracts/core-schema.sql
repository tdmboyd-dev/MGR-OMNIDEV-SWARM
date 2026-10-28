-- Target PostgreSQL design reference; not applied to the current D1 database.
-- Identity/project action validation remains required beyond tenant RLS.
CREATE SCHEMA omni;
CREATE TABLE omni.tenants (
 tenant_id uuid PRIMARY KEY, name text NOT NULL, residency text NOT NULL,
 home_cell text NOT NULL, authority_epoch bigint NOT NULL CHECK(authority_epoch>0),
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE omni.projects (
 tenant_id uuid NOT NULL, project_id uuid NOT NULL, workspace_id uuid NOT NULL,
 name text NOT NULL, home_cell text NOT NULL, revision bigint NOT NULL DEFAULT 1,
 classification text NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,project_id), FOREIGN KEY(tenant_id) REFERENCES omni.tenants
);
CREATE TABLE omni.artifacts (
 tenant_id uuid NOT NULL, artifact_id uuid NOT NULL, project_id uuid NOT NULL,
 digest text NOT NULL, object_ref text NOT NULL, media_type text NOT NULL,
 bytes bigint NOT NULL CHECK(bytes>=0), classification text NOT NULL,
 provenance jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,artifact_id), FOREIGN KEY(tenant_id,project_id) REFERENCES omni.projects
);
CREATE TABLE omni.agents (
 tenant_id uuid NOT NULL, agent_id uuid NOT NULL, project_id uuid NOT NULL,
 parent_agent_id uuid, template_digest text NOT NULL, specialization text NOT NULL,
 state text NOT NULL, revision bigint NOT NULL DEFAULT 1,
 memory_scope jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(tenant_id,agent_id), FOREIGN KEY(tenant_id,project_id) REFERENCES omni.projects,
 FOREIGN KEY(tenant_id,parent_agent_id) REFERENCES omni.agents,
 CHECK(agent_id IS DISTINCT FROM parent_agent_id)
);
CREATE INDEX agents_lineage ON omni.agents(tenant_id,parent_agent_id,agent_id);
CREATE TABLE omni.runs (
 tenant_id uuid NOT NULL, run_id uuid NOT NULL, project_id uuid NOT NULL,
 root_agent_id uuid, source_digest text NOT NULL, objective text NOT NULL,
 policy_digest text NOT NULL, authority_epoch bigint NOT NULL, state text NOT NULL,
 revision bigint NOT NULL DEFAULT 1, deadline timestamptz NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,run_id),
 FOREIGN KEY(tenant_id,project_id) REFERENCES omni.projects,
 FOREIGN KEY(tenant_id,root_agent_id) REFERENCES omni.agents
);
CREATE INDEX runs_project_state ON omni.runs(tenant_id,project_id,state,created_at,run_id);
CREATE TABLE omni.tasks (
 tenant_id uuid NOT NULL, task_id uuid NOT NULL, run_id uuid NOT NULL,
 parent_task_id uuid, agent_id uuid, task_class text NOT NULL, state text NOT NULL,
 input_digest text NOT NULL, output_artifact_id uuid, attempt integer NOT NULL DEFAULT 0,
 fencing_token bigint NOT NULL DEFAULT 0, lease_owner text, lease_until timestamptz,
 authority_epoch bigint NOT NULL, revision bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,task_id),
 FOREIGN KEY(tenant_id,run_id) REFERENCES omni.runs,
 FOREIGN KEY(tenant_id,parent_task_id) REFERENCES omni.tasks,
 FOREIGN KEY(tenant_id,agent_id) REFERENCES omni.agents,
 FOREIGN KEY(tenant_id,output_artifact_id) REFERENCES omni.artifacts,
 CHECK(attempt>=0), CHECK(task_id IS DISTINCT FROM parent_task_id)
);
CREATE INDEX tasks_admission ON omni.tasks(tenant_id,state,lease_until,created_at,task_id);
CREATE TABLE omni.approvals (
 tenant_id uuid NOT NULL, approval_id uuid NOT NULL, project_id uuid NOT NULL,
 principal_id uuid NOT NULL, action text NOT NULL, target_ref text NOT NULL,
 artifact_digest text NOT NULL, plan_digest text NOT NULL, policy_digest text NOT NULL,
 grant_epoch bigint NOT NULL, expires_at timestamptz NOT NULL, revoked_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,approval_id),
 FOREIGN KEY(tenant_id,project_id) REFERENCES omni.projects
);
CREATE TABLE omni.operations (
 tenant_id uuid NOT NULL, operation_id uuid NOT NULL, project_id uuid NOT NULL,
 principal_id uuid NOT NULL, action text NOT NULL, target_ref text NOT NULL,
 idempotency_key text NOT NULL, payload_digest text NOT NULL, authority_epoch bigint NOT NULL,
 state text NOT NULL CHECK(state IN ('accepted','dispatched','reconciling','succeeded','failed','compensated','canceled')),
 approval_id uuid, provider_receipt_ref text, revision bigint NOT NULL DEFAULT 1,
 created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,operation_id),
 UNIQUE(tenant_id,principal_id,action,target_ref,idempotency_key),
 FOREIGN KEY(tenant_id,project_id) REFERENCES omni.projects,
 FOREIGN KEY(tenant_id,approval_id) REFERENCES omni.approvals
);
CREATE TABLE omni.budgets (
 tenant_id uuid NOT NULL, budget_id uuid NOT NULL, scope_ref text NOT NULL,
 currency char(3) NOT NULL, ceiling_micro numeric(20,0) NOT NULL,
 reserved_micro numeric(20,0) NOT NULL DEFAULT 0, settled_micro numeric(20,0) NOT NULL DEFAULT 0,
 revision bigint NOT NULL DEFAULT 1, PRIMARY KEY(tenant_id,budget_id),
 CHECK(ceiling_micro>=0 AND reserved_micro>=0 AND settled_micro>=0),
 CHECK(reserved_micro+settled_micro<=ceiling_micro)
);
CREATE TABLE omni.reservations (
 tenant_id uuid NOT NULL, reservation_id uuid NOT NULL, budget_id uuid NOT NULL,
 root_run_id uuid NOT NULL, operation_ref text NOT NULL, currency char(3) NOT NULL,
 maximum_micro numeric(20,0) NOT NULL CHECK(maximum_micro>=0),
 settled_micro numeric(20,0) NOT NULL DEFAULT 0 CHECK(settled_micro>=0),
 state text NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(tenant_id,reservation_id), UNIQUE(tenant_id,root_run_id,operation_ref),
 FOREIGN KEY(tenant_id,budget_id) REFERENCES omni.budgets,
 FOREIGN KEY(tenant_id,root_run_id) REFERENCES omni.runs
);
CREATE TABLE omni.usage_receipts (
 tenant_id uuid NOT NULL, receipt_id uuid NOT NULL, reservation_id uuid NOT NULL,
 provider text NOT NULL, provider_request_id text NOT NULL, rate_card_digest text NOT NULL,
 quantities jsonb NOT NULL, currency char(3) NOT NULL, cost_micro numeric(20,0) NOT NULL CHECK(cost_micro>=0),
 observed_at timestamptz NOT NULL, evidence_digest text NOT NULL,
 PRIMARY KEY(tenant_id,receipt_id), UNIQUE(tenant_id,provider,provider_request_id),
 FOREIGN KEY(tenant_id,reservation_id) REFERENCES omni.reservations
);
CREATE TABLE omni.ledger_entries (
 tenant_id uuid NOT NULL, entry_id uuid NOT NULL, journal_group_id uuid NOT NULL,
 account_ref text NOT NULL, currency char(3) NOT NULL, amount_micro numeric(20,0) NOT NULL,
 receipt_id uuid, correction_of uuid, posted_at timestamptz NOT NULL,
 PRIMARY KEY(tenant_id,entry_id), FOREIGN KEY(tenant_id,receipt_id) REFERENCES omni.usage_receipts,
 FOREIGN KEY(tenant_id,correction_of) REFERENCES omni.ledger_entries
);
CREATE INDEX ledger_groups ON omni.ledger_entries(tenant_id,journal_group_id,currency);
-- Production ledger service additionally enforces immutable balanced journal groups
-- via a posting procedure/deferred constraints and restrictive write privileges.
-- This reference deliberately does not pretend a row CHECK proves group balance.
CREATE TABLE omni.outbox (
 tenant_id uuid NOT NULL, event_id uuid NOT NULL, aggregate_id uuid NOT NULL,
 aggregate_version bigint NOT NULL, event_type text NOT NULL, schema_version integer NOT NULL,
 envelope jsonb NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), published_at timestamptz,
 PRIMARY KEY(tenant_id,event_id), UNIQUE(tenant_id,aggregate_id,aggregate_version,event_type)
);
CREATE INDEX outbox_unpublished ON omni.outbox(created_at,event_id) WHERE published_at IS NULL;
CREATE TABLE omni.consumer_inbox (
 tenant_id uuid NOT NULL, consumer_name text NOT NULL, event_id uuid NOT NULL,
 processed_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(tenant_id,consumer_name,event_id)
);
DO $$ DECLARE n text; BEGIN
 FOR n IN SELECT tablename FROM pg_tables WHERE schemaname='omni' LOOP
  EXECUTE format('ALTER TABLE omni.%I ENABLE ROW LEVEL SECURITY',n);
  EXECUTE format('ALTER TABLE omni.%I FORCE ROW LEVEL SECURITY',n);
  EXECUTE format('CREATE POLICY tenant_scope ON omni.%I USING (tenant_id = NULLIF(current_setting(''omni.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = NULLIF(current_setting(''omni.tenant_id'',true),'''')::uuid)',n);
 END LOOP;
END $$;
-- Service roles must not own these tables or have BYPASSRLS. No public grants.
-- Trusted service transactions set SET LOCAL omni.tenant_id after authentication.
-- Fencing, graph cycle prevention, project scope and policy require service checks.
