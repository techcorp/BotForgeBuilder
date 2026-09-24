# Quick Start Guide

Get up and running with BotForgeBuilder in 10 minutes!

## 5-Minute Setup

### Step 1: Clone & Install (2 min)
```bash
git clone https://github.com/techcorp/BotForgeBuilder.git
cd BotForgeBuilder
docker-compose up -d
```

### Step 2: Register Account (1 min)
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "you@example.com",
    "password": "SecurePass123",
    "firstName": "Your Name",
    "companyName": "Your Company"
  }'
```

Save the `token` from response.

### Step 3: Create Bot (1 min)
```bash
TOKEN="your-token-from-above"

curl -X POST http://localhost:3000/api/v1/bots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First Bot",
    "businessName": "Your Company",
    "businessType": "retail",
    "businessDetails": "We sell amazing products",
    "tone": "Friendly",
    "language": "English",
    "model": {"id": "claude-3-5-sonnet", "name": "Claude 3.5 Sonnet"}
  }'
```

Save the `bot.id` from response.

### Step 4: Publish Bot (1 min)
```bash
BOT_ID="your-bot-id-from-above"

curl -X POST http://localhost:3000/api/v1/bots/$BOT_ID/publish \
  -H "Authorization: Bearer $TOKEN"
```

**Your bot is now live! 🎉**

---

## Web UI Quick Start

### 1. Open Application
Visit http://localhost:3000

### 2. Register
- Click "Sign Up"
- Enter email, password, name, company
- Click "Create Account"

### 3. Create Bot
- Click "New Chatbot"
- Fill in business information:
  - **Name**: "Customer Support"
  - **Business Type**: Select one (e.g., "Retail")
  - **Details**: "We help customers 24/7"
- Click "Next"

### 4. Configure Personality
- **Tone**: Choose from Friendly, Professional, Casual
- **Language**: Select language
- **Welcome Message**: "Hello! How can I help?"
- Click "Next"

### 5. Select AI Model
- Choose Claude 3.5 Sonnet
- Click "Next"

### 6. Review & Publish
- Review your configuration
- Click "Save Chatbot"
- Once created, click "Publish" to make it live

---

## First Bot in 5 Steps

### Step 1: Gather Information
Prepare:
- Business name
- What the bot does
- Tone of voice
- Your name
- Email address

### Step 2: Create Account
Navigate to http://localhost:3000 → "Sign Up"

### Step 3: Create New Bot
Click "New Chatbot" button

### Step 4: Fill in Details
Complete all steps:
1. Business Information
2. Personality (tone, language)
3. AI Model Selection
4. Review

### Step 5: Publish
Click "Publish" to make bot live

---

## Common Tasks

### Export Bot as HTML
```bash
curl -X POST http://localhost:3000/api/v1/bots/$BOT_ID/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "html"}' > my-bot.html
```

### Get Embed Code for Website
```bash
curl -X POST http://localhost:3000/api/v1/bots/$BOT_ID/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "iframe"}'
```

### View Bot Analytics
```bash
curl http://localhost:3000/api/v1/analytics/bots/$BOT_ID \
  -H "Authorization: Bearer $TOKEN" | jq '.data.metrics'
```

### Invite Team Member
```bash
TEAM_ID="your-team-id"

curl -X POST http://localhost:3000/api/v1/teams/$TEAM_ID/members \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teammate@company.com",
    "role": "editor"
  }'
```

### Create API Key for Developers
```bash
curl -X POST http://localhost:3000/api/v1/api-keys \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Development API",
    "permissions": ["bots:read", "conversations:read"]
  }'
```

---

## Next Steps

### Learn More
- [Full API Documentation](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Integrate
- [Slack Integration](./API.md#slack)
- [Discord Integration](./API.md#discord)
- [Custom Webhooks](./WEBHOOKS.md)

### Deploy
- [Docker](./DEPLOYMENT.md#docker)
- [Vercel](./DEPLOYMENT.md#vercel)
- [AWS](./DEPLOYMENT.md#self-hosted)
- [Kubernetes](./DEPLOYMENT.md#kubernetes)

---

## Useful Commands

### Docker
```bash
# View logs
docker-compose logs -f app

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Remove everything (warning: deletes data)
docker-compose down -v
```

### API
```bash
# Health check
curl http://localhost:3000/api/health

# List your bots
curl http://localhost:3000/api/v1/bots \
  -H "Authorization: Bearer $TOKEN"

# Get bot details
curl http://localhost:3000/api/v1/bots/$BOT_ID \
  -H "Authorization: Bearer $TOKEN"
```

### Database
```bash
# Connect to MongoDB
mongosh "mongodb://admin:password@localhost:27017/botforge?authSource=admin"

# List collections
show collections

# Count bots
db.bots.countDocuments()
```

---

## Troubleshooting

### Can't connect to API
```bash
# Check if services are running
docker-compose ps

# Check logs
docker-compose logs app

# Verify health
curl http://localhost:3000/api/health
```

### Forgot password?
```bash
# Delete user and register again
mongosh "mongodb://admin:password@localhost:27017/botforge?authSource=admin"
db.users.deleteOne({email: "your@email.com"})
```

### Bot not responding
1. Check bot is published (has "published" status)
2. Check model is set correctly
3. Verify ANTHROPIC_API_KEY is configured

### MongoDB connection error
```bash
# Check MongoDB is running
docker-compose ps mongodb

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb
```

---

## Video Tutorials

Want visual walkthroughs? We have videos for:
- [5-minute setup](https://youtube.com/botforge)
- [Creating your first bot](https://youtube.com/botforge)
- [Configuring integrations](https://youtube.com/botforge)
- [Viewing analytics](https://youtube.com/botforge)

---

## Get Help

- 💬 **Discord**: [Join Community](https://discord.gg/botforge)
- 📧 **Email**: support@botforge.com
- 📚 **Docs**: [Full Documentation](./README.md)
- 🐛 **Issues**: [GitHub Issues](https://github.com/techcorp/BotForgeBuilder/issues)

---

## What's Next?

1. **Explore Features**: Try creating multiple bots with different personalities
2. **Integrate**: Connect to Slack or Discord
3. **Deploy**: Deploy to production with Docker or Kubernetes
4. **Invite Team**: Add team members to collaborate
5. **Scale**: Create more sophisticated bots and integrations

**Happy bot building! 🤖**
