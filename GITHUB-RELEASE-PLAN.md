# GitHub Release Plan — Version 1.0.0 RC1

**Status:** Prepared — **do not publish** until approved.

## Release identity

| Field | Value |
|-------|--------|
| Title | Kodikz Smart City Mapping & Survey Guidance — 1.0.0 RC1 |
| Tag | `v1.0.0-rc1` (already exists — do not recreate/move) |
| Target commit | Freeze `8612a33f03db738cffc0bfd6bd089abe3f8fd414` (plus approved post-freeze docs commits if tagged separately) |

## Release page body (draft)

```markdown
## Version 1.0.0 RC1

Internal pilot release for Dubai Municipality GISCD.

### Includes
- Plug-and-play package: `handover/RC1-1.0.0/`
- Operator Quick Start, Troubleshooting, Support Guide
- Acceptance checklist
- Release notes & known limitations
- Checksums: `handover/RC1-1.0.0/CHECKSUMS.sha256`
- Manifest: `handover/RC1-1.0.0/RELEASE-MANIFEST.json`

### Support
See OPERATOR-SUPPORT-GUIDE.md and RC1-HOTFIX-POLICY.md.
Hotfixes only for approved P0/P1 classes.

### Images
Canonical: `kodikz-smart-city-app:1.0.0-rc1` (REQUIRES DOCKER BUILD HOST for digests).

### Not included
Dubai VPS provisioning, DNS, TLS issuance (Dubai-owned).
```

## Attachments (when publishing)

- Optional: zipped `handover/RC1-1.0.0` **without** secrets/data/certs
- Do **not** attach `.env`, keys, or offline image tars containing private registry credentials

## Pre-publish checklist

- [ ] Collaborator invite approved
- [ ] Branch protection enabled
- [ ] Docs commits merged
- [ ] Checksums verified on package
- [ ] Release Manager approval recorded
