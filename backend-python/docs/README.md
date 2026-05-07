# Tutorial de inicialização (Frontend + Backend)

## Arquitetura (produção)

- Frontend: Vercel (Vite + React)
- Backend: Render (Rust + Axum)
- Banco de dados: Supabase (PostgreSQL)

## Pré-requisitos (local)

- Node.js 18+ (com npm)
- Rust (stable) + Cargo
- PostgreSQL (local) ou credenciais do Supabase (PostgreSQL)

## Rodar o Backend localmente

1. Abra um terminal na pasta do projeto e entre no backend:

```bash
cd backend
```

2. Configure as variáveis de ambiente.

O backend lê `.env` automaticamente (pasta `backend/`) e também aceita variáveis do sistema.

Exemplo:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/sementes_amanha
DATABASE_URL_FALLBACK=postgresql://postgres:postgres@localhost:5432/sementes_amanha_backup
```

3. Prepare o banco (local):

- Crie um banco PostgreSQL.
- Execute o schema em `db/database.sql` no seu PostgreSQL.

4. Suba o servidor:

```bash
cargo run
```

5. Teste o healthcheck:

- http://localhost:3000/health

## Rodar o Frontend localmente

1. Abra outro terminal e entre no frontend:

```bash
cd frontend
```

2. Instale dependências:

```bash
npm ci
```

3. Configure as variáveis do Vite:

Exemplo:

```env
VITE_API_URL=http://localhost:3000
VITE_API_URL_FALLBACK=http://localhost:3000
```

4. Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

5. Abra no navegador (geralmente):

- http://localhost:5173

## Fallback/Backup de comunicação

### Frontend → Backend (fallback automático)

O frontend tenta acessar o backend usando:

1. `VITE_API_URL` (produção: URL do Render)
2. `VITE_API_URL_FALLBACK` (opcional; útil para desenvolvimento)
3. `http://localhost:3000` (padrão)

Comportamento:

- Requisições GET: se receber 502/503/504, tenta o próximo endpoint automaticamente.
- POST/PUT/DELETE: tenta fallback apenas se a requisição falhar por erro de rede (sem resposta), para reduzir risco de duplicidade.

### Backend → Banco (fallback no startup)

O backend conecta no banco ao iniciar:

1. `DATABASE_URL` (produção: Supabase/Postgres)
2. `DATABASE_URL_FALLBACK` ou `LOCAL_DATABASE_URL` (opcional)

Se `DATABASE_URL` falhar, o backend tenta o fallback; se ambos falharem, o processo encerra.

## Deploy (resumo)

### Vercel (Frontend)

- `VITE_API_URL=https://<seu-backend-no-render>`
- `VITE_API_URL_FALLBACK` pode ficar vazio ou apontar para outro ambiente de backup (não use localhost em produção).

### Render (Backend)

- `DATABASE_URL=postgresql://...` (Supabase)
- `DATABASE_URL_FALLBACK=postgresql://...` (opcional; outro Postgres acessível pelo Render)
