# AGENTS.md

## Project overview

HypeX is a multi-service material master and matching platform with separate frontend, backend, ML, and database layers:

- Frontend: `/frontend` — React + Vite app for dashboard, upload, review, mapping, and analytics views.
- Backend: `/backend` — Express API that exposes business endpoints and bootstraps the database.
- ML service: `/ml-service` — FastAPI service for normalization, extraction, embeddings, matching, and clustering.
- Database: `/database` — schema and seed scripts for the material ecosystem.

See the main project overview in [README.md](README.md).

## Working conventions

### Service boundaries
- Keep frontend API calls in `/frontend/src/services/api.js` and feature pages under `/frontend/src/pages`.
- Back-end routes should stay under `/backend/src/routes` and business logic under `/backend/src/services`.
- ML logic belongs under `/ml-service` and should preserve the FastAPI contract defined in `main.py` and the request/response schemas in `schemas.py`.
- Database creation and seeding logic lives in `/backend/src/config/db.js` and `/database/schema.sql`.

### Local environment assumptions
- Frontend defaults to `http://localhost:5000/api` unless `VITE_API_URL` is set.
- Backend defaults to port `5000` and initializes the database schema at startup.
- ML service defaults to port `8000` and is run independently from the backend.
- The backend expects MySQL to be available locally; if the database is unavailable, the app will log connection errors but the startup flow still loads as a Node process.

### Typical development flow
1. Install dependencies in each service independently.
2. Start the database and ensure MySQL is running.
3. Start the backend and ML service.
4. Start the frontend for UI testing.

## Commands

### Install dependencies
```bash
cd backend && npm install
cd frontend && npm install
cd ml-service && python -m venv .venv
```

On Windows PowerShell, activate the ML environment before installing packages:
```powershell
cd ml-service
. .venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### Run services
```bash
cd backend && npm run dev
cd frontend && npm run dev
cd ml-service && . .venv\Scripts\Activate.ps1 && uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Build frontend
```bash
cd frontend && npm run build
```

## Important implementation notes

- The backend database bootstrap is intentionally opinionated: it reads `/database/schema.sql` and seeds default users on first startup.
- The ML service is contract-driven; changes to endpoint payloads or matching thresholds can affect frontend and backend integration.
- Frontend pages are feature-oriented rather than component-first; follow the existing layout and service patterns when adding new screens or API interactions.
- When making changes across services, check for call-site compatibility before changing route names, status values, or response schemas.

## Files worth checking when editing

- [README.md](README.md)
- [backend/src/server.js](backend/src/server.js)
- [backend/src/config/db.js](backend/src/config/db.js)
- [backend/src/routes/api.js](backend/src/routes/api.js)
- [frontend/src/services/api.js](frontend/src/services/api.js)
- [ml-service/main.py](ml-service/main.py)
- [database/schema.sql](database/schema.sql)

## Principles for AI coding agents

- Prefer minimal, focused edits that preserve the existing service boundaries.
- Keep API contracts consistent across backend, frontend, and ML endpoints.
- Favor existing project patterns over introducing new frameworks or conventions.
- Validate each service independently when possible; do not assume the full app is healthy without checking the changed area.
- If a change affects user-facing behavior or matching logic, confirm the downstream consumers in the app and ML pipeline still agree on the contract.
