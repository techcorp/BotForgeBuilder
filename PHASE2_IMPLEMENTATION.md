# Phase 2 Implementation: Backend APIs & Database

## What Was Completed

### 1. Enhanced Data Models ✅

#### Audit Log Model
- Tracks all user actions (CREATE, UPDATE, DELETE, LOGIN, EXPORT, PUBLISH)
- Resource tracking (BOT, TEAM, USER, WEBHOOK, API_KEY)
- IP address and user agent logging
- Indexed by user, team, resource for efficient queries
- Status tracking (SUCCESS/FAILURE)

#### Webhook Model
- Event subscription system for bot lifecycle
- Webhook URL management with validation
- Custom headers support
- Retry policy configuration (max retries, delay)
- Statistics tracking (total, successful, failed requests)
- Secret-based authentication for security

### 2. Data Validation Layer ✅

**`lib/validation.js`** provides reusable validation rules:
- Email format validation
- Password strength validation (8+ chars, uppercase, numbers)
- Bot field validation (name, business details, etc.)
- User registration validation
- Team data validation
- URL validation for webhooks

**Usage**:
```javascript
const errors = validateBotData(req.body);
if (errors) return res.status(400).json({ errors });
```

### 3. Audit Logging System ✅

**`lib/auditLog.js`** provides easy audit logging:
- `logAudit()` - Log any action with context
- `getAuditLogs()` - Query audit logs with filtering
- Automatic user, team, IP tracking
- Pagination support

**Usage**:
```javascript
await logAudit(req, "PUBLISH", "BOT", botId);
```

### 4. API Versioning ✅

All new endpoints are under `/api/v1/`:
- **Bot Management**: `/api/v1/bots/*`
- **Webhooks**: `/api/v1/webhooks/*`
- **Audit Logs**: `/api/v1/audit-logs`

Consistent response format:
```json
{
  "success": true,
  "data": { /* payload */ },
  "pagination": { /* optional */ }
}
```

### 5. Bot Management Endpoints ✅

#### `/api/v1/bots` (GET/POST)
- **GET**: List bots with pagination, filtering by status/businessType
- **POST**: Create new bot with validation
- Rate limited: 100 requests/minute
- Includes audit logging

#### `/api/v1/bots/{id}` (GET/PUT/DELETE)
- **GET**: Retrieve bot details (respects visibility)
- **PUT**: Update bot (owner only) with validation
- **DELETE**: Delete bot (owner only)
- Proper authorization checks
- Audit logging on updates/deletes

#### `/api/v1/bots/{id}/publish` (POST)
- Transition draft → published
- Validates required fields before publishing
- Records publish timestamp
- Audit logged

#### `/api/v1/bots/{id}/archive` (POST)
- Transition published → archived
- Soft delete (preserves data)
- Audit logged

#### `/api/v1/bots/{id}/export` (POST)
- **JSON format**: Download bot configuration
- **HTML format**: Standalone chatbot widget
- **iFrame format**: Embed code for websites
- **API format**: Integration guide with examples
- Rate limited: 20 requests/minute
- Audit logged

### 6. Webhook Management ✅

#### `/api/v1/webhooks` (GET/POST)
- **GET**: List team's webhooks with pagination
- **POST**: Create webhook with:
  - URL validation
  - Event selection
  - Custom headers
  - Auto-generated secret
- Audit logged

#### `/api/v1/webhooks/{id}` (GET/PUT/DELETE)
- **GET**: Retrieve webhook details (secret hidden)
- **PUT**: Update webhook configuration
- **DELETE**: Remove webhook
- Authorization checks
- Audit logged

### 7. Audit Logs API ✅

#### `/api/v1/audit-logs` (GET)
- Query team activity history
- Filter by:
  - Action (CREATE, UPDATE, DELETE, etc.)
  - Resource type (BOT, TEAM, WEBHOOK, etc.)
  - Date range
- Pagination support
- Populated user/team references
- Rate limited: 50 requests/minute

### 8. Comprehensive API Documentation ✅

**`docs/API.md`** includes:
- Complete endpoint reference
- Request/response examples
- Authentication details
- Error handling guide
- Rate limiting info
- Webhook event structure
- Code examples (Python, JavaScript, cURL)
- HTTP status codes reference

### 9. Export Functionality ✅

Supports multiple export formats:
- **JSON**: Bot configuration for backup/import
- **HTML**: Standalone chatbot interface
- **iFrame**: Embeddable widget code
- **API**: Integration documentation

### 10. Consistent Error Handling ✅

All v1 endpoints follow consistent patterns:
- Validation errors with field-level details
- Proper HTTP status codes
- Informative error messages
- Success/error response structure

---

## Files Created

```
lib/models/AuditLog.js           - Audit logging schema
lib/models/Webhook.js            - Webhook configuration schema
lib/validation.js                - Data validation rules
lib/auditLog.js                  - Audit logging utilities

pages/api/v1/bots/index.js       - List/Create bots
pages/api/v1/bots/[id].js        - Get/Update/Delete bots
pages/api/v1/bots/[id]/export.js - Export bot in multiple formats
pages/api/v1/bots/[id]/publish.js - Publish bot
pages/api/v1/bots/[id]/archive.js - Archive bot

pages/api/v1/webhooks/index.js   - List/Create webhooks
pages/api/v1/webhooks/[id].js    - Get/Update/Delete webhooks

pages/api/v1/audit-logs.js       - Query audit logs

docs/API.md                      - Complete API documentation
PHASE2_IMPLEMENTATION.md         - This file
```

