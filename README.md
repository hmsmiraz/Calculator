# Branch 3 — Microservices Architecture

Transforms Branch 2 into a fully distributed microservices system.

```
Browser → API Gateway (:4000) → auth-service (:4001)
                              → calculator-service (:4002)
                              → user-service (:4003)
                                    ↕
                              PostgreSQL + Redis
```

---

## Project Structure

```
branch-3-calculator/
├── docker-compose.yml          ← orchestrates everything
├── init.sql                    ← DB schema auto-run on first boot
├── .gitignore
│
├── api-gateway/                ← Single entry point — port 4000
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── routes/proxy.routes.js       ← forwards to services
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js       ← JWT verify + blacklist check
│   │   │   └── rateLimit.middleware.js  ← Redis-backed rate limiting
│   │   └── utils/redis.js
│   ├── Dockerfile
│   └── package.json
│
├── auth-service/               ← Register / Login / Me — port 4001
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/   db.js + redis.js
│   │   ├── models/   user.model.js
│   │   ├── controllers/auth.controller.js
│   │   ├── routes/auth.routes.js
│   │   └── utils/jwt.utils.js
│   ├── Dockerfile
│   └── package.json
│
├── calculator-service/         ← Math + History — port 4002
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/   db.js + redis.js
│   │   ├── models/   calculation.model.js
│   │   ├── controllers/calculator.controller.js
│   │   ├── routes/calculator.routes.js
│   │   └── utils/calculator.utils.js
│   ├── Dockerfile
│   └── package.json
│
├── user-service/               ← Profile + Stats — port 4003
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/   db.js + redis.js
│   │   ├── controllers/user.controller.js
│   │   └── routes/user.routes.js
│   ├── Dockerfile
│   └── package.json
│
└── frontend/                   ← Next.js — port 3000
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── auth/login/page.tsx
    │   │   ├── auth/register/page.tsx
    │   │   └── dashboard/page.tsx
    │   ├── components/
    │   │   ├── calculator/
    │   │   │   ├── Calculator.tsx
    │   │   │   └── HistoryPanel.tsx
    │   │   └── ui/
    │   │       ├── Navbar.tsx
    │   │       └── StatsPanel.tsx
    │   ├── context/AuthContext.tsx
    │   ├── services/
    │   │   ├── calculator.service.ts
    │   │   └── user.service.ts
    │   └── types/index.ts
    ├── Dockerfile                ← no public/ folder copy (not needed)
    └── package.json
```

---

## Prerequisites — Install Docker

```bash
# Step 1 — Install Docker
sudo apt update
sudo apt install -y docker.io

# Step 2 — Install Docker Compose standalone
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose

# Step 3 — Make it executable
sudo chmod +x /usr/local/bin/docker-compose

# Step 4 — Verify both installed
docker --version
docker-compose --version
```

> ⚠️ Always use `docker-compose` (with hyphen), NOT `docker compose` (with space).
> The space version requires the Docker Compose plugin which is a separate install.

---

## Option A — Run with Docker (Recommended)

### Allow Docker without sudo (optional)

```bash
sudo usermod -aG docker $USER

# Install newgrp if missing on your system
sudo apt install login

# Apply group change without logging out
newgrp docker
```

If you skip this, just prefix every docker command with `sudo`.

### Important — stop local PostgreSQL first

If you ran Branch 2 locally, your machine has PostgreSQL running on port 5432.
Docker needs that same port. Stop it before starting:

```bash
sudo systemctl stop postgresql
```

### Start everything

```bash
cd branch-3-calculator
sudo docker-compose up --build
```

PostgreSQL takes 15–30 seconds to fully boot. Services will automatically
retry if they start before the database is ready — this is normal, just wait.

You know everything is ready when you see:
```
✅ [auth-service] PostgreSQL connected
✅ [auth-service] Redis connected
✅ auth-service running on port 4001
✅ [calculator-service] PostgreSQL connected
✅ calculator-service running on port 4002
✅ [user-service] PostgreSQL connected
✅ user-service running on port 4003
🚀 API Gateway Started on port 4000
```

