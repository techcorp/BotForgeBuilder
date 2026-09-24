# Frequently Asked Questions

## General Questions

### What is BotForgeBuilder?
BotForgeBuilder is an enterprise-grade platform for creating, deploying, and managing AI chatbots. It provides a no-code bot builder, team collaboration features, analytics, and integrations with popular platforms.

### Who should use BotForgeBuilder?
- Businesses wanting to deploy customer support chatbots
- Teams managing multiple bots
- Enterprises needing compliance and analytics
- Developers building bot-powered applications

### What are the pricing tiers?
**Free**: 3 bots, basic analytics, single user
**Pro**: 50 bots, advanced analytics, 5 team members, integrations
**Enterprise**: Unlimited bots, custom integrations, SLA, support

Contact sales@botforge.com for pricing details.

### Can I self-host BotForgeBuilder?
Yes! We provide Docker, Kubernetes, and AWS deployment options. See [Deployment Guide](./DEPLOYMENT.md).

---

## Technical Questions

### What AI models does it support?
- Claude 3.5 Sonnet (default)
- Claude 3 Opus
- Claude 3 Haiku
- Custom models via API

Set via `model` field when creating bots.

### How do I add my own AI model?
Currently supported models are limited to Anthropic. Custom models are planned for Q2 2024.

For now, you can:
1. Fork the repository
2. Modify `/pages/api/chat.js`
3. Add your model provider
4. Deploy your version

### Does it support multiple languages?
Yes! Set language when creating bot. Supports 100+ languages. The bot will respond in the selected language.

### How do I add Slack integration?
1. Create Slack webhook URL
2. Go to "Integrations" → "New Integration"
3. Select "Slack"
4. Paste webhook URL
5. Choose which bots send events to Slack
6. Click "Connect"

### Can I use the API programmatically?
Yes! Full REST API v1 available. See [API Documentation](./API.md).

**Example** (Python):
```python
import requests

token = "your-jwt-token"
headers = {"Authorization": f"Bearer {token}"}

# List bots
response = requests.get(
  "https://api.botforge.com/api/v1/bots",
  headers=headers
)
bots = response.json()["data"]["bots"]
```

### What's the rate limit?
- Authenticated requests: 100/minute
- Export endpoint: 20/minute
- API keys: Configurable per key
- Webhooks: Unlimited (queued)

### Can I white-label BotForgeBuilder?
Yes, for Enterprise customers. Contact sales@botforge.com.

---

## Deployment & Infrastructure

### What's the minimum system requirement?
**Development**:
- 2 GB RAM
- 1 CPU core
- 5 GB disk

**Production**:
- 4 GB RAM
- 2 CPU cores
- 20 GB disk
- MongoDB M10+ cluster

### Can I run it on my laptop?
Yes! For development:
```bash
docker-compose up -d
```

For production, use cloud deployment.

### Which cloud platforms are supported?
- AWS (EC2, ECS, EKS)
- Google Cloud (GKE, Cloud Run)
- Azure (Container Instances, AKS)
- DigitalOcean
- Heroku (via Docker)
- Vercel

### How do I backup my data?
```bash
# Backup MongoDB
mongodump --uri="$MONGODB_URI" --out=./backup

# Backup everything
docker-compose exec mongodb mongodump --out=/backup
docker cp mongodb:/backup ./local-backup
```

### What's the uptime guarantee?
- Free: 95%
- Pro: 99%
- Enterprise: 99.9% with SLA

---

## Security & Compliance

### Is my data encrypted?
- **In transit**: TLS 1.3 (HTTPS)
- **At rest**: AES-256 (MongoDB Enterprise)
- **API keys**: SHA-256 hashed

### Do you comply with GDPR?
Yes. We provide:
- Data processing agreement
- Right to deletion
- Data portability
- Privacy by design

Contact compliance@botforge.com for DPA.

