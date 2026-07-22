# Diagnostics Export Decision

## Decision

**2. SERVER-SIDE SUPPORT BUNDLE ONLY**

## Evidence

1. Dubai operators already own the host and the plug-and-play script surface; `support.sh` collects the required operational artifacts with sanitization, size limits, and `600` permissions.
2. Platform Settings routes are not globally middleware-gated; an in-app “Export Diagnostics” download would widen the browser attack surface for little gain over `support.sh`.
3. Preferred safe content (health, version, manifest, host resources, bounded logs) is already covered by the server-side bundle.
4. Application UI still exposes **read-only** About / System Health for release visibility without shipping file downloads of logs.

## Operator path

```bash
./scripts/status.sh
./scripts/support.sh
```

Transmit `support-bundles/kodikz-support-bundle-*.tar.gz` per `OPERATOR-SUPPORT-GUIDE.md`.
