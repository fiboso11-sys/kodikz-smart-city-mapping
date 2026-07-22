# Release Backup Plan — DO NOT EXECUTE IN THIS PHASE

Immutable backup steps for Release Manager (after approved commit/push):

1. **Verify RC1 tag**
   ```bash
   git fetch --tags
   git rev-list -n 1 v1.0.0-rc1
   # expect: 8612a33f03db738cffc0bfd6bd089abe3f8fd414
   ```

2. **Create repository archive (annotated)**
   ```bash
   git archive --format=zip -o kodikz-rc1-1.0.0-source.zip v1.0.0-rc1
   # After Phase 5.6–5.8 commit is tagged or noted:
   git archive --format=zip -o kodikz-rc1-handover-tree.zip HEAD
   ```

3. **Verify release package**
   ```bash
   cd handover/RC1-1.0.0
   sha256sum -c CHECKSUMS.sha256
   cat VERSION RELEASE-MANIFEST.json
   ```

4. **Store immutable backup**
   - Store zip + checksums + VERSION snapshot in Kodikz controlled backup (offline + cloud)
   - Record retention owner and location in release ticket
   - Do **not** store `.env`, certs, or support bundles with secrets in the same public share

5. **Optional:** mirror tag to internal backup remote (Kodikz-only)

**This phase does not create archives or push.**
