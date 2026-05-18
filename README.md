# Branch 1 — Basic Full-Stack Calculator

A clean full-stack calculator application.  
**Frontend** — Next.js 14 + TypeScript + Tailwind CSS  
**Backend** — Node.js + Express REST API

---

## Project Structure

```
branch-1-calculator/
├── frontend/                   # Next.js application
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx      # Root HTML layout
│   │   │   ├── page.tsx        # Home page
│   │   │   └── globals.css     # Tailwind base styles
│   │   ├── components/
│   │   │   ├── Calculator.tsx  # Main calculator UI + state
│   │   │   ├── HistoryPanel.tsx# Calculation history sidebar
│   │   │   └── ApiStatus.tsx   # Backend connection indicator
│   │   ├── services/
│   │   │   └── calculator.service.ts  # All fetch calls to the API
│   │   └── types/
│   │       └── calculator.types.ts    # Shared TypeScript interfaces
│   ├── .env.local.example
│   ├── next.config.js
│   ├── tailwind.config.ts
│   └── package.json
│
├── backend/                    # Express API
│   ├── src/
│   │   ├── index.js            # Server boot + graceful shutdown
│   │   ├── app.js              # Express setup, CORS, middleware, routes
│   │   ├── controllers/
│   │   │   └── calculator.controller.js  # Request handlers
│   │   ├── routes/
│   │   │   └── calculator.routes.js      # Route definitions
│   │   ├── middleware/
│   │   │   ├── validators.middleware.js  # express-validator rules
│   │   │   └── error.middleware.js       # 404 + global error handler
│   │   └── utils/
│   │       └── calculator.utils.js       # Pure math functions
│   ├── .env.example
│   └── package.json
│
└── README.md                   ← you are here
```

---

## Installation & Running

> You need two terminals — one for the backend, one for the frontend.

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd branch-1-calculator
```

---

### 2. Run the Backend

```bash
# Terminal 1
cd backend
npm install

# Copy the example env file
cp .env.example .env

# Start the dev server (auto-restarts on file changes)
npm run dev
```

Backend starts at → **http://localhost:5000**

---

### 3. Run the Frontend

```bash
# Terminal 2
cd frontend
npm install

# Copy the example env file
cp .env.local.example .env.local

# Start Next.js dev server
npm run dev
```

Frontend starts at → **http://localhost:3000**

Open your browser at **http://localhost:3000** — you should see the calculator.  
The green dot in the header confirms the frontend is talking to the backend.

---

## Environment Variables

### Backend — `backend/.env`

| Variable        | Default                  | Description                          |
|-----------------|--------------------------|--------------------------------------|
| `PORT`          | `5000`                   | Port the Express server listens on   |
| `NODE_ENV`      | `development`            | Environment name                     |
| `FRONTEND_URL`  | `http://localhost:3000`  | Allowed CORS origin                  |

### Frontend — `frontend/.env.local`

| Variable                | Default                  | Description                    |
|-------------------------|--------------------------|--------------------------------|
| `NEXT_PUBLIC_API_URL`   | `http://localhost:5000`  | Base URL for the backend API   |

---

## API Reference

### Base URL
```
http://localhost:5000/api/v1/calculator
```

---

### GET `/operations`
Returns all supported operations.

**Response**
```json
{
  "success": true,
  "data": {
    "operations": [
      { "name": "addition",       "operator": "+", "endpoint": "/api/v1/calculator/add"      },
      { "name": "subtraction",    "operator": "-", "endpoint": "/api/v1/calculator/subtract" },
      { "name": "multiplication", "operator": "*", "endpoint": "/api/v1/calculator/multiply" },
      { "name": "division",       "operator": "/", "endpoint": "/api/v1/calculator/divide"   }
    ]
  }
}
```

---

### POST `/calculate` — Unified endpoint
Send any operation using the `operator` field.

**Request body**
```json
{
  "a": 10,
  "b": 5,
  "operator": "+"
}
```
Supported operators: `+`  `-`  `*`  `/`

**Success response — 200**
```json
{
  "success": true,
  "data": {
    "result": 15,
    "expression": "10 + 5 = 15",
    "operation": "addition",
    "timestamp": "2024-01-15T10:30:00.000Z"
  }
}
```

**Validation error — 400**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "operator", "message": "Operator must be one of: +, -, *, /" }
  ]
}
```

---

### POST `/add`
```json
// Request
{ "a": 10, "b": 3 }

// Response
{
  "success": true,
  "data": { "result": 13, "expression": "10 + 3 = 13", "operation": "addition", "timestamp": "..." }
}
```

### POST `/subtract`
```json
// Request
{ "a": 10, "b": 3 }

// Response
{
  "success": true,
  "data": { "result": 7, "expression": "10 - 3 = 7", "operation": "subtraction", "timestamp": "..." }
}
```

### POST `/multiply`
```json
// Request
{ "a": 6, "b": 7 }

// Response
{
  "success": true,
  "data": { "result": 42, "expression": "6 × 7 = 42", "operation": "multiplication", "timestamp": "..." }
}
```

### POST `/divide`
```json
// Request
{ "a": 10, "b": 2 }

// Response
{
  "success": true,
  "data": { "result": 5, "expression": "10 ÷ 2 = 5", "operation": "division", "timestamp": "..." }
}
```

**Division by zero — 400**
```json
{
  "success": false,
  "message": "Division by zero is not allowed"
}
```

---

## Testing the API manually

Using **curl**:
```bash
# Health check
curl http://localhost:5000/health

# Add
curl -X POST http://localhost:5000/api/v1/calculator/add \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 5}'

# Unified endpoint — multiply
curl -X POST http://localhost:5000/api/v1/calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 6, "b": 7, "operator": "*"}'

# Divide by zero (expect 400)
curl -X POST http://localhost:5000/api/v1/calculator/divide \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 0}'
```

Using **Postman** or **Insomnia** — import the base URL and hit the endpoints above with `Content-Type: application/json`.

---

## Architecture Overview

```
Browser (Next.js)
      │
      │  HTTP POST /api/v1/calculator/*
      ▼
Express Server (Node.js)
      │
      ├── CORS middleware        — only allows requests from frontend URL
      ├── express-validator      — validates a, b, operator before controller runs
      ├── calculator.controller  — extracts body, calls utils, builds response
      ├── calculator.utils       — pure functions: add / subtract / multiply / divide
      └── error.middleware       — catches all errors, returns consistent JSON
```

### Key design decisions

| Decision | Reason |
|----------|--------|
| Separate `/add`, `/subtract` etc. + unified `/calculate` | Demonstrates both single-purpose and flexible API design |
| Pure utils layer | Business logic is fully testable without Express |
| express-validator middleware | Validation runs before the controller — controller only handles valid data |
| `.env.example` files | Keeps secrets out of git, makes setup explicit |
| `NEXT_PUBLIC_API_URL` | Next.js requires the `NEXT_PUBLIC_` prefix for env vars exposed to the browser |

---

## What You Learn in Branch 1

- Full-stack project structure with clear separation of concerns  
- Building a REST API with Express — routes, controllers, middleware, utils  
- Input validation with `express-validator`  
- Consuming an API from Next.js using `fetch`  
- TypeScript types shared across components and services  
- CORS configuration between frontend and backend  
- Environment variable management with `.env` files  

---

*Next → Branch 2 adds PostgreSQL, user authentication, and calculation history storage.*
