declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    OMNI_VAULT_KEY?: string;
    OMNI_WORKER_TOKEN?: string;
    BUCKET?: R2Bucket;
  }
}
