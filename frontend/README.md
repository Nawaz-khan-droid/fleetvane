# FleetVane Frontend

Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS v4 client for FleetVane.

See the [root README](../README.md) for full project overview, setup, and architecture.

## Structure

- `src/app/` — App Router pages; thin API route handlers proxying to the Spring Boot backend
- `src/views/` — role consoles: `manager/`, `driver/`, `client/`, plus auth & landing
- `src/components/` — shadcn/ui primitives (`ui/`) and shared widgets
- `src/context/AuthContext.tsx` — JWT session management with single-flight refresh
- `src/lib/` — Axios instance, Google Maps singleton loader, backend URL helpers

## Commands

```bash
npm install          # install dependencies
npm run dev          # dev server on :3000
npx tsc --noEmit     # strict typecheck
npm run build        # production build (typecheck enforced)
```

## Required env

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Map rendering |
| `NEXT_PUBLIC_SPRING_BOOT_URL` | Spring Boot base URL (default `http://localhost:8080`) |

`NEXT_PUBLIC_*` values are compiled into the client bundle and are public by design.
