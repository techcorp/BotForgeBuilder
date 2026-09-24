# BotForgeBuilder API Documentation

## Overview

BotForgeBuilder provides a comprehensive REST API for creating, managing, and deploying chatbots programmatically. All API endpoints are versioned under `/api/v1/` and require authentication via JWT tokens.

**Base URL**: `https://api.botforge.com/api/v1/` (or your deployment URL)

**Authentication**: Bearer token in `Authorization` header
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.botforge.com/api/v1/bots
```

---

## Table of Contents
1. [Authentication](#authentication)
2. [Bots](#bots)
3. [Webhooks](#webhooks)
4. [Audit Logs](#audit-logs)
5. [Error Handling](#error-handling)
6. [Rate Limiting](#rate-limiting)

---

## Authentication

### Register a New User
Create a new user account and receive an authentication token.

**Endpoint**: `POST /api/auth/register`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Corp" // optional
}
```

**Response** (201 Created):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  },
  "team": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Acme Corp"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Login
Authenticate with email and password to receive a token.

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Response** (200 OK):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "currentTeamId": "507f1f77bcf86cd799439012"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Get Current User
Get information about the authenticated user.

**Endpoint**: `GET /api/auth/me`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "currentTeamId": "507f1f77bcf86cd799439012",
    "lastLogin": "2024-01-15T10:30:00Z"
  },
  "team": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Acme Corp",
    "plan": "pro",
    "botsLimit": 50
  }
}
```

### Logout
Invalidate the current authentication token.

**Endpoint**: `POST /api/auth/logout`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "message": "Logged out successfully"
}
```

---

## Bots

### List Bots
Retrieve all chatbots for the authenticated user.

**Endpoint**: `GET /api/v1/bots`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` (integer, default: 1) - Page number for pagination
- `limit` (integer, default: 10, max: 100) - Results per page
- `status` (string) - Filter by status: `draft`, `published`, `archived`
- `businessType` (string) - Filter by business type

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "bots": [
      {
        "id": "1234567890",
        "name": "Customer Support Bot",
        "businessName": "Acme Corp",
        "businessType": "retail",
        "tone": "Professional",
        "language": "English",
        "status": "published",
        "visibility": "private",
        "conversations": 42,
        "createdAt": "2024-01-10T08:00:00Z",
        "publishedAt": "2024-01-12T14:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

### Create Bot
Create a new chatbot.

**Endpoint**: `POST /api/v1/bots`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "Customer Support Bot",
  "businessName": "Acme Corp",
  "businessType": "retail",
  "businessDetails": "We sell electronics and accessories...",
  "tone": "Professional",
  "language": "English",
  "model": {
    "id": "claude-3-5-sonnet",
    "name": "Claude 3.5 Sonnet",
    "source": "anthropic-direct"
  },
  "customInstructions": "You are a helpful customer support assistant...",
  "welcomeMessage": "Hello! How can I help you today?"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "bot": {
      "id": "1234567890",
      "name": "Customer Support Bot",
      "businessName": "Acme Corp",
      "status": "draft",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Get Bot
Retrieve details of a specific chatbot.

**Endpoint**: `GET /api/v1/bots/{id}`

**Query**: `/api/v1/bots/1234567890`

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "bot": {
      "id": "1234567890",
      "name": "Customer Support Bot",
      "businessName": "Acme Corp",
      "businessType": "retail",
      "businessDetails": "We sell electronics...",
      "tone": "Professional",
      "language": "English",
      "model": { "id": "claude-3-5-sonnet", "name": "Claude 3.5 Sonnet" },
      "customInstructions": "You are a helpful...",
      "welcomeMessage": "Hello!",
      "status": "published",
      "visibility": "private",
      "conversations": 42,
      "createdAt": "2024-01-10T08:00:00Z",
      "updatedAt": "2024-01-14T15:45:00Z",
      "publishedAt": "2024-01-12T14:30:00Z"
    }
  }
}
```

### Update Bot
Modify an existing chatbot (draft or published).

**Endpoint**: `PUT /api/v1/bots/{id}`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "tone": "Friendly",
  "welcomeMessage": "Hi! I'm here to help!"
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "bot": { /* updated bot object */ }
  }
}
```

### Delete Bot
Delete a chatbot permanently.

**Endpoint**: `DELETE /api/v1/bots/{id}`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Bot deleted successfully"
}
```

### Publish Bot
Publish a bot to make it available for conversations.