### Is HIPAA compliant?
Enterprise plan includes HIPAA compliance. Contact sales@botforge.com.

### Can I audit who accessed my bots?
Yes! Every action is logged:
```bash
curl https://api.botforge.com/api/v1/audit-logs \
  -H "Authorization: Bearer $TOKEN"
```

Filter by:
- User
- Action (CREATE, UPDATE, DELETE, PUBLISH)
- Date range
- Resource type

### How long are logs retained?
- Free: 30 days
- Pro: 90 days
- Enterprise: 365 days (customizable)

---

## Analytics & Usage

### How often is analytics data updated?
Real-time for:
- Conversation count
- Message count
- User count

Daily aggregation for:
- Sentiment analysis
- Topic detection
- Resolution rates

### Can I export analytics?
Yes, multiple formats:
- JSON (API)
- CSV (UI)
- PDF report (Pro/Enterprise)

### What metrics are available?
- Total conversations
- Total messages
- Unique users
- Response time
- Satisfaction score
- Sentiment breakdown
- Resolution rates
- Traffic sources
- Top topics
- Hourly breakdown

### Can I see individual conversations?
Yes, in Enterprise plan. Free/Pro see aggregated metrics only.

---

## Team & Collaboration

### Can I have multiple team members?
Yes:
- Free: 1 member
- Pro: 5 members
- Enterprise: Unlimited

Add members via "Teams" → "Invite".

### What roles are available?
- **Admin**: Full access, manage members
- **Manager**: Manage bots, view analytics
- **Editor**: Create/edit bots
- **Viewer**: Read-only access

### Can team members use the API?
Yes! Each team member can:
1. Create API keys
2. Scope permissions
3. Set IP restrictions
4. Configure rate limits

### How do I invite a team member?
```bash
curl -X POST https://api.botforge.com/api/v1/teams/{teamId}/members \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"email": "user@example.com", "role": "editor"}'
```

Or via UI: Teams → Invite → Enter email.

---

## Integrations

### Which integrations are available?
- ✅ Slack
- ✅ Discord
- ✅ Microsoft Teams
- ✅ Telegram
- ✅ Custom webhooks
- 🔄 Zendesk (coming)
- 🔄 Intercom (coming)

### Can I create custom integrations?
Yes! Use webhooks:
1. Create webhook endpoint
2. Subscribe to bot events
3. Receive POST requests with conversation data
4. Process as needed

See [Webhook Documentation](./WEBHOOKS.md).

### Can multiple bots send to the same Slack channel?
Yes! Create one integration per bot, all with same webhook URL.

### Do webhooks retry on failure?
Yes, with exponential backoff:
- Max retries: Configurable (default 3)
- Delay: Configurable (default 5s)

---

## Common Issues

### Bot not responding
**Check**:
1. Is bot published? (status should be "published")
2. Is model configured?
3. Is AI API key set? (ANTHROPIC_API_KEY)
4. Are there conversation errors in logs?

**Fix**:
```bash
# Publish bot
curl -X POST https://api.botforge.com/api/v1/bots/{botId}/publish \
  -H "Authorization: Bearer $TOKEN"

# Check logs
docker-compose logs app
```

### Can't login
**Check**:
1. Correct email?
2. Correct password?
3. Account not deactivated?

**Reset**:
1. Try "Forgot Password" (if available)
2. Or delete user in MongoDB and re-register

### API returns 429 (Too Many Requests)
Rate limit exceeded. Response includes:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

**Fix**:
1. Wait until reset time
2. Implement exponential backoff
3. For API: create key with higher limits

### MongoDB connection fails
**Check**:
1. Connection string correct?
2. Username/password correct?
3. IP whitelisted?
4. Network access enabled?

**Fix**:
```bash
mongosh "$MONGODB_URI"
```

If this fails, fix connection string.

---

## Performance & Scaling

### How many bots can I create?
Depends on plan:
- Free: 3 bots
- Pro: 50 bots
- Enterprise: Unlimited

