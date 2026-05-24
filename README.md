# Branch 1 — Basic Full-Stack Calculator

A clean full-stack calculator application.
**Frontend** — Next.js + TypeScript + Tailwind CSS
**Backend**  — Node.js + Express REST API

---

## Project Structure

```
branch-1-calculator/
├── backend/
│   ├── src/
│   │   ├── index.js                      # Server entry point
│   │   ├── app.js                        # Express setup
│   │   ├── controllers/
│   │   │   └── calculator.controller.js  # Request handlers
│   │   ├── routes/
│   │   │   └── calculator.routes.js      # Route definitions
│   │   ├── middleware/
│   │   │   ├── validators.middleware.js  # Input validation
│   │   │   └── error.middleware.js       # Error handling
│   │   └── utils/
│   │       └── calculator.utils.js       # Pure math functions
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/        (layout, page, globals.css)
│   │   ├── components/ (Calculator, HistoryPanel, ApiStatus)
│   │   ├── services/   (calculator.service.ts)
│   │   └── types/      (calculator.types.ts)
│   ├── .env.local.example
│   └── package.json
│
└── README.md
```

---

## Local Development

### Run Backend

```bash
cd backend
npm install
cp .env.example .env
npm run dev
# → http://localhost:5000
```

### Run Frontend

```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
# → http://localhost:3000
```

Open → **http://localhost:3000**

---

## Environment Variables

### Backend — `backend/.env`

| Variable       | Default                 | Description                  |
|----------------|-------------------------|------------------------------|
| `PORT`         | `5000`                  | Express server port          |
| `NODE_ENV`     | `development`           | Environment name             |
| `FRONTEND_URL` | `http://localhost:3000` | Allowed CORS origin          |

### Frontend — `frontend/.env.local`

| Variable              | Default                 | Description          |
|-----------------------|-------------------------|----------------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend base URL     |

---

## API Reference

Base URL: `http://localhost:5000/api/v1/calculator`

| Method | Endpoint      | Body                          | Description        |
|--------|---------------|-------------------------------|--------------------|
| GET    | /operations   | —                             | List operations    |
| POST   | /calculate    | `{a, b, operator}`            | Unified calculate  |
| POST   | /add          | `{a, b}`                      | Addition           |
| POST   | /subtract     | `{a, b}`                      | Subtraction        |
| POST   | /multiply     | `{a, b}`                      | Multiplication     |
| POST   | /divide       | `{a, b}`                      | Division           |

```bash
# Example
curl -X POST http://localhost:5000/api/v1/calculator/calculate \
  -H "Content-Type: application/json" \
  -d '{"a": 10, "b": 5, "operator": "+"}'
```

---

---

# Deployment Guide

---

## Method 1 — Bare Metal on AWS EC2

Deploy frontend and backend directly on a single EC2 instance using PM2 and Nginx.

### Step 1 — Launch EC2 Instance

- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t3.small (1 vCPU, 2GB RAM)
- **Storage**: 10GB gp3
- **Security Group ports**:

| Port | Source    | Purpose        |
|------|-----------|----------------|
| 22   | Your IP   | SSH            |
| 80   | 0.0.0.0/0 | HTTP (Nginx)   |
| 443  | 0.0.0.0/0 | HTTPS (Nginx)  |

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

# Nginx + PM2
sudo apt install -y nginx
sudo npm install -g pm2

node --version
npm --version
```

### Step 3 — Upload Project

```bash
# On your LOCAL machine
scp -i your-key.pem -r branch-1-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/
```

### Step 4 — Configure and Start Backend

```bash
# On the SERVER
cd /home/ubuntu/branch-1-calculator/backend
npm install --production

cat > .env << EOF
PORT=5000
NODE_ENV=production
FRONTEND_URL=http://<EC2_PUBLIC_IP>
EOF

pm2 start src/index.js --name calculator-backend
pm2 save
pm2 startup
# Run the command PM2 prints
```

### Step 5 — Build and Start Frontend

```bash
cd /home/ubuntu/branch-1-calculator/frontend
npm install

cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api
EOF

npm run build

pm2 start node_modules/.bin/next \
  --name calculator-frontend -- start --port 3000
pm2 save
```

### Step 6 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/calculator
```

```nginx
server {
    listen 80;
    server_name <EC2_PUBLIC_IP>;

    # Frontend
    location / {
        proxy_pass         http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
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
http://<EC2_PUBLIC_IP>       → Frontend
http://<EC2_PUBLIC_IP>/api/  → Backend API
```

