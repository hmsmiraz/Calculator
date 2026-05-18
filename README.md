# Branch 2 — Database-Driven Calculator

Extends Branch 1 with **user authentication**, **PostgreSQL storage**, and **per-user calculation history**.

**Frontend** — Next.js 14 + TypeScript + Tailwind CSS  
**Backend**  — Node.js + Express + PostgreSQL (no ORM — raw `pg` queries)  
**Auth**     — JWT + bcrypt  

---

## Project Structure

```
branch-2-calculator/
├── backend/
│   ├── src/
│   │   ├── index.js                        # Server entry point
│   │   ├── app.js                          # Express setup
│   │   ├── config/
│   │   │   ├── db.js                       # PostgreSQL pool
│   │   │   └── migrate.js                  # Creates / drops all tables
│   │   ├── models/
│   │   │   ├── user.model.js               # User DB queries + bcrypt
│   │   │   └── calculation.model.js        # History DB queries
│   │   ├── controllers/
│   │   │   ├── auth.controller.js          # register / login / me
│   │   │   └── calculator.controller.js    # calculate / history CRUD
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   └── calculator.routes.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js          # JWT protect
│   │   │   ├── validators.middleware.js
│   │   │   └── error.middleware.js
│   │   └── utils/
│   │       ├── calculator.utils.js
│   │       └── jwt.utils.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx                  # Root layout (wraps AuthProvider)
│   │   │   ├── page.tsx                    # Redirects → /dashboard or /auth/login
│   │   │   ├── auth/
│   │   │   │   ├── login/page.tsx
│   │   │   │   └── register/page.tsx
│   │   │   └── dashboard/page.tsx          # Protected main page
│   │   ├── components/
│   │   │   ├── calculator/
│   │   │   │   ├── Calculator.tsx          # Calculator UI — calls API with JWT
│   │   │   │   └── HistoryPanel.tsx        # Shows DB-backed history
│   │   │   └── ui/
│   │   │       └── Navbar.tsx              # Top nav with user name + logout
│   │   ├── context/
│   │   │   └── AuthContext.tsx             # Global auth state + localStorage
│   │   ├── services/
│   │   │   └── calculator.service.ts       # Authenticated API calls
│   │   └── types/
│   │       └── index.ts
│   ├── .env.local.example
│   └── package.json
│
└── README.md
```

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally

---

## 1. PostgreSQL Setup

```bash
# Open the PostgreSQL shell
sudo -u postgres psql

# Create the database and a dedicated user
CREATE DATABASE calculator_db;
CREATE USER calculator_user WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE calculator_db TO calculator_user;
\q
```

---

## 2. Backend Setup

```bash
# Terminal 1
cd backend
npm install
cp .env.example .env
```

Edit `backend/.env`:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculator_db
DB_USER=calculator_user
DB_PASSWORD=yourpassword

JWT_SECRET=replace_this_with_a_long_random_string
JWT_EXPIRES_IN=7d
```

Run database migrations (creates tables):
```bash
npm run migrate
```

Expected output:
```
🚀 Running migrations...
✅ Tables created successfully:
   → users
   → calculations
   → idx_calculations_user_id (index)
   → users_updated_at (trigger)
```

Start the server:
```bash
npm run dev
```

Backend starts at → **http://localhost:5000**

---

## 3. Frontend Setup

```bash
# Terminal 2
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Frontend starts at → **http://localhost:3000**

---

## Database Schema

### `users` table
```sql
CREATE TABLE users (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100)        NOT NULL,
  email      VARCHAR(255) UNIQUE NOT NULL,
  password   VARCHAR(255)        NOT NULL,   -- bcrypt hash (12 rounds)
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### `calculations` table
```sql
CREATE TABLE calculations (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  operand_a  NUMERIC      NOT NULL,
  operand_b  NUMERIC      NOT NULL,
  operator   VARCHAR(1)   NOT NULL,          -- +  -  *  /
  result     NUMERIC      NOT NULL,
  expression VARCHAR(255) NOT NULL,          -- "10 + 5 = 15"
  operation  VARCHAR(50)  NOT NULL,          -- "addition"
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Migration Commands

```bash
# Create all tables
npm run migrate

# Drop all tables (full reset)
npm run migrate:undo

# Then recreate
npm run migrate
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable         | Description                                 |
|------------------|---------------------------------------------|
| `PORT`           | Express server port (default 5000)          |
| `NODE_ENV`       | `development` or `production`               |
| `FRONTEND_URL`   | Allowed CORS origin                         |
| `DB_HOST`        | PostgreSQL host                             |
| `DB_PORT`        | PostgreSQL port (default 5432)              |
| `DB_NAME`        | Database name                               |
| `DB_USER`        | Database user                               |
| `DB_PASSWORD`    | Database password                           |
| `JWT_SECRET`     | Secret key for signing JWT tokens           |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d`, `24h`              |

### Frontend — `frontend/.env.local`

| Variable               | Description              |
|------------------------|--------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend base URL         |

---

## API Reference

### Auth routes — `/api/v1/auth`

#### POST `/register`
```json
// Request
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }

// Response 201
{
  "success": true,
  "message": "Account created successfully.",
  "data": {
    "user":  { "id": 1, "name": "John Doe", "email": "john@example.com", "created_at": "..." },
    "token": "eyJhbGci..."
  }
}
```

#### POST `/login`
```json
// Request
{ "email": "john@example.com", "password": "secret123" }

// Response 200
{
  "success": true,
  "data": { "user": { ... }, "token": "eyJhbGci..." }
}
```

#### GET `/me` 🔒
Returns the currently authenticated user.
```
Authorization: Bearer <token>
```

---

### Calculator routes — `/api/v1/calculator` 🔒
All routes require `Authorization: Bearer <token>`.

#### POST `/calculate`
```json
// Request
{ "a": 10, "b": 3, "operator": "+" }

// Response 200
{
  "success": true,
  "data": {
    "id": 42,
    "result": 13,
    "expression": "10 + 3 = 13",
    "operation": "addition",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

#### GET `/history?page=1&limit=20`
Returns paginated calculation history for the logged-in user.
```json
{
  "success": true,
  "data": {
    "calculations": [ { "id": 42, "expression": "10 + 3 = 13", ... } ],
    "pagination": { "total": 55, "page": 1, "limit": 20, "totalPages": 3 }
  }
}
```

#### DELETE `/history`
Deletes all history for the logged-in user.

#### DELETE `/history/:id`
Deletes a single history entry (must belong to the user).

---

## Authentication Flow

```
1. User registers  →  password hashed with bcrypt (12 rounds)  →  JWT returned
2. User logs in    →  password compared with hash  →  JWT returned
3. Every API call  →  JWT sent in Authorization header
4. Backend         →  verifyToken()  →  fetches fresh user from DB  →  req.user set
5. Token expires   →  401 returned  →  frontend redirects to login
```

---

## What You Learn in Branch 2

- PostgreSQL integration with raw `pg` queries (no ORM)
- Database schema design with foreign keys, indexes, and triggers
- Password hashing with bcrypt
- JWT authentication and protected routes
- React Context API for global auth state
- Token persistence with localStorage
- Protected pages and redirects in Next.js App Router
- Paginated API responses

---

*Next → Branch 3 transforms this into a microservices architecture with Redis, Docker, and an API Gateway.*
