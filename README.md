# Sementes do Amanhã — Student Registration

Full-stack student registration system.

- Frontend: Vite + React (hosted on Vercel)
- Backend: Rust + Axum (hosted on Render)
- Database: PostgreSQL (Supabase)

## Features

- Student registration and editing (multi-student flow supported)
- Responsible parties validation (CPF normalization + duplicate checks)
- Contract PDF generation on the backend (download endpoint)
- Basic admin stats and audit events
- Fallback mode for API/database connectivity (see below)

## Local Development

### Requirements

- Node.js 18+
- Rust (stable) + Cargo
- PostgreSQL (local) or a Supabase PostgreSQL connection string

### Backend (Rust)

1. From the repository root:

```bash
cd backend
```

2. Create a `backend/.env` (not committed) with at least:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sementes_amanha
```

Optional database fallback (used only if the primary connection fails at startup):

```env
DATABASE_URL_FALLBACK=postgresql://postgres:postgres@localhost:5432/sementes_amanha_backup
```

3. Create tables using the schema at `db/database.sql`.

4. Run:

```bash
cargo run
```

Healthcheck:

- http://localhost:3000/health

### Frontend (Vite + React)

1. From the repository root:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm ci
```

3. Create a `frontend/.env` (not committed):

```env
VITE_API_URL=http://localhost:3000
VITE_API_URL_FALLBACK=http://localhost:3000
```

4. Run:

```bash
npm run dev
```

Open:

- http://localhost:5173

## Fallback / Backup Behavior

### Frontend → Backend

The frontend tries these API base URLs in order:

1. `VITE_API_URL`
2. `VITE_API_URL_FALLBACK`
3. `http://localhost:3000`

For GET requests, if it receives 502/503/504, it automatically retries using the next URL.

### Backend → Database

The backend connects at startup using:

1. `DATABASE_URL`
2. `DATABASE_URL_FALLBACK` or `LOCAL_DATABASE_URL` (optional)

If the primary fails, it tries the fallback; if both fail, the process exits.

## Documentation

- PT-BR guide: [docs/README.md](docs/README.md)
