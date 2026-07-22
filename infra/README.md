# Local infrastructure

Compose profile for PostgreSQL, product BFF, worker, web, and Mailpit
(fake SMTP for Phase B invites).

```bash
# from repo root
docker compose -f infra/docker-compose.yml up
```

Services:

| Service | Port | Notes |
|---------|------|-------|
| web | 3000 | Next.js Forge UI |
| api | 3001 | Product BFF (`/health`, `/ready`) |
| worker | — | pg-boss against Postgres |
| postgres | 5432 | `stamped` / `stamped` / `stamped_l6` |
| mailpit | 1025 SMTP · 8025 UI | Dev email capture |

Copy `.env.example` to `.env` before starting. Public customer `/v1` is not
served by this profile.
