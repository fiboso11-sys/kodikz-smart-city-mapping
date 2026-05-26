# Kodikz Smart City — Street Mapping Dashboard

Premium **frontend-only** Dubai Municipality fleet command center. No backend, database, or Docker required.

## Run

```bash
pnpm install
pnpm seed    # generates public/data/*.json (60 vehicles, 50 companies, routes, history)
pnpm dev     # http://localhost:3000
```

**No map API key required** — uses free [OpenFreeMap](https://openfreemap.org/) tiles (OpenStreetMap data).

## Architecture

```
src/providers/
  igps-provider.ts      → IGPSProvider interface
  simulator-provider.ts → 60 vehicles, 3s tick (default)
  teltonika-provider.ts → stub for future hardware
  factory.ts            → swap provider without UI changes

public/data/*.json      → seed data (companies, vehicles, routes, history)
src/store/              → Zustand + localStorage persistence
src/lib/geo.ts          → movement simulation
src/lib/violations.ts   → client-side rule engine
```

## Features

- Live Mapbox map with 60 simulated vehicles
- Route management (GeoJSON upload)
- Violation engine (OUT_OF_ROUTE, NO_SIGNAL, OVERSPEED, IDLE)
- Analytics dashboard
- Company & vehicle management
- Historical playback / time travel

## Future Teltonika

Set `providerKind` to `"teltonika"` in store — UI unchanged, `TeltonikaProvider` replaces `SimulatorProvider`.
