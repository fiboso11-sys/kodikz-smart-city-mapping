# Commit Plan — Phase 6.0 (DO NOT EXECUTE WITHOUT APPROVAL)

**Recommendation:** **Multiple logical commits** (clearer audit trail for Dubai/government review).

**Do not** move or recreate tag `v1.0.0-rc1`.  
**Do not** push in this phase.

---

## Commit 1 — Phase 5.6 Plug-and-Play

```
docs(release): finalize Phase 5.6 plug-and-play deployment package

Add handover/RC1-1.0.0 operator scripts, compose, config templates,
checksums, manifest, and Dubai operator guides for Version 1.0.0 RC1.
```

**Stage (illustrative):**
- `handover/RC1-1.0.0/**` (package scripts/docs/deploy/config/VERSION/checksums/manifest)
- `PHASE56-PLUG-AND-PLAY-DEPLOYMENT-READINESS.md`
- `RELEASE-ARTIFACT-STRATEGY.md` (if not in later commit)

---

## Commit 2 — Phase 5.7 Enterprise Operations

```
feat(ops): finalize Phase 5.7 enterprise operations and support surfaces

Add release identity, system-health/about ops visibility, support.sh
sanitization tooling, and enterprise support documentation for RC1.
```

**Stage:**
- `src/lib/release-identity.ts`
- `src/app/api/release-identity/`
- `src/app/api/system-health/route.ts`
- `src/app/(platform)/settings/about/`
- `src/app/(platform)/settings/page.tsx`
- `src/app/(platform)/settings/system-health/page.tsx`
- `src/components/layout/platform-shell.tsx`
- `src/lib/i18n/messages.ts`
- Ops markdown (`SYSTEM-HEALTH-*`, `ABOUT-*`, `DIAGNOSTIC-*`, `RC1-HOTFIX-POLICY.md`, `RELEASE-IDENTITY*`, `PHASE57-*`, etc.)
- Related handover script updates already under package if split carefully

> If handover scripts already contain 5.7 support.sh from the same tree, keep support scripts with Commit 1 **or** 2 — prefer **Commit 1 for all `handover/RC1-1.0.0/scripts`** and Commit 2 for `src/` + ops specs.

---

## Commit 3 — Phase 5.8 GitHub Collaboration

```
docs(github): finalize collaboration readiness for Dubai team

Add LICENSE, SECURITY, CHANGELOG, CODE_OF_CONDUCT, GitHub templates,
.gitignore hardening, CONTRIBUTING/README RC1 pointers, and collaboration policies.
```

**Stage:**
- `LICENSE`, `SECURITY.md`, `CHANGELOG.md`, `CODE_OF_CONDUCT.md`
- `.github/**` (templates, workflow, dependabot optional)
- `.gitignore`, `CONTRIBUTING.md`, `README.md`
- `BRANCH-PROTECTION-GUIDE.md`, `COLLABORATION-POLICY.md`, `ACCESS-CONTROL-MATRIX.md`, audits, `PHASE58-*`

---

## Commit 4 — Phase 5.9 / 6.0 Publication Prep

```
docs(release): finalize Phase 5.9–6.0 publication readiness

Add release manager checklists, Git validation, release draft,
commit plan, and pre-push certification for Version 1.0.0 RC1.
```

**Stage:**
- `PHASE59-*`, `PHASE60` outputs if any, `FINAL-*`, `GITHUB-RELEASE-DRAFT.md`, `COMMIT-PLAN.md`, `FINAL-WORKING-TREE-REVIEW.md`, `FINAL-RELEASE-MANAGER-CHECKLIST.md`, `POST-RELEASE-EXECUTION-PLAN.md`, etc.
- `next-env.d.ts`, `tsconfig.json` (tooling normalization)

---

## Alternate: Single commit

```
release(ops): finalize RC1 Phase 5.6–6.0 package, ops, and GitHub readiness

Prepare Version 1.0.0 RC1 handover package, enterprise operations
surfaces, and GitHub collaboration standards for Release Manager publish.
```

Use only if Release Manager prefers one squashable unit.

---

## Post-commit verification (Release Manager)

```bash
git status   # must be clean
git log --oneline -5
git rev-list -n 1 v1.0.0-rc1   # must remain 8612a33f03db738cffc0bfd6bd089abe3f8fd414
```
