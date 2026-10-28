-- Reference PostgreSQL design, not applied to current D1 implementation.
-- Full service migrations must connect production budget, grants, artifact and tenant authorities.
CREATE SCHEMA IF NOT EXISTS agentos;
CREATE TABLE agentos.agents (
 tenant_id uuid NOT NULL, agent_id uuid NOT NULL, name text NOT NULL,
 template_digest text NOT NULL, specialization text NOT NULL,
 generation bigint NOT NULL CHECK(generation>0), resource_version bigint NOT NULL CHECK(resource_version>0),
 lifecycle text NOT NULL CHECK(lifecycle IN ('Created','Learning','Active','Dormant','Archived','Retired','Destroyed')),
 owner_id uuid NOT NULL, spec jsonb NOT NULL, status jsonb NOT NULL,
 PRIMARY KEY(tenant_id,agent_id)
);
CREATE TABLE agentos.objectives (
 tenant_id uuid NOT NULL, objective_id uuid NOT NULL, root_run_id uuid NOT NULL,
 owner_id uuid NOT NULL, version bigint NOT NULL CHECK(version>0), state text NOT NULL,
 context_manifest uuid NOT NULL, budget_reservation_id uuid NOT NULL, spec jsonb NOT NULL,
 PRIMARY KEY(tenant_id,objective_id)
);
CREATE TABLE agentos.tasks (
 tenant_id uuid NOT NULL, task_id uuid NOT NULL, objective_id uuid NOT NULL,
 state text NOT NULL, resource_version bigint NOT NULL CHECK(resource_version>0),
 priority integer NOT NULL CHECK(priority BETWEEN 0 AND 100), ready_at timestamptz,
 deadline timestamptz NOT NULL, task_class text NOT NULL, spec jsonb NOT NULL,
 PRIMARY KEY(tenant_id,task_id),
 FOREIGN KEY(tenant_id,objective_id) REFERENCES agentos.objectives(tenant_id,objective_id)
);
CREATE TABLE agentos.task_dependencies (
 tenant_id uuid NOT NULL, task_id uuid NOT NULL, predecessor_id uuid NOT NULL,
 required_output_digest text NOT NULL,
 PRIMARY KEY(tenant_id,task_id,predecessor_id), CHECK(task_id<>predecessor_id),
 FOREIGN KEY(tenant_id,task_id) REFERENCES agentos.tasks(tenant_id,task_id),
 FOREIGN KEY(tenant_id,predecessor_id) REFERENCES agentos.tasks(tenant_id,task_id)
);
CREATE TABLE agentos.attempts (
 tenant_id uuid NOT NULL, attempt_id uuid NOT NULL, task_id uuid NOT NULL, agent_id uuid NOT NULL,
 agent_generation bigint NOT NULL, authority_epoch bigint NOT NULL,
 fencing_token bigint NOT NULL CHECK(fencing_token>0), cancel_generation bigint NOT NULL,
 state text NOT NULL, lease_expires_at timestamptz NOT NULL,
 input_digest text NOT NULL, output_digest text, reservation_id uuid NOT NULL,
 PRIMARY KEY(tenant_id,attempt_id), UNIQUE(tenant_id,task_id,fencing_token),
 FOREIGN KEY(tenant_id,task_id) REFERENCES agentos.tasks(tenant_id,task_id),
 FOREIGN KEY(tenant_id,agent_id) REFERENCES agentos.agents(tenant_id,agent_id)
);
CREATE UNIQUE INDEX one_active_attempt ON agentos.attempts(tenant_id,task_id)
 WHERE state IN ('claimed','running','awaiting_review','reconcile_unknown');
CREATE TABLE agentos.messages (
 tenant_id uuid NOT NULL, message_id uuid NOT NULL, sender_id uuid NOT NULL,
 sender_generation bigint NOT NULL, channel text NOT NULL, sequence bigint NOT NULL,
 kind text NOT NULL, artifact_ref uuid NOT NULL, envelope jsonb NOT NULL,
 occurred_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
 PRIMARY KEY(tenant_id,message_id), UNIQUE(tenant_id,sender_id,sender_generation,channel,sequence)
);
CREATE TABLE agentos.credit_entries (
 tenant_id uuid NOT NULL, transaction_id uuid NOT NULL, agent_id uuid NOT NULL,
 contribution_id uuid NOT NULL, reward_policy text NOT NULL,
 amount bigint NOT NULL CHECK(amount<>0), reason text NOT NULL, reversal_of uuid,
 occurred_at timestamptz NOT NULL,
 PRIMARY KEY(tenant_id,transaction_id), UNIQUE(tenant_id,contribution_id,reward_policy),
 FOREIGN KEY(tenant_id,agent_id) REFERENCES agentos.agents(tenant_id,agent_id),
 FOREIGN KEY(tenant_id,reversal_of) REFERENCES agentos.credit_entries(tenant_id,transaction_id)
);
CREATE INDEX ready_tasks ON agentos.tasks(tenant_id,task_class,priority DESC,ready_at) WHERE state='ready';
CREATE INDEX agent_lifecycle ON agentos.agents(tenant_id,lifecycle,specialization);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['agents','objectives','tasks','task_dependencies','attempts','messages','credit_entries'] LOOP
  EXECUTE format('ALTER TABLE agentos.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('ALTER TABLE agentos.%I FORCE ROW LEVEL SECURITY',t);
  EXECUTE format('CREATE POLICY tenant_isolation ON agentos.%I USING (tenant_id = nullif(current_setting(''omni.tenant_id'',true),'''')::uuid) WITH CHECK (tenant_id = nullif(current_setting(''omni.tenant_id'',true),'''')::uuid)',t);
 END LOOP;
END $$;
-- Atomic claim procedure, DAG validation, generation/fence checking, action-level ABAC,
-- ledger reversal uniqueness and lifecycle guards remain mandatory service implementations.
-- Reconcile_unknown retains active ownership until outcome is safely reconciled.
-- Trusted non-BYPASSRLS roles set transaction-local tenant context after authentication.