---

## Database Schema Changes

### AuditLog
```javascript
{
  userId: ObjectId,        // Who did it
  teamId: ObjectId,        // Which team
  action: String,          // CREATE|UPDATE|DELETE|etc
  resource: String,        // BOT|TEAM|WEBHOOK|etc
  resourceId: String,      // ID of resource
  details: Object,         // What changed
  ipAddress: String,       // From where
  userAgent: String,       // What client
  status: String,          // SUCCESS|FAILURE
  error: String,           // If failed
  createdAt: Date
}
```

### Webhook
```javascript
{
  teamId: ObjectId,        // Belongs to team
  createdBy: ObjectId,     // Creator
  name: String,            // Display name
  url: String,             // Webhook URL
  events: [String],        // Subscribed events
  secret: String,          // For HMAC validation
  headers: Map<String>,    // Custom headers
  retryPolicy: Object,     // Retry configuration
  statistics: Object,      // Usage stats
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Response Examples

### Successful Response
```json
{
  "success": true,
  "data": {
    "bots": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "pages": 5
    }
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "errors": {
    "name": "Bot name is required",
    "businessDetails": "Business details must be less than 50,000 characters"
  }
}
```

---

## Migration from Old API

Old endpoints at `/api/bots` still work but are deprecated.
Migrate to `/api/v1/bots` for:
- Better error handling
- Audit logging
- Validation
- Consistent response format

---

## Rate Limiting Details

**Default Limits**:
- Bot endpoints: 100 requests/min
- Export: 20 requests/min
- Webhooks: 50 requests/min
- Audit logs: 50 requests/min

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-01-15T10:31:00Z
```

**Exceeding Limit** (429):
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "retryAfter": 45
}
```

---

## Webhook Event Examples

### bot.published
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "bot.published",
  "data": {
    "botId": "1234567890",
    "botName": "Customer Support",
    "userId": "507f...",
    "teamId": "507f..."
  }
}
```

### conversation.ended
```json
{
  "timestamp": "2024-01-15T10:35:22Z",
  "event": "conversation.ended",
  "data": {
    "botId": "1234567890",
    "conversationId": "conv_xyz",
    "duration": 312,
    "messageCount": 8,
    "userId": "507f..."
  }
}
```

---

## Testing the New Endpoints

### Test bot creation and publishing
```bash
TOKEN="your_jwt_token"

# Create bot
curl -X POST http://localhost:3000/api/v1/bots \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Bot",
    "businessName": "Test Corp",
    "businessType": "retail",
    "businessDetails": "Testing...",
    "tone": "Friendly",
    "language": "English",
    "model": {"id": "claude-3-5-sonnet"}
  }' | jq '.data.bot.id' > bot_id.txt

BOT_ID=$(cat bot_id.txt)

# Publish bot
curl -X POST http://localhost:3000/api/v1/bots/$BOT_ID/publish \
  -H "Authorization: Bearer $TOKEN"

# Export as HTML
curl -X POST http://localhost:3000/api/v1/bots/$BOT_ID/export \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"format": "html"}' > chatbot.html

# Check audit logs
curl http://localhost:3000/api/v1/audit-logs \
  -H "Authorization: Bearer $TOKEN" | jq '.data.logs'
```

### Test webhook creation
```bash
curl -X POST http://localhost:3000/api/v1/webhooks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Slack Notifications",
    "url": "https://hooks.slack.com/services/YOUR/WEBHOOK",
    "events": ["bot.published", "bot.updated"]
  }'
```

---

## Next Steps (Phase 3)

### Enterprise Features
- [ ] Team management API
- [ ] Role-based permissions
- [ ] API key management
- [ ] Usage analytics dashboard
- [ ] Conversation analytics

### Integrations
- [ ] Slack integration
- [ ] Discord integration
- [ ] Teams integration
- [ ] Custom platform connectors

### Advanced Bot Features
- [ ] Knowledge base/RAG support
- [ ] Multi-language responses
- [ ] Conversation fallback handling
- [ ] Custom training data

---

## Breaking Changes

None - Phase 2 is backwards compatible. Old `/api/bots` endpoints still work.

---

## Performance Improvements

- Added indexes on frequently queried fields
- Pagination support to reduce memory usage
- Audit logging is asynchronous (doesn't block requests)
- Webhook statistics cached

---

## Security Enhancements

- Webhook secrets for authentication
- Audit logging of all changes
- Validation on all inputs
- Proper authorization checks
- Rate limiting prevents abuse

---

## Deployment Notes

1. Database indexes are auto-created by Mongoose
2. No migration needed (old endpoints still work)
3. New endpoints available immediately after deploy
4. Webhook retries happen asynchronously

---

## Support & Monitoring

**Key metrics to monitor**:
- API response times by endpoint
- Rate limit violations
- Validation errors
- Webhook delivery success rates
- Audit log growth

**Common issues**:
- 400 errors: Check validation error messages in response
- 401 errors: Verify JWT token is valid
- 403 errors: Check user is team member
- 429 errors: Implement exponential backoff

---

## Documentation

- Complete API reference in `docs/API.md`
- Code examples for Python, JavaScript, cURL
- Webhook event structure documented
- Error codes and meanings listed

All endpoints have JSDoc comments with Swagger-compatible annotations for future API documentation generation.
