# Installation Guide

Complete guide to install and setup BotForgeBuilder locally or in production.

## Table of Contents
1. [Local Development](#local-development)
2. [Docker Setup](#docker-setup)
3. [Manual Setup](#manual-setup)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Local Development

### Prerequisites
- Node.js 18+ ([Download](https://nodejs.org))
- npm or yarn
- Git
- MongoDB 5.0+ (or MongoDB Atlas account)

### Quick Start (Docker - Recommended)

```bash
# Clone repository
git clone https://github.com/techcorp/BotForgeBuilder.git
cd BotForgeBuilder

# Start services (MongoDB + App)
docker-compose up -d

# Wait for services to start
sleep 10

# Check logs
docker-compose logs -f app

# Application ready at http://localhost:3000
```

**To stop**:
```bash
docker-compose down
```

### Quick Start (Manual)

```bash
# Clone repository
git clone https://github.com/techcorp/BotForgeBuilder.git
cd BotForgeBuilder

# Install dependencies
npm install

# Setup environment
cp .env.example .env.local

# Edit .env.local with your MongoDB URI
nano .env.local

# Run migrations
npm run migrate

# Start development server
npm run dev

# Application ready at http://localhost:3000
```

---

## Docker Setup

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Installation

1. **Install Docker**
   - [Windows](https://docs.docker.com/desktop/install/windows-install/)
   - [Mac](https://docs.docker.com/desktop/install/mac-install/)
   - [Linux](https://docs.docker.com/engine/install/)

2. **Verify Installation**
   ```bash
   docker --version
   docker-compose --version
   ```

### Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Remove volumes (warning: deletes data)
docker-compose down -v

# Rebuild after code changes
docker-compose build && docker-compose up -d
```

### Environment File for Docker

Create `.env` file:
```bash
# Copy from example
cp .env.example .env

# Or create manually
cat > .env << 'EOF'
NODE_ENV=development
MONGODB_URI=mongodb://admin:password@mongodb:27017/botforge?authSource=admin
JWT_SECRET=dev-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
ANTHROPIC_API_KEY=sk-ant-...
EOF
```

### Accessing Services

- **Application**: http://localhost:3000
- **MongoDB**: mongodb://localhost:27017
- **API**: http://localhost:3000/api

---

## Manual Setup

### Step 1: Install Node.js

Download from [nodejs.org](https://nodejs.org) (v18+)

Verify installation:
```bash
node --version
npm --version
```

### Step 2: Clone Repository

```bash
git clone https://github.com/techcorp/BotForgeBuilder.git
cd BotForgeBuilder
```

### Step 3: Install Dependencies

```bash
npm install
```

Or with yarn:
```bash
yarn install
```

### Step 4: Setup MongoDB

**Option A: MongoDB Atlas (Cloud)**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M10 or larger for production)
4. Get connection string
5. Update `MONGODB_URI` in `.env.local`

**Option B: Local MongoDB**
```bash
# macOS (with Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows
# Download from https://www.mongodb.com/try/download/community
```

### Step 5: Setup Environment

```bash
# Copy template
cp .env.example .env.local

# Edit with your values
nano .env.local
# or
code .env.local
```

**Required values**:
```
MONGODB_URI=mongodb://localhost:27017/botforge
JWT_SECRET=generate-a-random-secret
ANTHROPIC_API_KEY=sk-ant-... (optional for development)
```

**Generate JWT Secret**:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 6: Run Migrations

```bash
npm run migrate
```

Or manually:
```bash
# Connect to MongoDB and run init script
mongosh $MONGODB_URI < scripts/mongo-init.js
```

### Step 7: Start Development Server

```bash
npm run dev
```

Server runs on http://localhost:3000

### Step 8: Verify Installation

```bash
# Check API health
curl http://localhost:3000/api/health

# Expected response
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0"
}
```

---

## Database Setup

### MongoDB Atlas (Recommended for Production)

1. **Create Account**
   - Go to https://www.mongodb.com/cloud/atlas
   - Sign up for free

2. **Create Cluster**
   - Click "Create Deployment"
   - Choose M10 or larger
   - Select region close to your users
   - Wait 5-10 minutes for cluster to initialize

3. **Configure Network Access**
   - Go to "Network Access"
   - Add your IP address
   - Or allow 0.0.0.0/0 for development (not production!)

4. **Create Database User**
   - Go to "Database Access"
   - Click "Add New Database User"
   - Set username and password
   - Create user

5. **Get Connection String**
   - Click "Connect" on cluster
   - Choose "Drivers" option
   - Copy connection string
   - Replace `<username>` and `<password>`

6. **Initialize Database**
   ```bash
   mongosh "your-connection-string" < scripts/mongo-init.js
   ```

### Local MongoDB

```bash
# Start MongoDB
mongod

# Connect
mongosh

# Initialize database
mongosh < scripts/mongo-init.js
```

### Backup & Restore

```bash
# Backup
mongodump --uri="$MONGODB_URI" --out=./backup

# Restore
mongorestore --uri="$MONGODB_URI" ./backup
```

---

## Environment Configuration

### Development

`.env.development`:
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/botforge
JWT_SECRET=dev-secret
NEXT_PUBLIC_API_URL=http://localhost:3000
LOG_LEVEL=DEBUG
ANTHROPIC_API_KEY=optional
```

### Staging

`.env.staging`:
```
NODE_ENV=staging
MONGODB_URI=mongodb+srv://user:pass@staging.mongodb.net/botforge
JWT_SECRET=generate-strong-secret
NEXT_PUBLIC_API_URL=https://staging-api.botforge.com
LOG_LEVEL=INFO
ANTHROPIC_API_KEY=your-api-key
```

### Production

`.env.production`:
```
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@production.mongodb.net/botforge
JWT_SECRET=very-strong-secret
NEXT_PUBLIC_API_URL=https://api.botforge.com
LOG_LEVEL=WARN
ANTHROPIC_API_KEY=your-api-key
SENTRY_DSN=https://...
```

---

## Verification

### Health Check

```bash
curl http://localhost:3000/api/health
```

Expected: `200 OK` with status "healthy"

### Test Registration

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPassword123",
    "firstName": "Test",
    "lastName": "User"
  }'
```

Expected: `201 Created` with user data and token

### Test Bot Creation

```bash
TOKEN="from-registration-response"

curl -X POST http://localhost:3000/api/v1/bots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "businessName": "Test Corp",
    "businessType": "retail",
    "businessDetails": "Test business"
  }'
```

Expected: `201 Created` with bot data

---

## Troubleshooting

### MongoDB Connection Failed

**Error**: `MongooseError: Cannot connect to MongoDB`

**Solutions**:
```bash
# 1. Check MongoDB is running
mongosh localhost:27017

# 2. Verify connection string
echo $MONGODB_URI

# 3. Test connection
mongosh "$MONGODB_URI"

# 4. Check credentials
# Ensure username and password are correct

# 5. Check firewall
# Port 27017 should be open
```

### Node Modules Issue

**Error**: `Cannot find module`

**Solutions**:
```bash
# Clear node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Clear cache
npm cache clean --force && npm install
```

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::3000`

**Solutions**:
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

### Docker Issues

**Container won't start**:
```bash
docker-compose logs app
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

**Permission denied**:
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

### Environment Variables Not Loaded

**Solutions**:
```bash
# Check .env file exists
ls -la .env.local

# Check variables are set
echo $MONGODB_URI
echo $JWT_SECRET

# Restart server
npm run dev
```

### Database Migration Failed

**Solutions**:
```bash
# Check MongoDB connection
mongosh "$MONGODB_URI"

# Run migration manually
mongosh "$MONGODB_URI" < scripts/mongo-init.js

# Check existing collections
db.listCollections()
```

### Performance Issues

**High memory usage**:
```bash
# Limit Node memory
export NODE_OPTIONS="--max-old-space-size=512"
npm run dev
```

**Slow API responses**:
```bash
# Check MongoDB performance
mongosh "$MONGODB_URI"
db.bots.explain("executionStats").find({}).limit(10)

# Verify indexes
db.bots.getIndexes()
```

---

## Next Steps

1. ✅ [Quick Start Tutorial](./QUICKSTART.md)
2. ✅ [Architecture Overview](./ARCHITECTURE.md)
3. ✅ [API Documentation](./API.md)
4. ✅ [Deployment Guide](./DEPLOYMENT.md)

---

## Support

Having issues? Check:
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
- [FAQ](./FAQ.md)
- [GitHub Issues](https://github.com/techcorp/BotForgeBuilder/issues)
- Email: support@botforge.com
