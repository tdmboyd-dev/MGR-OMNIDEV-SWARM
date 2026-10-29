declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OMNI_VAULT_KEY?: string;
    OMNI_WORKER_TOKEN?: string;
    OMNI_TRILOGY_SCOPE?: string;
    OMNI_TRILOGY_OWNER_TOKEN?: string;
    OMNI_TRILOGY_BRIDGE_TOKEN?: string;
    OMNI_TRILOGY_READ_TOKEN?: string;
    OMNI_TRILOGY_READ_JOB_ID?: string;
    OMNI_TRILOGY_VERIFIER_ID?: string;
    OMNI_TRILOGY_VERIFIER_PUBLIC_KEY?: string;
    OMNI_TRILOGY_VERIFIER_REVOKED?: string;
    BUCKET?: R2Bucket;
  }
}