### PM2 Commands

```bash
pm2 status                       # see all processes
pm2 logs calculator-backend      # tail backend logs
pm2 logs calculator-frontend     # tail frontend logs
pm2 restart all                  # restart everything
pm2 stop all                     # stop everything
```

---

## Method 2 — Docker on AWS EC2

Run both services in containers using Docker Compose.

### Step 1 — Launch EC2 Instance

Same as Method 1 — Ubuntu 22.04, t3.small, ports 22/80/443.

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

docker --version
docker-compose --version
```

### Step 3 — Upload Project

```bash
# On your LOCAL machine
scp -i your-key.pem -r branch-1-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/
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
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
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
  backend:
    build:
      context: ./backend
    container_name: calc_backend
    restart: unless-stopped
    environment:
      PORT: 5000
      NODE_ENV: production
      FRONTEND_URL: http://<EC2_PUBLIC_IP>
    ports:
      - "5000:5000"

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
```

### Step 5 — Build and Run

```bash
cd /home/ubuntu/branch-1-calculator
docker-compose up --build -d

# Verify both running
docker ps

# View logs
docker-compose logs -f
```

### Step 6 — Nginx Reverse Proxy (optional)

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
Description=Calculator App
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=/home/ubuntu/branch-1-calculator
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
docker-compose down          # stop
docker-compose up -d         # start in background
docker-compose up --build -d # rebuild and start
docker stats                 # resource usage
```

---

## Method 3 — Kubernetes on AWS EKS

Deploy frontend and backend as separate Kubernetes workloads on EKS.

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

### Step 2 — Push Images to ECR

```bash
aws ecr create-repository --repository-name calc-backend  --region us-east-1
aws ecr create-repository --repository-name calc-frontend --region us-east-1

ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin $ECR

# Build and push backend
docker build -t calc-backend ./backend
docker tag  calc-backend:latest $ECR/calc-backend:latest
docker push $ECR/calc-backend:latest

# Build and push frontend
docker build -t calc-frontend ./frontend
docker tag  calc-frontend:latest $ECR/calc-frontend:latest
docker push $ECR/calc-frontend:latest
```

### Step 3 — Create EKS Cluster

```bash
eksctl create cluster \
  --name calculator-cluster \
  --region us-east-1 \
  --nodegroup-name calculator-nodes \
  --node-type t3.small \
  --nodes 2 \
  --managed

kubectl get nodes
```

### Step 4 — Create Namespace and Secrets

```bash
kubectl create namespace calculator

kubectl create secret generic calculator-secrets \
  --namespace calculator \
  --from-literal=frontend-url=http://<YOUR_LOAD_BALANCER_URL>
```

### Step 5 — Deploy Backend

```bash
ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

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
        image: $ECR/calc-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: PORT
          value: "5000"
        - name: NODE_ENV
          value: production
        - name: FRONTEND_URL
          value: "*"
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
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

### Step 6 — Deploy Frontend

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
        image: $ECR/calc-frontend:latest
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

### Step 7 — Create Ingress (Load Balancer)

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

### Step 8 — Verify

```bash
kubectl get pods     -n calculator
kubectl get services -n calculator

# Logs
kubectl logs -n calculator deployment/backend
kubectl logs -n calculator deployment/frontend

# Scale
kubectl scale deployment backend --replicas=3 -n calculator
```

### Cleanup

```bash
eksctl delete cluster --name calculator-cluster --region us-east-1
aws ecr delete-repository --repository-name calc-backend  --force --region us-east-1
aws ecr delete-repository --repository-name calc-frontend --force --region us-east-1
```

---

## Deployment Comparison

| Factor         | Bare Metal EC2    | Docker EC2        | Kubernetes EKS        |
|----------------|-------------------|-------------------|-----------------------|
| Complexity     | Low               | Low               | High                  |
| Cost           | ~$15/mo           | ~$15/mo           | ~$100+/mo             |
| Scaling        | Manual            | Manual            | Automatic             |
| Fault tolerance| None              | Container restart  | Pod auto-healing      |
| Best for       | Learning          | Small production  | Large scale           |
| Setup time     | ~30 min           | ~20 min           | ~1.5 hours            |

---

*Next → Branch 2 adds PostgreSQL, user authentication, and per-user calculation history.*
