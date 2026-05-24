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
├── docker-compose.yml
├── init.sql
├── api-gateway/        ← port 4000
├── auth-service/       ← port 4001
├── calculator-service/ ← port 4002
├── user-service/       ← port 4003
└── frontend/           ← port 3000
```

---

## Port Map

| Service              | Port | Description                       |
|----------------------|------|-----------------------------------|
| Frontend (Next.js)   | 3000 | Browser UI                        |
| API Gateway          | 4000 | Single entry point for all API    |
| Auth Service         | 4001 | Register, login, JWT              |
| Calculator Service   | 4002 | Math calculations + history       |
| User Service         | 4003 | Profile + per-operation stats     |
| PostgreSQL           | 5432 | Persistent database               |
| Redis                | 6379 | Cache + rate limiting + blacklist |

---

## Local Development

### Prerequisites

```bash
sudo apt update
sudo apt install -y docker.io

sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Run

```bash
# Stop local postgres if running (frees port 5432)
sudo systemctl stop postgresql

cd branch-3-calculator
sudo docker-compose up --build
```

Open → **http://localhost:3000**

### Stop

```bash
# Ctrl+C in terminal, or from a new terminal:
sudo docker-compose down

# Full reset including data
sudo docker-compose down -v
```

---

## Common Issues

| Error | Fix |
|-------|-----|
| `address already in use :5432` | `sudo systemctl stop postgresql` |
| `address already in use :6379` | `sudo systemctl stop redis-server` |
| `EAI_AGAIN postgres` | Services auto-retry — wait 30s, or run `docker-compose down -v && docker-compose up` |
| `Ctrl+C stuck` | New terminal → `sudo docker stop $(sudo docker ps -q)` |
| `docker compose: unknown command` | Use `docker-compose` with hyphen |
| `newgrp not found` | `sudo apt install login` then `newgrp docker` |

---

---

# Deployment Guide

Three ways to deploy Branch 3 to a production Linux server.

---

## Method 1 — Bare Metal on AWS EC2

Deploy all services directly on a single EC2 instance without Docker.

### Step 1 — Launch EC2 Instance

- Go to AWS Console → EC2 → Launch Instance
- **AMI**: Ubuntu 22.04 LTS
- **Instance type**: t3.medium (2 vCPU, 4GB RAM minimum)
- **Storage**: 20GB gp3
- **Security Group** — open these ports:

| Port | Source    | Purpose             |
|------|-----------|---------------------|
| 22   | Your IP   | SSH access          |
| 80   | 0.0.0.0/0 | HTTP (Nginx)        |
| 443  | 0.0.0.0/0 | HTTPS (Nginx)       |
| 3000 | 0.0.0.0/0 | Frontend (optional) |
| 4000 | 0.0.0.0/0 | API Gateway         |

- Create or select a key pair, download the `.pem` file

### Step 2 — SSH into the Server

```bash
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 3 — Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node --version   # v20.x.x
npm --version

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install Nginx (reverse proxy)
sudo apt install -y nginx

# Install PM2 (process manager — keeps services running)
sudo npm install -g pm2
```

### Step 4 — Configure PostgreSQL

```bash
sudo systemctl start postgresql
sudo systemctl enable postgresql

sudo -u postgres psql
```

Inside psql:
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

### Step 5 — Configure Redis

```bash
sudo systemctl start redis-server
sudo systemctl enable redis-server

# Secure Redis — bind to localhost only
sudo nano /etc/redis/redis.conf
# Find and set: bind 127.0.0.1
# Find and set: requirepass your_redis_password

sudo systemctl restart redis-server
```

### Step 6 — Upload and Configure the Project

```bash
# On your LOCAL machine — upload the project
scp -i your-key.pem -r branch-3-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/

# Back on the SERVER
cd /home/ubuntu/branch-3-calculator

# Run DB schema
sudo -u postgres psql -d calculator_db -f init.sql

# Install dependencies for all services
for service in api-gateway auth-service calculator-service user-service; do
  cd $service && npm install --production && cd ..
done

# Install frontend dependencies and build
cd frontend
npm install
npm run build
cd ..
```

### Step 7 — Create Environment Files