Then open → **http://localhost:3000**

---

## Stopping the Application

### Method 1 — Ctrl + C in the running terminal
Press `Ctrl + C` once and wait a few seconds.

### Method 2 — From a new terminal (if Ctrl + C is stuck)

```bash
# Open a new terminal
sudo docker-compose -f ~/Calculator/docker-compose.yml down

# Or force stop all containers immediately
sudo docker stop $(sudo docker ps -q)
sudo docker-compose down
```

Verify everything stopped:
```bash
sudo docker ps
# Should show an empty list
```

---

## Other Useful Docker Commands

```bash
# Start without rebuilding (faster after first run)
sudo docker-compose up

# Stop and remove containers but keep data volumes
sudo docker-compose down

# Stop and delete ALL data — full fresh start
sudo docker-compose down -v

# View live logs of a specific service
sudo docker-compose logs -f auth-service
sudo docker-compose logs -f api-gateway
sudo docker-compose logs -f calc_postgres

# Rebuild only one service after a code change
sudo docker-compose up --build auth-service

# See all running containers and their status
sudo docker ps
```

---

## Option B — Run Locally Without Docker

Use this if you want live code changes during development.

### Step 1 — Install PostgreSQL and Redis

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib redis-server

sudo systemctl start postgresql redis-server
sudo systemctl enable postgresql redis-server
```

### Step 2 — Create the database

```bash
sudo -u postgres psql
```

Inside psql, run these one by one:
```sql
CREATE DATABASE calculator_db;
CREATE USER calculator_user WITH ENCRYPTED PASSWORD 'calculator_pass';
GRANT ALL PRIVILEGES ON DATABASE calculator_db TO calculator_user;
\c calculator_db
GRANT ALL ON SCHEMA public TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO calculator_user;
\q
```

Run the schema:
```bash
sudo -u postgres psql -d calculator_db -f init.sql
```

### Step 3 — Configure environment files

```bash
cd branch-3-calculator

cp api-gateway/.env.example        api-gateway/.env
cp auth-service/.env.example       auth-service/.env
cp calculator-service/.env.example calculator-service/.env
cp user-service/.env.example       user-service/.env
cp frontend/.env.local.example     frontend/.env.local
```

### Step 4 — Install dependencies

```bash
cd api-gateway        && npm install && cd ..
cd auth-service       && npm install && cd ..
cd calculator-service && npm install && cd ..
cd user-service       && npm install && cd ..
cd frontend           && npm install && cd ..
```

### Step 5 — Run all services (need 5 terminals)

**Terminal 1 — Auth Service**
```bash
cd auth-service && npm run dev        # → :4001
```

**Terminal 2 — Calculator Service**
```bash
cd calculator-service && npm run dev  # → :4002
```

**Terminal 3 — User Service**
```bash
cd user-service && npm run dev        # → :4003
```

**Terminal 4 — API Gateway**
```bash
cd api-gateway && npm run dev         # → :4000
```

**Terminal 5 — Frontend**
```bash
cd frontend && npm run dev            # → :3000
```

Open browser → **http://localhost:3000**

---

## Port Map

| Service              | Port | Description                        |
|----------------------|------|------------------------------------|
| Frontend (Next.js)   | 3000 | Browser UI                         |
| API Gateway          | 4000 | Single entry point for all API     |
| Auth Service         | 4001 | Register, login, JWT               |
| Calculator Service   | 4002 | Math calculations + history        |
| User Service         | 4003 | Profile + per-operation stats      |
| PostgreSQL           | 5432 | Persistent database                |
| Redis                | 6379 | Cache + rate limiting + blacklist  |

---

## API Reference

All requests go through the **API Gateway at port 4000**.
The frontend never calls services directly.

### Auth — Public

```bash
# Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"secret123"}'
```

### Auth — Protected

```bash
# Get current user
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer <token>"

# Logout (blacklists token in Redis)
curl -X POST http://localhost:4000/api/v1/auth/logout \
  -H "Authorization: Bearer <token>"
