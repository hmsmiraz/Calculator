# Branch 2 — Database-Driven Calculator

Extends Branch 1 with **user authentication**, **PostgreSQL storage**, and **per-user calculation history**.

**Frontend** — Next.js + TypeScript + Tailwind CSS
**Backend**  — Node.js + Express + PostgreSQL
**Auth**     — JWT + bcrypt

---

## Project Structure

```
branch-2-calculator/
├── backend/
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   ├── db.js                       # PostgreSQL pool
│   │   │   └── migrate.js                  # Creates / drops tables
│   │   ├── models/
│   │   │   ├── user.model.js               # User queries + bcrypt
│   │   │   └── calculation.model.js        # History queries
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
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── auth/login/page.tsx
│   │   │   ├── auth/register/page.tsx
│   │   │   └── dashboard/page.tsx
│   │   ├── components/
│   │   │   ├── calculator/ (Calculator, HistoryPanel)
│   │   │   └── ui/         (Navbar)
│   │   ├── context/AuthContext.tsx
│   │   ├── services/calculator.service.ts
│   │   └── types/index.ts
│   ├── .env.local.example
│   └── package.json
│
└── README.md
```

---

## Local Development

### Step 1 — PostgreSQL Setup

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql

sudo -u postgres psql
```

Inside psql:
```sql
CREATE DATABASE calculator_db;
CREATE USER calculator_user WITH ENCRYPTED PASSWORD 'yourpassword';
GRANT ALL PRIVILEGES ON DATABASE calculator_db TO calculator_user;
\c calculator_db
GRANT ALL ON SCHEMA public TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO calculator_user;
\q
```

### Step 2 — Run Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your DB credentials
npm run migrate   # creates tables
npm run dev       # → http://localhost:5000
```

### Step 3 — Run Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev       # → http://localhost:3000
```

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
  operator   VARCHAR(1)   NOT NULL,
  result     NUMERIC      NOT NULL,
  expression VARCHAR(255) NOT NULL,
  operation  VARCHAR(50)  NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Migration Commands

```bash
npm run migrate        # create tables
npm run migrate:undo   # drop all tables
```

---

## Environment Variables

### Backend — `backend/.env`

| Variable         | Description                        |
|------------------|------------------------------------|
| `PORT`           | Express port (default 5000)        |
| `NODE_ENV`       | `development` or `production`      |
| `FRONTEND_URL`   | Allowed CORS origin                |
| `DB_HOST`        | PostgreSQL host                    |
| `DB_PORT`        | PostgreSQL port (default 5432)     |
| `DB_NAME`        | Database name                      |
| `DB_USER`        | Database user                      |
| `DB_PASSWORD`    | Database password                  |
| `JWT_SECRET`     | Secret for signing JWT tokens      |
| `JWT_EXPIRES_IN` | Token expiry e.g. `7d`             |

### Frontend — `frontend/.env.local`

| Variable              | Description          |
|-----------------------|----------------------|
| `NEXT_PUBLIC_API_URL` | Backend base URL     |

---

## API Reference

### Auth — Public

```bash
# Register
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@test.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@test.com","password":"secret123"}'
```

### Calculator — Protected

```bash
# Calculate (requires Bearer token)
curl -X POST http://localhost:5000/api/v1/calculator/calculate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"a":10,"b":3,"operator":"+"}'

# Get history
curl http://localhost:5000/api/v1/calculator/history \
  -H "Authorization: Bearer <token>"
```

---

---

# Deployment Guide

---

## Method 1 — Bare Metal on AWS EC2

Deploy everything directly on EC2 using PM2 and Nginx.

### Step 1 — Launch EC2 Instance

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t3.small (2GB RAM minimum for PostgreSQL)
- **Storage**: 20GB gp3
- **Security Group ports**:

| Port | Source    | Purpose       |
|------|-----------|---------------|
| 22   | Your IP   | SSH           |
| 80   | 0.0.0.0/0 | HTTP (Nginx)  |
| 443  | 0.0.0.0/0 | HTTPS         |

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 2 — Install Dependencies

```bash
sudo apt update && sudo apt upgrade -y

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Nginx + PM2
sudo apt install -y nginx
sudo npm install -g pm2
```

### Step 3 — Configure PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql
```

```sql
CREATE DATABASE calculator_db;
CREATE USER calculator_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE calculator_db TO calculator_user;
\c calculator_db
GRANT ALL ON SCHEMA public TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO calculator_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO calculator_user;
\q
```

### Step 4 — Upload Project

```bash
# On your LOCAL machine
scp -i your-key.pem -r branch-2-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/
```

### Step 5 — Configure and Start Backend

```bash
cd /home/ubuntu/branch-2-calculator/backend
npm install --production

cat > .env << EOF
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://<EC2_PUBLIC_IP>
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculator_db
DB_USER=calculator_user
DB_PASSWORD=your_strong_password
JWT_SECRET=your_very_long_random_jwt_secret_here
JWT_EXPIRES_IN=7d
EOF

# Run migrations
npm run migrate

# Start with PM2
pm2 start src/index.js --name calculator-backend
pm2 save
pm2 startup
# Run the command PM2 prints
```