Can request higher limits.

### How many conversations can a bot handle?
Theoretically unlimited, but:
- Single instance: 100+ concurrent
- Load balanced (3+): 1000+ concurrent
- Kubernetes cluster: 10,000+ concurrent

### How do I scale horizontally?
Use Kubernetes:
```bash
kubectl scale deployment botforge-app --replicas=10
```

Or enable autoscaling:
```yaml
HorizontalPodAutoscaler:
  minReplicas: 3
  maxReplicas: 10
  targetCPUUtilization: 80%
```

### What's the response time?
- API: 20-100ms
- Chat: 500ms-2s (depends on model)
- Analytics: 100-500ms

---

## Account & Billing

### How do I upgrade my plan?
1. Go to "Settings" → "Billing"
2. Select desired plan
3. Enter payment info
4. Upgrade complete

Or contact sales@botforge.com.

### Can I cancel anytime?
Yes! Cancel anytime:
1. Go to "Settings" → "Billing"
2. Click "Cancel Subscription"
3. Your access continues until period end

### Do you offer discounts?
- Annual billing: 20% discount
- Volume discounts: Contact sales@botforge.com
- Non-profits: 50% discount

### What payment methods do you accept?
- Credit card (Visa, Mastercard, Amex)
- Bank transfer (Enterprise)
- Purchase orders (Enterprise)

---

## Support & Help

### How do I get help?
- 📧 Email: support@botforge.com
- 💬 Discord: [discord.gg/botforge](https://discord.gg/botforge)
- 📖 Docs: [botforge.com/docs](https://botforge.com/docs)
- 🐛 Issues: [GitHub Issues](https://github.com/techcorp/BotForgeBuilder/issues)

### What's the response time for support?
- Free: 48 hours
- Pro: 24 hours
- Enterprise: 1 hour (SLA)

### Do you offer training?
Yes! Available for:
- Pro plan: Group training
- Enterprise: Dedicated training

Contact training@botforge.com.

### Is there a community?
Yes! Join:
- Discord: [discord.gg/botforge](https://discord.gg/botforge)
- Reddit: r/botforge
- GitHub Discussions

---

## Data & Privacy

### Where is my data stored?
Default: US (AWS us-east-1)
Options: EU, APAC, Custom

Select region when creating account.

### Can I transfer my data out?
Yes! Export all data via API:
```bash
# Export bots
curl https://api.botforge.com/api/v1/bots/export

# Backup database
mongodump --uri="$MONGODB_URI"
```

### Do you share my data with third parties?
No. We never share data except as required by law.

See [Privacy Policy](../PRIVACY.md).

### How long do you keep data after I delete my account?
- Deleted immediately
- Backups kept for 7 days (recoverable)
- Then permanently deleted

---

## Advanced Questions

### Can I modify the source code?
Yes! It's open source under MIT license. See [GitHub](https://github.com/techcorp/BotForgeBuilder).

### How do I contribute?
1. Fork repository
2. Create feature branch
3. Submit pull request
4. We review and merge!

See [CONTRIBUTING.md](../CONTRIBUTING.md).

### Can I run an older version?
Yes, check out a tag:
```bash
git checkout v1.0.0
```

Older versions may have security issues. Update when possible.

### What's your development roadmap?
Check [GitHub Projects](https://github.com/techcorp/BotForgeBuilder/projects).

Latest priorities:
- [ ] Fine-tuning capability
- [ ] GPT-4 support
- [ ] Advanced RAG
- [ ] Mobile app

---

## Still have questions?

- Email: support@botforge.com
- Discord: [discord.gg/botforge](https://discord.gg/botforge)
- Twitter: [@botforge](https://twitter.com/botforge)
- GitHub Issues: [github.com/techcorp/BotForgeBuilder/issues](https://github.com/techcorp/BotForgeBuilder/issues)

We're here to help! 🤖