```

### Calculator — Protected

```bash
# Calculate
curl -X POST http://localhost:4000/api/v1/calculator/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"a":10,"b":3,"operator":"+"}'

# Get history
curl http://localhost:4000/api/v1/calculator/history \
  -H "Authorization: Bearer <token>"

# Delete one entry
curl -X DELETE http://localhost:4000/api/v1/calculator/history/5 \
  -H "Authorization: Bearer <token>"

# Clear all history
curl -X DELETE http://localhost:4000/api/v1/calculator/history \
  -H "Authorization: Bearer <token>"
```

### User — Protected

```bash
# Get profile
curl http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer <token>"

# Get stats
curl http://localhost:4000/api/v1/users/stats \
  -H "Authorization: Bearer <token>"

# Update name
curl -X PATCH http://localhost:4000/api/v1/users/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name":"New Name"}'
```

### Health checks

```bash
curl http://localhost:4000/health   # gateway
curl http://localhost:4001/health   # auth-service
curl http://localhost:4002/health   # calculator-service
curl http://localhost:4003/health   # user-service
```

---

## Redis Usage

| Key pattern         | TTL    | Purpose                               |
|---------------------|--------|---------------------------------------|
| `rate:<ip>`         | 60s    | Rate limiting — 100 req/min per IP    |
| `blacklist:<token>` | 7 days | Revoked JWT tokens after logout       |
| `session:<userId>`  | 7 days | Cached user session (auth-service)    |
| `history:<userId>`  | 60s    | Cached calculation history page 1     |
| `profile:<userId>`  | 5 min  | Cached user profile (user-service)    |
| `stats:<userId>`    | 2 min  | Cached operation stats (user-service) |

The UI shows a green **"cached"** badge on history and stats when Redis serves the data.

---

## How Services Communicate

```
1. Browser sends request with JWT in Authorization header
2. API Gateway receives it on port 4000
3. Gateway verifies JWT + checks Redis blacklist
4. Gateway injects x-user-id and x-user-email headers
5. Gateway proxies request to the correct service
6. Service reads x-user-id header (trusts the gateway)
7. Service checks Redis cache → hits DB on miss → caches result
8. Response flows back through gateway to browser
```

In Docker mode, services are on a private internal network (`calc_network`).
Only port 4000 (gateway) and 3000 (frontend) are accessible from your machine.

---

## Common Issues & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `address already in use :5432` | Local PostgreSQL running | `sudo systemctl stop postgresql` |
| `address already in use :6379` | Local Redis running | `sudo systemctl stop redis-server` |
| `EAI_AGAIN postgres` | Services started before DB ready | Wait — they auto-retry. Or run `sudo docker-compose down -v && sudo docker-compose up` |
| `Ctrl+C not working` | Terminal stuck | Open new terminal → `sudo docker stop $(sudo docker ps -q)` |
| `docker compose: unknown command` | Wrong syntax | Use `docker-compose` with hyphen, not space |
| `public folder not found` in build | No public/ dir in project | Use the Dockerfile without the public COPY line |
| `newgrp: command not found` | Package not installed | `sudo apt install login` then `newgrp docker` |

---

## Git — Push Branch 3

```bash
cd ~/Calculator
git checkout main
git checkout -b branch-3

# Copy branch-3 contents here, then:
git add .
git commit -m "feat: Branch 3 - Microservices + Redis + Docker"
git push -u origin branch-3
```

---

## What You Learn in Branch 3

- Microservices architecture — each service owns its domain
- API Gateway pattern — single entry point, JWT verified once
- Redis for caching, rate limiting, and token blacklisting
- Inter-service communication via HTTP with trusted headers
- Docker and Docker Compose — containerizing Node.js apps
- Multi-stage Docker builds for optimized production images
- Health checks and service dependencies in Docker Compose
- Stateless services — all state lives in PostgreSQL or Redis

---

*All three branches complete. Branch 1 = basics, Branch 2 = database + auth, Branch 3 = microservices.*