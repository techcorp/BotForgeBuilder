# Deployment Guide

BotForgeBuilder can be deployed to multiple platforms. Choose the option that best fits your needs.

## Table of Contents
1. [Docker (Recommended)](#docker-recommended)
2. [Vercel](#vercel)
3. [Self-Hosted (AWS/GCP/Azure)](#self-hosted)
4. [Kubernetes](#kubernetes)
5. [Environment Setup](#environment-setup)
6. [Database Migration](#database-migration)
7. [Monitoring](#monitoring)

---

## Docker (Recommended)

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+
- MongoDB (included in docker-compose)

### Local Development
```bash
# Clone repository
git clone https://github.com/techcorp/BotForgeBuilder.git
cd BotForgeBuilder

# Create environment file
cp .env.development .env.local

# Start services
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop services
docker-compose down
```

### Staging Deployment
```bash
# Build image
docker build -t botforge:staging .

# Tag for registry
docker tag botforge:staging ghcr.io/techcorp/botforge:staging

# Push to registry
docker push ghcr.io/techcorp/botforge:staging

# Deploy on server
ssh user@staging.botforge.com
docker pull ghcr.io/techcorp/botforge:staging
docker-compose -f docker-compose.prod.yml up -d
```

### Production Deployment
```bash
# Build with version tag
docker build -t botforge:v1.0.0 .

# Tag for production
docker tag botforge:v1.0.0 ghcr.io/techcorp/botforge:v1.0.0
docker tag botforge:v1.0.0 ghcr.io/techcorp/botforge:latest

# Push to registry
docker push ghcr.io/techcorp/botforge:v1.0.0
docker push ghcr.io/techcorp/botforge:latest

# Deploy using GitHub Actions (automatic on tag push)
git tag v1.0.0
git push origin v1.0.0
```

---

## Vercel

### Prerequisites
- Vercel account
- MongoDB Atlas account
- GitHub repository

### Setup Steps

1. **Connect Repository**
   ```bash
   # Push to GitHub
   git push origin main
   ```

2. **Import Project in Vercel**
   - Go to https://vercel.com/new
   - Select GitHub repository
   - Click "Import"

3. **Configure Environment**
   - Add environment variables:
     - `MONGODB_URI` (from MongoDB Atlas)
     - `JWT_SECRET` (generate random string)
     - `ANTHROPIC_API_KEY`
     - `ZEN_API_KEY`

4. **Deploy**
   ```bash
   # Vercel auto-deploys on push
   git push origin main
   ```

5. **Verify**
   - Check deployment at https://botforge.vercel.app
   - Test API: `curl https://botforge.vercel.app/api/health`

### Important Notes
- Vercel Serverless Functions have 10-second timeout limit
- Use MongoDB Atlas for database (serverless compatible)
- Consider Vercel KV for caching if needed

---

## Self-Hosted

### AWS EC2 Deployment

#### Prerequisites
- AWS Account
- EC2 instance (t3.medium or larger)
- Ubuntu 22.04 LTS
- Domain name

#### Installation Steps

1. **SSH into Instance**
   ```bash
   ssh -i key.pem ubuntu@ec2-instance-ip
   ```

2. **Install Dependencies**
   ```bash
   # Update system
   sudo apt update && sudo apt upgrade -y

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo usermod -aG docker ubuntu

   # Install Docker Compose
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose

   # Install Nginx
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Clone and Setup**
   ```bash
   cd /opt
   git clone https://github.com/techcorp/BotForgeBuilder.git
   cd BotForgeBuilder
   cp .env.production .env
   # Edit .env with production values
   ```

4. **Start Services**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

5. **Configure Nginx**
   ```bash
   sudo nano /etc/nginx/sites-available/botforge
   ```
   
   ```nginx
   server {
       server_name api.botforge.com;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

   ```bash
   sudo ln -s /etc/nginx/sites-available/botforge /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

6. **Enable SSL**
   ```bash
   sudo certbot --nginx -d api.botforge.com
   ```

7. **Setup Auto-Updates**
   ```bash
   # Create update script
   cat > /opt/BotForgeBuilder/scripts/update.sh << 'EOF'
   #!/bin/bash
   cd /opt/BotForgeBuilder
   git pull origin main
   docker-compose pull
   docker-compose -f docker-compose.prod.yml up -d
   EOF

   chmod +x /opt/BotForgeBuilder/scripts/update.sh

   # Add to crontab
   crontab -e
   # Add: 0 2 * * * /opt/BotForgeBuilder/scripts/update.sh
   ```

#### Monitoring & Logs
```bash
# View application logs
docker-compose logs -f app

# View MongoDB logs
docker-compose logs -f mongodb

# Check resource usage
docker stats
```

---

## Kubernetes

### Prerequisites
- Kubernetes cluster (EKS, GKE, AKS, or self-hosted)
- kubectl configured
- Helm (optional)

### Deployment

1. **Create Namespace**
   ```bash
   kubectl create namespace botforge
   ```

2. **Create Secrets**
   ```bash
   kubectl create secret generic botforge-secrets \
     --from-literal=mongodb-uri=mongodb+srv://... \
     --from-literal=jwt-secret=... \
     --from-literal=anthropic-api-key=... \
     -n botforge
   ```

3. **Deploy Application**
   ```bash
   kubectl apply -f k8s/deployment.yaml -n botforge
   kubectl apply -f k8s/service.yaml -n botforge
   kubectl apply -f k8s/ingress.yaml -n botforge
   ```

4. **Verify Deployment**
   ```bash
   kubectl get pods -n botforge
   kubectl logs -f deployment/botforge-app -n botforge
   ```

### Scaling

```bash
# Scale to 3 replicas
kubectl scale deployment botforge-app --replicas=3 -n botforge

# Auto-scale based on CPU
kubectl autoscale deployment botforge-app --min=3 --max=10 --cpu-percent=80 -n botforge
```

---

## Environment Setup

### Required Environment Variables

**Production**:
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/botforge
JWT_SECRET=<generate-strong-secret>
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_API_URL=https://api.botforge.com
SENTRY_DSN=https://...
```

**Staging**:
```bash
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging-cluster.mongodb.net/botforge
JWT_SECRET=<generate-secret>
NEXT_PUBLIC_API_URL=https://staging-api.botforge.com
```

### Generate JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Database Migration

### MongoDB Atlas Setup

1. **Create Cluster**
   - Go to https://www.mongodb.com/cloud/atlas
   - Create organization and cluster
   - Choose M10 or larger for production

2. **Configure Network Access**
   - Add IP whitelist
   - Create database user
   - Get connection string

3. **Initialize Database**
   ```bash
   # The mongo-init.js script runs automatically
   # Or manually run:
   mongosh "mongodb+srv://user:pass@cluster.mongodb.net/botforge" < scripts/mongo-init.js
   ```

### Backup Strategy

```bash
# Backup MongoDB
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/botforge" --out=./backup

# Restore MongoDB
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/botforge" ./backup
```

---

## Monitoring

### Health Check

```bash
curl https://api.botforge.com/api/health
```

Expected response (200):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

### Logging

Set `LOG_LEVEL` environment variable:
- `DEBUG` - Verbose logging
- `INFO` - Normal logging
- `WARN` - Warnings and errors only
- `ERROR` - Errors only

### Error Tracking (Sentry)

1. **Create Sentry Project**
   - Go to https://sentry.io
   - Create organization and project
   - Get DSN

2. **Configure**
   ```bash
   SENTRY_DSN=https://key@sentry.io/project-id
   ```

3. **Test**
   ```bash
   # Trigger error to test
   curl https://api.botforge.com/api/test-error
   ```

### Performance Monitoring

Monitor key metrics:
- API response times
- Database query performance
- Error rate
- Request volume by endpoint
- Rate limit violations

---

## Troubleshooting

### Common Issues

**MongoDB Connection Fails**
```bash
# Check connection string
mongosh "mongodb+srv://user:pass@cluster.mongodb.net/botforge" --eval "db.runCommand('ping')"
```

**High Memory Usage**
```bash
# Reduce NODE memory limit
export NODE_OPTIONS="--max-old-space-size=512"
```

**SSL Certificate Issues**
```bash
# Renew Certbot certificate
sudo certbot renew --dry-run
```

**Docker Build Fails**
```bash
# Clean build
docker system prune -a
docker build --no-cache -t botforge:latest .
```

---

## Next Steps

1. Set up monitoring with Sentry
2. Configure backup strategy
3. Set up CI/CD with GitHub Actions
4. Configure CDN for static assets (Cloudflare/CloudFront)
5. Set up database replication for high availability

---

## Support

For deployment issues:
- Check logs: `docker-compose logs app`
- Health check: `curl /api/health`
- Documentation: Check relevant deployment docs above
- GitHub Issues: Report issues on repository
