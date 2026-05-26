# Kodikz Dubai Mapping

Dubai Municipality **Smart City GIS mapping** vehicle monitor — 24/7 visibility for survey fleets. Kodikz provides tracking hardware, this web app, and ongoing maintenance.

## Live app

**Production:** [https://kodikz-smart-city-mapping.vercel.app](https://kodikz-smart-city-mapping.vercel.app)

| Route | Purpose |
|-------|---------|
| `/` | Landing page |
| `/command` | Live Map |
| `/routes` | Routes |
| `/violations` | Violations |
| `/analytics` | Analytics |
| `/companies` | Companies |
| `/vehicles` | Vehicles |
| `/playback` | Playback |

## Local development

```bash
pnpm install
pnpm seed    # optional: regenerate public/data/*.json
pnpm dev     # http://localhost:3000
```

No map API key — uses [OpenFreeMap](https://openfreemap.org/) tiles.

## Deploy (Vercel)

```bash
pnpm run build
npx vercel deploy --prod --scope fiboso11-sys-projects
```

Project is linked as `kodikz-smart-city-mapping` on Vercel. Rename or add a custom domain in the [Vercel dashboard](https://vercel.com/fiboso11-sys-projects/kodikz-smart-city-mapping).
