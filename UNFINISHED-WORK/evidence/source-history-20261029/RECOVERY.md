# Restore exact original local commit identities

This Git bundle is historical evidence. It preserves the commit IDs in older test receipts even though published GitHub commits retain the remote ancestry with identical file trees.

In a clone containing the public repository history, confirm prerequisite `c44818c5017d15139c294e971346b1152ed24ba1` exists before verification.

From the repository root:

```bash
git bundle verify UNFINISHED-WORK/evidence/source-history-20261029/verified-local-history.bundle
git fetch UNFINISHED-WORK/evidence/source-history-20261029/verified-local-history.bundle refs/heads/current:refs/remotes/recovery/original-local-20261029
```

The fetch creates a separate recovery ref and does not reset the active branch or worktree. Inspect the manifest for the captured head, exact commit/tree identities and original tested revisions. Fresh bare-repository recovery and strict Git integrity checks were executed successfully before publication. No tests or releases are implied by restoring history.