```bash
# Auth Service
cat > auth-service/.env << EOF
PORT=4001
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculator_db
DB_USER=calculator_user
DB_PASSWORD=your_strong_password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your_very_long_random_jwt_secret_here
JWT_EXPIRES_IN=7d
EOF

# Calculator Service
cat > calculator-service/.env << EOF
PORT=4002
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculator_db
DB_USER=calculator_user
DB_PASSWORD=your_strong_password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your_very_long_random_jwt_secret_here
EOF

# User Service
cat > user-service/.env << EOF
PORT=4003
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=calculator_db
DB_USER=calculator_user
DB_PASSWORD=your_strong_password
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
EOF

# API Gateway
cat > api-gateway/.env << EOF
PORT=4000
NODE_ENV=production
AUTH_SERVICE_URL=http://localhost:4001
CALC_SERVICE_URL=http://localhost:4002
USER_SERVICE_URL=http://localhost:4003
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
JWT_SECRET=your_very_long_random_jwt_secret_here
FRONTEND_URL=http://<EC2_PUBLIC_IP>
EOF

# Frontend
cat > frontend/.env.local << EOF
NEXT_PUBLIC_API_URL=http://<EC2_PUBLIC_IP>/api
EOF
```

### Step 8 — Start Services with PM2

```bash
cd /home/ubuntu/branch-3-calculator

# Start all backend services
pm2 start auth-service/src/index.js       --name auth-service
pm2 start calculator-service/src/index.js --name calculator-service
pm2 start user-service/src/index.js       --name user-service
pm2 start api-gateway/src/index.js        --name api-gateway

# Start frontend
pm2 start frontend/node_modules/.bin/next \
  --name frontend -- start --port 3000

# Save PM2 process list and enable auto-start on reboot
pm2 save
pm2 startup
# Run the command PM2 prints out

# Check all services running
pm2 status
```

### Step 9 — Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/calculator
```

Paste this config:
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

    # API Gateway
    location /api/ {
        proxy_pass         http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Access

```
http://<EC2_PUBLIC_IP>        → Frontend
http://<EC2_PUBLIC_IP>/api/   → API Gateway
```

### PM2 Useful Commands

```bash
pm2 status                    # see all services
pm2 logs auth-service         # tail logs
pm2 restart all               # restart everything
pm2 stop all                  # stop everything
pm2 delete all                # remove from PM2
```

---

## Method 2 — Docker on AWS EC2

Deploy everything using Docker Compose on a single EC2 instance.

### Step 1 — Launch EC2 Instance

Same as Method 1 but use **t3.medium** minimum.
Security group ports: 22, 80, 443, 3000, 4000.

### Step 2 — SSH and Install Docker

```bash
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
sudo apt install -y docker.io

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Allow ubuntu user to run Docker
sudo usermod -aG docker ubuntu
newgrp docker

# Verify
docker --version
docker-compose --version
```

### Step 3 — Upload the Project

```bash
# On your LOCAL machine
scp -i your-key.pem -r branch-3-calculator ubuntu@<EC2_PUBLIC_IP>:/home/ubuntu/
```

### Step 4 — Configure Environment

```bash
# On the SERVER
cd /home/ubuntu/branch-3-calculator
```

Edit `docker-compose.yml` — update these values in every service:
```yaml
JWT_SECRET:     your_very_long_random_jwt_secret_here
DB_PASSWORD:    your_strong_password
FRONTEND_URL:   http://<EC2_PUBLIC_IP>:3000
```

Also update the frontend service:
```yaml
frontend:
  environment:
    NEXT_PUBLIC_API_URL: http://<EC2_PUBLIC_IP>:4000
```

### Step 5 — Build and Run

```bash
docker-compose up --build -d
```

The `-d` flag runs everything in the background (detached mode).

```bash
# Check all containers are running
docker ps

# View logs
docker-compose logs -f

# View logs of one service
docker-compose logs -f auth-service
```

### Step 6 — Install Nginx (optional but recommended)

```bash
sudo apt install -y nginx
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
        proxy_pass         http://localhost:4000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/calculator /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 7 — Auto-start on Reboot

```bash
sudo systemctl enable docker

# Create a systemd service for docker-compose
sudo nano /etc/systemd/system/calculator.service
```

```ini
[Unit]
Description=Calculator Microservices
Requires=docker.service
After=docker.service

[Service]
WorkingDirectory=/home/ubuntu/branch-3-calculator
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
sudo systemctl start calculator
```

### Access

```
http://<EC2_PUBLIC_IP>     → Frontend (via Nginx)
http://<EC2_PUBLIC_IP>:3000 → Frontend (direct)
http://<EC2_PUBLIC_IP>:4000 → API Gateway (direct)
```

### Useful Commands

```bash
# Stop all
docker-compose down

# Restart all
docker-compose restart

# Update code and redeploy
git pull
docker-compose up --build -d

# Check resource usage
docker stats
```

---

## Method 3 — Kubernetes on AWS EKS

Deploy as a production-grade Kubernetes cluster on Amazon EKS.

### Prerequisites — Install Tools Locally

