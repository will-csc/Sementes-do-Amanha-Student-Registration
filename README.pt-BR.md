# Sementes do Amanhã — Cadastro de Alunos

Sistema full-stack para cadastro e gestão de alunos.

- Frontend: Vite + React (Vercel)
- Backend: Rust + Axum (Render)
- Banco: PostgreSQL (Supabase)

## Funcionalidades

- Cadastro e edição de alunos (suporte a cadastro de múltiplos alunos)
- Validação de responsáveis (normalização de CPF + bloqueio de duplicidade)
- Geração de contrato em PDF no backend (endpoint de download)
- Estatísticas e auditoria (eventos de create/update/delete)
- Fallback de conectividade (API e banco)

## Desenvolvimento local

### Requisitos

- Node.js 18+
- Rust (stable) + Cargo
- PostgreSQL local ou string de conexão do Supabase (PostgreSQL)

### Backend

1. No root do repositório:

```bash
cd backend
```

2. Crie `backend/.env` (não versionado) com:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sementes_amanha
```

Fallback opcional (usado apenas se o primary falhar ao iniciar):

```env
DATABASE_URL_FALLBACK=postgresql://postgres:postgres@localhost:5432/sementes_amanha_backup
```

3. Crie as tabelas com `db/database.sql`.

4. Rode:

```bash
cargo run
```

Healthcheck:

- http://localhost:3000/health

### Frontend

1. No root do repositório:

```bash
cd frontend
```

2. Instale dependências:

```bash
npm ci
```

3. Crie `frontend/.env` (não versionado):

```env
VITE_API_URL=http://localhost:3000
VITE_API_URL_FALLBACK=http://localhost:3000
```

4. Rode:

```bash
npm run dev
```

Abra:

- http://localhost:5173

## Fallback / Backup

### Frontend → Backend

O frontend tenta, nesta ordem:

1. `VITE_API_URL`
2. `VITE_API_URL_FALLBACK`
3. `http://localhost:3000`

Em requisições GET, se receber 502/503/504, ele tenta automaticamente o próximo.

### Backend → Banco

O backend tenta conectar ao iniciar:

1. `DATABASE_URL`
2. `DATABASE_URL_FALLBACK` ou `LOCAL_DATABASE_URL` (opcional)

Se o primary falhar, tenta o fallback; se ambos falharem, encerra.

## Tutorial completo

- Veja [docs/README.md](docs/README.md)