**Endpoint**: `POST /api/v1/bots/{id}/publish`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Bot published successfully",
  "data": {
    "bot": {
      "id": "1234567890",
      "status": "published",
      "publishedAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Archive Bot
Archive a bot to hide it without deleting.

**Endpoint**: `POST /api/v1/bots/{id}/archive`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Bot archived successfully",
  "data": {
    "bot": { "id": "1234567890", "status": "archived" }
  }
}
```

### Export Bot

**Endpoint**: `POST /api/v1/bots/{id}/export`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "format": "json" // or "html", "iframe", "api"
}
```

**Response for JSON format** (200 OK):
```
Content-Type: application/json
Content-Disposition: attachment; filename="bot-1234567890.json"

{
  "id": "1234567890",
  "name": "Customer Support Bot",
  ...
}
```

**Response for iFrame format** (200 OK):
```json
{
  "success": true,
  "data": {
    "embedCode": "<iframe src=\"https://your-domain/embed/1234567890\" ...></iframe>",
    "url": "https://your-domain/embed/1234567890"
  }
}
```

---

## Webhooks

### List Webhooks
Retrieve all webhooks for the team.

**Endpoint**: `GET /api/v1/webhooks`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` (integer, default: 1)
- `limit` (integer, default: 10)

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "webhooks": [
      {
        "id": "webhook-001",
        "name": "Slack Notifications",
        "url": "https://hooks.slack.com/services/...",
        "events": ["bot.created", "bot.published"],
        "isActive": true,
        "createdAt": "2024-01-10T08:00:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 10, "total": 5, "pages": 1 }
  }
}
```

### Create Webhook
Register a webhook endpoint for bot events.

**Endpoint**: `POST /api/v1/webhooks`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "name": "Slack Notifications",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": ["bot.created", "bot.published", "conversation.ended"],
  "headers": {
    "Authorization": "Bearer optional-secret"
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "webhook": {
      "id": "webhook-001",
      "name": "Slack Notifications",
      "url": "https://hooks.slack.com/services/...",
      "events": ["bot.created", "bot.published"],
      "secret": "whsec_1234567890abcdef",
      "isActive": true,
      "createdAt": "2024-01-15T10:30:00Z"
    }
  }
}
```

### Update Webhook
Modify webhook configuration.

**Endpoint**: `PUT /api/v1/webhooks/{id}`

**Headers**: `Authorization: Bearer TOKEN`

**Request**:
```json
{
  "isActive": false,
  "events": ["bot.created"]
}
```

**Response** (200 OK):
```json
{
  "success": true,
  "data": { "webhook": { /* updated webhook */ } }
}
```

### Delete Webhook
Remove a webhook.

**Endpoint**: `DELETE /api/v1/webhooks/{id}`

**Headers**: `Authorization: Bearer TOKEN`

**Response** (200 OK):
```json
{
  "success": true,
  "message": "Webhook deleted successfully"
}
```

---

## Audit Logs

### Get Audit Logs
Retrieve activity logs for the team.

**Endpoint**: `GET /api/v1/audit-logs`

**Headers**: `Authorization: Bearer TOKEN`

**Query Parameters**:
- `page` (integer, default: 1)
- `limit` (integer, default: 50)
- `action` (string) - Filter: CREATE, UPDATE, DELETE, LOGIN, LOGOUT, EXPORT, PUBLISH
- `resource` (string) - Filter: BOT, TEAM, USER, WEBHOOK, API_KEY
- `startDate` (ISO 8601) - Start date for range
- `endDate` (ISO 8601) - End date for range

**Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "id": "log-001",
        "userId": "507f1f77bcf86cd799439011",
        "action": "CREATE",
        "resource": "BOT",
        "resourceId": "1234567890",
        "status": "SUCCESS",
        "createdAt": "2024-01-15T10:30:00Z"
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 127, "pages": 3 }
  }
}
```

---

## Error Handling

All error responses follow a consistent format:

**Error Response Format**:
```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

Or with validation errors:
```json
{
  "success": false,
  "errors": {
    "fieldName": "Field-specific error message"
  }
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Bot retrieved successfully |
| 201 | Created | Bot created successfully |
| 400 | Bad Request | Missing required fields |
| 401 | Unauthorized | Invalid or missing token |
| 403 | Forbidden | Not authorized to access resource |
| 404 | Not Found | Bot not found |
| 405 | Method Not Allowed | Using wrong HTTP method |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

---

## Rate Limiting

The API implements rate limiting to ensure fair usage:

- **Bots endpoints**: 100 requests per minute
- **Webhooks endpoints**: 50 requests per minute
- **Chat endpoints**: 50 requests per minute

**Rate Limit Headers**:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 2024-01-15T10:31:00Z
```

When rate limit is exceeded (429):
```json
{
  "success": false,
  "error": "Too many requests, please try again later",
  "retryAfter": 45
}
```

---

## Webhook Events

When registered, webhooks receive POST requests with the following payload structure:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "event": "bot.published",
  "data": {
    "botId": "1234567890",
    "botName": "Customer Support Bot",
    "userId": "507f1f77bcf86cd799439011",
    "teamId": "507f1f77bcf86cd799439012"
  },
  "signature": "sha256=..."
}
```

**Available Events**:
- `bot.created` - New bot created
- `bot.updated` - Bot modified
- `bot.published` - Bot published
- `bot.archived` - Bot archived
- `bot.deleted` - Bot deleted
- `conversation.started` - User started conversation with bot
- `conversation.ended` - Conversation ended
- `message.sent` - Message sent to bot

---

## Code Examples

### Python
```python
import requests

BASE_URL = "https://api.botforge.com/api/v1"
TOKEN = "your_token_here"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

# List bots
response = requests.get(f"{BASE_URL}/bots", headers=HEADERS)
bots = response.json()["data"]["bots"]

# Create bot
bot_data = {
    "name": "My Bot",
    "businessName": "My Company",
    "businessType": "retail",
    "businessDetails": "..."
}
response = requests.post(f"{BASE_URL}/bots", json=bot_data, headers=HEADERS)
new_bot = response.json()["data"]["bot"]
```

### JavaScript
```javascript
const BASE_URL = "https://api.botforge.com/api/v1";
const TOKEN = "your_token_here";

async function listBots() {
  const response = await fetch(`${BASE_URL}/bots`, {
    headers: { "Authorization": `Bearer ${TOKEN}` }
  });
  return response.json();
}

async function createBot(botData) {
  const response = await fetch(`${BASE_URL}/bots`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(botData)
  });
  return response.json();
}
```

### cURL
```bash
# List bots
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.botforge.com/api/v1/bots

# Create bot
curl -X POST https://api.botforge.com/api/v1/bots \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Bot",
    "businessName": "My Company",
    "businessType": "retail",
    "businessDetails": "..."
  }'

# Publish bot
curl -X POST https://api.botforge.com/api/v1/bots/1234567890/publish \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Support

For API support, email: `api-support@botforge.com`

For documentation updates and issues: `https://github.com/botforge/api-docs`