```bash
# Install AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip && sudo ./aws/install
aws configure   # enter your AWS Access Key, Secret, region

# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install eksctl
curl --silent --location "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_$(uname -s)_amd64.tar.gz" | tar xz -C /tmp
sudo mv /tmp/eksctl /usr/local/bin

# Verify
aws --version
kubectl version --client
eksctl version
```

### Step 1 — Push Docker Images to ECR

```bash
# Create ECR repositories
aws ecr create-repository --repository-name calc-api-gateway        --region us-east-1
aws ecr create-repository --repository-name calc-auth-service       --region us-east-1
aws ecr create-repository --repository-name calc-calculator-service --region us-east-1
aws ecr create-repository --repository-name calc-user-service       --region us-east-1
aws ecr create-repository --repository-name calc-frontend           --region us-east-1

# Login to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Build and push each image
ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# API Gateway
docker build -t calc-api-gateway ./api-gateway
docker tag  calc-api-gateway:latest $ECR/calc-api-gateway:latest
docker push $ECR/calc-api-gateway:latest

# Auth Service
docker build -t calc-auth-service ./auth-service
docker tag  calc-auth-service:latest $ECR/calc-auth-service:latest
docker push $ECR/calc-auth-service:latest

# Calculator Service
docker build -t calc-calculator-service ./calculator-service
docker tag  calc-calculator-service:latest $ECR/calc-calculator-service:latest
docker push $ECR/calc-calculator-service:latest

# User Service
docker build -t calc-user-service ./user-service
docker tag  calc-user-service:latest $ECR/calc-user-service:latest
docker push $ECR/calc-user-service:latest

# Frontend
docker build -t calc-frontend ./frontend
docker tag  calc-frontend:latest $ECR/calc-frontend:latest
docker push $ECR/calc-frontend:latest
```

### Step 2 — Create EKS Cluster

```bash
eksctl create cluster \
  --name calculator-cluster \
  --region us-east-1 \
  --nodegroup-name calculator-nodes \
  --node-type t3.medium \
  --nodes 2 \
  --nodes-min 2 \
  --nodes-max 4 \
  --managed

# Takes ~15 minutes. Verify:
kubectl get nodes
```

### Step 3 — Create Kubernetes Secrets

```bash
kubectl create secret generic calculator-secrets \
  --from-literal=db-password=your_strong_password \
  --from-literal=jwt-secret=your_very_long_random_jwt_secret_here \
  --from-literal=redis-password=your_redis_password
```

### Step 4 — Deploy PostgreSQL and Redis

```bash
# Create namespace
kubectl create namespace calculator

# Deploy PostgreSQL
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: postgres
  namespace: calculator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        env:
        - name: POSTGRES_DB
          value: calculator_db
        - name: POSTGRES_USER
          value: calculator_user
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
        ports:
        - containerPort: 5432
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
      volumes:
      - name: postgres-storage
        emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: postgres
  namespace: calculator
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
EOF

# Deploy Redis
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis
  namespace: calculator
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
---
apiVersion: v1
kind: Service
metadata:
  name: redis
  namespace: calculator
spec:
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
EOF
```

### Step 5 — Deploy Microservices

