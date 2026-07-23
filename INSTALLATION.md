# Installation Guide

## Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 20.x LTS or newer |
| pnpm | 10.x (see `packageManager` in `package.json`) |
| Git | 2.x |

## Clone

```bash
git clone https://github.com/fiboso11-sys/kodikz-smart-city-mapping.git
cd kodikz-smart-city-mapping
# RC1 collaboration line (preferred):
git checkout phase2/dubai-giscd-enhancements
# Or after merge: follow the protected default / release branch named by Release Manager
```

Install and run from the **repository root** only (not any nested app folders).

## Install

```bash
pnpm install
```

> `better-sqlite3` is a native module. On Windows, if install fails, ensure Visual Studio Build Tools are available.

## Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if pointing to a non-default GPS backend. See [ENVIRONMENT.md](./ENVIRONMENT.md).

## Build

```bash
pnpm type-check
pnpm build
```

**Windows EPERM on `.next/trace`:**

```powershell
$env:NEXT_DIST_DIR = ".next-release"
pnpm build
pnpm start
```

## Run

**Development (with demo seed data):**

```bash
pnpm dev
```

**Production:**

```bash
pnpm start
# or: pnpm start --port 3000
```

Open **http://localhost:3000/dashboard**

## Verify

| Check | URL / Command |
|-------|----------------|
| Dashboard loads | http://localhost:3000/dashboard |
| System health | http://localhost:3000/api/system-health |
| Vehicles API | http://localhost:3000/api/vehicles |
| GPS connection | Header shows GPS CONNECTED when backend is reachable |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `better-sqlite3` not found | Run `pnpm install` again; check `pnpm.onlyBuiltDependencies` |
| Map tiles blank | Check internet; CARTO tiles require outbound HTTPS |
| GPS disconnected | Verify `NEXT_PUBLIC_API_URL` and VPS backend health |
| Client-side crash after rebuild | Stop server, rebuild, restart (`pnpm start`) |
| Empty fleet in production | Expected — seed runs only in `NODE_ENV=development` |