### Step 6 — Build and Start Frontend

```bash
cd /home/ubuntu/branch-2-calculator/frontend
npm install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api
EOF

npm run build

pm2 start node_modules/.bin/next \
  --name calculator-frontend -- start --port 3000
pm2 save
```

### Step 7 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/calculator
```

```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass         http://localhost:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Access

```
http://<EC2_PUBLIC_IP>      → Frontend
http://<EC2_PUBLIC_IP>/api/ → Backend API
```

### PM2 Commands

```bash
pm2 status
pm2 logs calculator-backend
pm2 restart all
pm2 stop all
```

---

## Method 2 — Docker on AWS EC2

Run everything in containers using Docker Compose including PostgreSQL.

### Step 1 — Launch EC2 Instance

Ubuntu 22.04, **t3.medium** (2 vCPU, 4GB RAM — PostgreSQL needs memory), ports 22/80/443.

### Step 2 — SSH and Install Docker

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

sudo apt update && sudo apt upgrade -y
sudo apt install -y docker.io

sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

sudo usermod -aG docker ubuntu
newgrp docker
```

### Step 3 — Upload Project

```bash
scp -i your-key.pem -r branch-2-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/
```

### Step 4 — Add Dockerfiles

Create `backend/Dockerfile`:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production && npm cache clean --force
COPY . .
RUN addgroup -g 1001 -S nodejs && adduser -S nodeuser -u 1001 -G nodejs
USER nodeuser
EXPOSE 5000
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/health', (r) => r.statusCode === 200 ? process.exit(0) : process.exit(1))"
CMD ["node", "src/index.js"]
```

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
RUN addgroup -g 1001 -S nodejs && adduser -S nextuser -u 1001 -G nodejs
USER nextuser
EXPOSE 3000
CMD ["node", "server.js"]
```

Create root `docker-compose.yml`:
```yaml
version: '3.8'
services:

  postgres:
    image: postgres:15-alpine
    container_name: calc_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB:       calculator_db
      POSTGRES_USER:     calculator_user
      POSTGRES_PASSWORD: your_strong_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U calculator_user -d calculator_db"]
      interval: 5s
      timeout: 5s
      retries: 20
      start_period: 30s

  backend:
    build:
      context: ./backend
    container_name: calc_backend
    restart: on-failure
    environment:
      PORT:           5000
      NODE_ENV:       production
      FRONTEND_URL:   http://<EC2_PUBLIC_IP>
      DB_HOST:        postgres
      DB_PORT:        5432
      DB_NAME:        calculator_db
      DB_USER:        calculator_user
      DB_PASSWORD:    your_strong_password
      JWT_SECRET:     your_very_long_random_jwt_secret_here
      JWT_EXPIRES_IN: 7d
    ports:
      - "5000:5000"
    depends_on:
      postgres:
        condition: service_healthy

  frontend:
    build:
      context: ./frontend
    container_name: calc_frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: http://<EC2_PUBLIC_IP>/api
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Step 5 — Run Migrations and Start

```bash
cd /home/ubuntu/branch-2-calculator

# Build and start
docker-compose up --build -d

# Run DB migrations (first time only)
docker-compose exec backend npm run migrate

# Verify all running
docker ps
```

