# BP Tracker Admin

Admin panel web interface for BP Tracker. Built with Vue 3, TypeScript, Pinia, vue-router, and custom CSS.

## Purpose

Provides administrative management and monitoring for BP Tracker services:
- Tables (/tables)
- Statistics (/stats)
- Logs (/logs)
- Settings (/settings)
- OCR recognition (/ocr)

Authentication is handled via Passkeys (WebAuthn) and Magic Links against the BP Tracker FastAPI backend, requiring administrator privileges (`is_admin: true`).

## Local Development

Install dependencies:
```bash
npm install
```

Start the Vite development server with the `/api` proxy:
```bash
npm run dev
```

By default, `/api` proxies to `https://api2-bptracker-dev.home.vn.ua` (configurable via `VITE_API_PROXY_TARGET`).

Type checking and production build:
```bash
npm run type-check
npm run build
```

## Running in Container

Build and run using Docker Compose:
```bash
docker compose up -d
```
The application will be accessible at `http://localhost:8095` (or custom `$ADMIN_PORT`).

Or build and run the Docker container directly:
```bash
docker build -t bpt-admin .
docker run -d -p 8095:80 -e API_URL=https://api2-bptracker-dev.home.vn.ua bpt-admin
```