```bash
ECR=<AWS_ACCOUNT_ID>.dkr.ecr.us-east-1.amazonaws.com

# Auth Service
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: auth-service
  template:
    metadata:
      labels:
        app: auth-service
    spec:
      containers:
      - name: auth-service
        image: $ECR/calc-auth-service:latest
        ports:
        - containerPort: 4001
        env:
        - name: PORT
          value: "4001"
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          value: postgres
        - name: DB_NAME
          value: calculator_db
        - name: DB_USER
          value: calculator_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
        - name: REDIS_HOST
          value: redis
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: auth-service
  namespace: calculator
spec:
  selector:
    app: auth-service
  ports:
  - port: 4001
    targetPort: 4001
EOF

# Calculator Service
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: calculator-service
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: calculator-service
  template:
    metadata:
      labels:
        app: calculator-service
    spec:
      containers:
      - name: calculator-service
        image: $ECR/calc-calculator-service:latest
        ports:
        - containerPort: 4002
        env:
        - name: PORT
          value: "4002"
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          value: postgres
        - name: DB_NAME
          value: calculator_db
        - name: DB_USER
          value: calculator_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
        - name: REDIS_HOST
          value: redis
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: calculator-service
  namespace: calculator
spec:
  selector:
    app: calculator-service
  ports:
  - port: 4002
    targetPort: 4002
EOF

# User Service
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: user-service
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: user-service
  template:
    metadata:
      labels:
        app: user-service
    spec:
      containers:
      - name: user-service
        image: $ECR/calc-user-service:latest
        ports:
        - containerPort: 4003
        env:
        - name: PORT
          value: "4003"
        - name: NODE_ENV
          value: production
        - name: DB_HOST
          value: postgres
        - name: DB_NAME
          value: calculator_db
        - name: DB_USER
          value: calculator_user
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: db-password
        - name: REDIS_HOST
          value: redis
---
apiVersion: v1
kind: Service
metadata:
  name: user-service
  namespace: calculator
spec:
  selector:
    app: user-service
  ports:
  - port: 4003
    targetPort: 4003
EOF

# API Gateway
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api-gateway
  namespace: calculator
spec:
  replicas: 2
  selector:
    matchLabels:
      app: api-gateway
  template:
    metadata:
      labels:
        app: api-gateway
    spec:
      containers:
      - name: api-gateway
        image: $ECR/calc-api-gateway:latest
        ports:
        - containerPort: 4000
        env:
        - name: PORT
          value: "4000"
        - name: NODE_ENV
          value: production
        - name: AUTH_SERVICE_URL
          value: http://auth-service:4001
        - name: CALC_SERVICE_URL
          value: http://calculator-service:4002
        - name: USER_SERVICE_URL
          value: http://user-service:4003
        - name: REDIS_HOST
          value: redis
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: calculator-secrets
              key: jwt-secret
---
apiVersion: v1
kind: Service
metadata:
  name: api-gateway
  namespace: calculator
spec:
  selector:
    app: api-gateway
  ports:
  - port: 4000
    targetPort: 4000
EOF

# Frontend
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
          value: http://api-gateway:4000
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

### Step 6 — Create Load Balancer Ingress

```bash
# Install AWS Load Balancer Controller
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Apply ingress
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
            name: api-gateway
            port:
              number: 4000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 3000
EOF
```

### Step 7 — Get Public URL

```bash
# Wait for load balancer to be assigned
kubectl get ingress -n calculator

# Get the ADDRESS column — that is your public URL
# Example: k8s-calculat-xxx.us-east-1.elb.amazonaws.com
```

### Step 8 — Verify Everything Running

```bash
# Check all pods are Running
kubectl get pods -n calculator

# Check all services
kubectl get services -n calculator

# View logs of a pod
kubectl logs -n calculator deployment/auth-service
kubectl logs -n calculator deployment/api-gateway

# Scale a service up or down
kubectl scale deployment calculator-service --replicas=3 -n calculator
```

### Cleanup — Delete Everything

```bash
# Delete the cluster (stops all billing)
eksctl delete cluster --name calculator-cluster --region us-east-1

# Delete ECR images
aws ecr delete-repository --repository-name calc-api-gateway        --force --region us-east-1
aws ecr delete-repository --repository-name calc-auth-service       --force --region us-east-1
aws ecr delete-repository --repository-name calc-calculator-service --force --region us-east-1
aws ecr delete-repository --repository-name calc-user-service       --force --region us-east-1
aws ecr delete-repository --repository-name calc-frontend           --force --region us-east-1
```

---

## Deployment Comparison

| Factor           | Bare Metal EC2        | Docker EC2            | Kubernetes EKS              |
|------------------|-----------------------|-----------------------|-----------------------------|
| Complexity       | Medium                | Low                   | High                        |
| Cost             | Low (~$30/mo)         | Low (~$30/mo)         | High (~$150+/mo)            |
| Scaling          | Manual                | Manual                | Automatic                   |
| Fault tolerance  | None                  | Container restart     | Pod auto-healing            |
| Best for         | Learning / small apps | Staging / small prod  | Large scale production      |
| Setup time       | ~1 hour               | ~30 minutes           | ~2 hours                    |
| Zero downtime    | No                    | No                    | Yes (rolling updates)       |

---

## Git — Push Branch 3

```bash
cd ~/Calculator
git checkout main
git checkout -b branch-3
git add .
git commit -m "feat: Branch 3 - Microservices + Redis + Docker"
git push -u origin branch-3
```

---

## What You Learn in Branch 3

- Microservices architecture — each service owns its domain
- API Gateway pattern — single entry point, JWT verified once
- Redis for caching, rate limiting, and token blacklisting
- Docker and Docker Compose — containerizing Node.js apps
- Multi-stage Docker builds for production images
- Deploying to EC2 with PM2 and Nginx
- Containerized deployment with Docker Compose on EC2
- Kubernetes on EKS — pods, services, ingress, secrets, scaling

---

*All three branches complete. Branch 1 = basics, Branch 2 = database + auth, Branch 3 = microservices.*