### Step 6 — Nginx Reverse Proxy

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/calculator
```

```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api/ {
        proxy_pass http://localhost:5000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx && sudo systemctl enable nginx
```

### Step 7 — Auto-start on Reboot

```bash
sudo systemctl enable docker

sudo nano /etc/systemd/system/calculator.service
```

```ini
[Unit]
Description=Calculator App v2
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=/home/ubuntu/branch-2-calculator
ExecStart=/usr/local/bin/docker-compose up
ExecStop=/usr/local/bin/docker-compose down
Restart=always
User=ubuntu

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable calculator
```

### Useful Commands

```bash
docker-compose down              # stop
docker-compose up -d             # start in background
docker-compose up --build -d     # rebuild and start
docker-compose logs -f backend   # tail backend logs
docker-compose exec backend npm run migrate  # run migrations
docker stats                     # resource usage
```

---

## Method 3 — Kubernetes on AWS EKS

Deploy with PostgreSQL as a managed AWS RDS instance and app containers on EKS.

### Step 1 — Install Tools Locally

```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws configure

# kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin
```

### Step 2 — Create RDS PostgreSQL (Managed Database)

In AWS Console → RDS → Create Database:
- Engine: PostgreSQL 15
- Template: Free tier (for testing) or Production
- DB identifier: `calculator-db`
- Master username: `calculator_user`
- Master password: `your_strong_password`
- DB name: `calculator_db`
- VPC: same VPC as your EKS cluster (create EKS first or use default)
- Public access: No (EKS pods connect internally)

Note the **RDS endpoint** — looks like:
```
calculator-db.xxxx.us-east-1.rds.amazonaws.com
```

### Step 3 — Push Images to ECR

```bash
aws ecr create-repository --repository-name calc-backend-v2  --region us-east-1
aws ecr create-repository --repository-name calc-frontend-v2 --region us-east-1

ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR

docker build -t calc-backend-v2  ./backend
docker tag  calc-backend-v2:latest  $ECR/calc-backend-v2:latest
docker push $ECR/calc-backend-v2:latest

docker build -t calc-frontend-v2 ./frontend
docker tag  calc-frontend-v2:latest $ECR/calc-frontend-v2:latest
docker push $ECR/calc-frontend-v2:latest
```

### Step 4 — Create EKS Cluster

```bash
eksctl create cluster \
  --name calculator-cluster-v2 \
  --region us-east-1 \
  --nodegroup-name calculator-nodes \
  --node-type t3.small \
  --nodes 2 \
  --managed

kubectl get nodes
```

### Step 5 — Create Namespace and Secrets

```bash
kubectl create namespace calculator

kubectl create secret generic calculator-secrets \
  --namespace calculator \
  --from-literal=db-password=your_strong_password \
  --from-literal=jwt-secret=your_very_long_random_jwt_secret_here
```

### Step 6 — Deploy Backend

```bash
ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com
RDS_ENDPOINT=calculator-db.xxxx.us-east-1.rds.amazonaws.com

kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: $ECR/calc-backend-v2:latest
        ports:
        - containerPort: 5000
        env:
        - name: PORT
          value: "5000"
        - name: NODE_ENV
          value: production
        - name: FRONTEND_URL
          value: "*"
        - name: DB_HOST
          value: "$RDS_ENDPOINT"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: calculator_db
        - name: DB_USER
          value: calculator_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: jwt-secret
        - name: JWT_EXPIRES_IN
          value: "7d"
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 15
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend
  namespace: calculator
spec:
  selector:
    app: backend
  ports:
  - port: 5000
    targetPort: 5000
EOF
```

### Step 7 — Run Migrations

```bash
# Run migrations as a one-off Job
kubectl apply -f - <<EOF
apiVersion: batch/v1
kind: Job
metadata:
  name: db-migrate
  namespace: calculator
spec:
  template:
    spec:
      containers:
      - name: migrate
        image: $ECR/calc-backend-v2:latest
        command: ["node", "src/config/migrate.js"]
        env:
        - name: DB_HOST
          value: "$RDS_ENDPOINT"
        - name: DB_PORT
          value: "5432"
        - name: DB_NAME
          value: calculator_db
        - name: DB_USER
          value: calculator_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
      restartPolicy: Never
EOF

# Wait for job to complete
kubectl wait --for=condition=complete job/db-migrate -n calculator --timeout=60s
kubectl logs -n calculator job/db-migrate
```

### Step 8 — Deploy Frontend

```bash
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: $ECR/calc-frontend-v2:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_URL
          value: http://backend:5000
---
apiVersion: v1
kind: Service
metadata:
  name: frontend
  namespace: calculator
spec:
  selector:
    app: frontend
  ports:
  - port: 3000
    targetPort: 3000
EOF
```

### Step 9 — Create Load Balancer Ingress

```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: calculator-ingress
  namespace: calculator
  annotations:
    kubernetes.io/ingress.class: alb
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
spec:
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
EOF

# Get public URL
kubectl get ingress -n calculator
```

### Step 10 — Verify

```bash
kubectl get pods     -n calculator
kubectl get services -n calculator

kubectl logs -n calculator deployment/backend
kubectl logs -n calculator deployment/frontend

# Scale
kubectl scale deployment backend --replicas=3 -n calculator
```

### Cleanup

```bash
eksctl delete cluster --name calculator-cluster-v2 --region us-east-1
aws ecr delete-repository --repository-name calc-backend-v2  --force --region us-east-1
aws ecr delete-repository --repository-name calc-frontend-v2 --force --region us-east-1
# Also delete the RDS instance from AWS Console
```

---

## Deployment Comparison

| Factor          | Bare Metal EC2      | Docker EC2          | Kubernetes EKS          |
|-----------------|---------------------|---------------------|-------------------------|
| Complexity      | Medium              | Low-Medium          | High                    |
| Cost            | ~$25/mo             | ~$25/mo             | ~$150+/mo               |
| Database        | Local PostgreSQL    | PostgreSQL container| AWS RDS (managed)       |
| Scaling         | Manual              | Manual              | Automatic               |
| Fault tolerance | None                | Container restart   | Pod auto-healing        |
| Best for        | Learning            | Staging / small prod| Large scale production  |
| Setup time      | ~45 min             | ~30 min             | ~2 hours                |
| Zero downtime   | No                  | No                  | Yes (rolling updates)   |

---

*Next → Branch 3 transforms this into a microservices architecture with Redis, Docker, and an API Gateway.*
