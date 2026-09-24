# Architecture Overview

Complete technical architecture of BotForgeBuilder.

## System Architecture

```
┌─────────────────────────────────────────────────────┐
│              Client Layer (Browser)                 │
│  Next.js Frontend + React Components               │
├─────────────────────────────────────────────────────┤
│              API Gateway / Load Balancer            │
│  (Nginx/ALB/Ingress)                               │
├─────────────────────────────────────────────────────┤
│           Application Layer (Node.js)               │
│  ┌────────────────────────────────────────────────┐ │
│  │  Next.js API Routes (Pages/API)                │ │
│  │  ├─ Auth Endpoints (/api/auth/*)              │ │
│  │  ├─ Bot Endpoints (/api/v1/bots/*)            │ │
│  │  ├─ Team Endpoints (/api/v1/teams/*)          │ │
│  │  ├─ Analytics Endpoints (/api/v1/analytics/*) │ │
│  │  ├─ Integration Endpoints (/api/v1/integrations/*) │
│  │  └─ Other Services                             │ │
│  └────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│        Middleware & Security Layer                  │
│  ┌────────────────────────────────────────────────┐ │
│  │  Authentication (JWT)                          │ │
│  │  Authorization (RBAC)                          │ │
│  │  Validation                                     │ │
│  │  Rate Limiting                                 │ │
│  │  Error Handling                                │ │
│  │  Logging                                        │ │
│  └────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│            Data Layer (MongoDB)                     │
│  ┌────────────────────────────────────────────────┐ │
│  │  Collections:                                   │ │
│  │  ├─ users                                       │ │
│  │  ├─ teams                                       │ │
│  │  ├─ bots                                        │ │
│  │  ├─ conversations                              │ │
│  │  ├─ botanalytics                               │ │
│  │  ├─ webhooks                                    │ │
│  │  ├─ integrations                               │ │
│  │  ├─ apikeys                                     │ │
│  │  ├─ auditlogs                                   │ │
│  │  └─ teaminvites                                │ │
│  └────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend Layer (Next.js/React)

**Location**: `pages/` and `components/`

**Responsibilities**:
- User interface for bot builder
- Authentication screens
- Dashboard and analytics
- Team management UI
- Integration configuration

**Key Components**:
- Auth pages (login, register)
- Bot builder (multi-step form)
- Dashboard (bot list, stats)
- Team management
- Analytics dashboard
- Integration settings

---

### 2. API Layer (Next.js API Routes)

**Location**: `pages/api/`

**Structure**:
```
pages/api/
├── auth/                 # Authentication
│   ├── register.js
│   ├── login.js
│   ├── logout.js
│   └── me.js
├── v1/                   # API v1 endpoints
│   ├── bots/
│   │   ├── index.js
│   │   ├── [id].js
│   │   ├── [id]/
│   │   │   ├── export.js
│   │   │   ├── publish.js
│   │   │   └── archive.js
│   ├── teams/
│   │   ├── index.js
│   │   ├── [id].js
│   │   └── [id]/members.js
│   ├── webhooks/
│   │   ├── index.js
│   │   └── [id].js
│   ├── integrations/
│   │   ├── index.js
│   │   └── [id].js
│   ├── api-keys/index.js
│   ├── analytics/
│   │   └── bots/[id].js
│   └── audit-logs.js
├── chat.js               # Chat endpoint
└── health.js             # Health check
```

**Response Format**:
```json
{
  "success": true,
  "data": { /* payload */ },
  "pagination": { /* optional */ },
  "error": "message" // only on failure
}
```

---

### 3. Data Models

**Location**: `lib/models/`

```
User
├─ email (unique)
├─ password (hashed)
├─ firstName, lastName
├─ currentTeamId
├─ role
├─ lastLogin
└─ createdAt

Team
├─ name
├─ ownerId (ref: User)
├─ members []
│   ├─ userId (ref: User)
│   ├─ role (admin|manager|editor|viewer)
│   └─ joinedAt
├─ plan (free|pro|enterprise)
├─ botsLimit
└─ createdAt

Bot
├─ id (unique string)
├─ teamId (ref: Team)
├─ createdBy (ref: User)
├─ name
├─ businessName, businessType
├─ businessDetails
├─ tone, language
├─ model { id, name }
├─ customInstructions
├─ welcomeMessage
├─ status (draft|published|archived)
├─ visibility (private|team|public)
├─ conversations (count)
└─ createdAt

Conversation
├─ botId
├─ teamId (ref: Team)
├─ conversationId (unique)
├─ messages []
│   ├─ role (user|assistant)
│   ├─ content
│   └─ timestamp
├─ metadata { userEmail, userId, ipAddress... }
├─ metrics { duration, messageCount, sentiment... }
└─ createdAt

BotAnalytics
├─ botId
├─ teamId (ref: Team)
├─ date
├─ metrics { totalConversations, totalMessages... }
├─ sentiment { positive, neutral, negative }
├─ topTopics []
├─ trafficSource { web, api, embed, slack, discord }
└─ hourlyBreakdown []

Webhook
├─ teamId (ref: Team)
├─ createdBy (ref: User)
├─ name
├─ url
├─ events [] (bot.created, bot.updated, etc.)
├─ secret (encrypted)
├─ retryPolicy { maxRetries, retryDelay }
└─ statistics { totalRequests, successfulRequests... }

Integration
├─ teamId (ref: Team)
├─ createdBy (ref: User)
├─ name
├─ platform (slack|discord|teams|telegram|custom)
├─ config { webhookUrl, channelId, botToken... }
├─ bots [] (subscribed bots)
├─ events [] (subscribed events)
└─ statistics { totalForwarded, totalFailed... }

ApiKey
├─ teamId (ref: Team)
├─ createdBy (ref: User)
├─ name
├─ key (sk_xxxxx, hashed)
├─ permissions [] (bots:read, bots:write, etc.)
├─ restrictions { allowedIps, allowedDomains }
├─ rateLimit { requestsPerMinute, requestsPerDay }
└─ expiresAt

AuditLog
├─ userId (ref: User)
├─ teamId (ref: Team)
├─ action (CREATE|UPDATE|DELETE|PUBLISH|etc.)
├─ resource (BOT|TEAM|WEBHOOK|etc.)
├─ resourceId
├─ details { what changed }
├─ ipAddress
├─ status (SUCCESS|FAILURE)
└─ createdAt

TeamInvite
├─ teamId (ref: Team)
├─ invitedBy (ref: User)
├─ email
├─ role
├─ token (unique)
├─ status (pending|accepted|rejected|expired)
└─ expiresAt
```

---

### 4. Middleware & Security

**Location**: `lib/middleware.js`, `lib/auth.js`, etc.

**Layers**:
1. **Authentication**: JWT verification
2. **Authorization**: Team membership check
3. **Role-Based Access**: Permission validation
4. **Validation**: Input sanitization
5. **Rate Limiting**: Request throttling
6. **Error Handling**: Consistent error format
7. **Logging**: Activity tracking

**Sequence**:
```
Request
  ↓
Rate Limit Check
  ↓
JWT Verification
  ↓
User Validation
  ↓
Team Membership Check
  ↓
Role/Permission Check
  ↓
Input Validation
  ↓
Business Logic
  ↓
Database Operation
  ↓
Audit Logging
  ↓
Response
```

---

### 5. Database Layer

**MongoDB Collections**: 10 main collections

**Indexing Strategy**:
- **Unique indexes**: email, API key hash, webhook token
- **Compound indexes**: (teamId, createdAt), (botId, date)
- **Single indexes**: Foreign keys, status fields

**Query Patterns**:
- List with pagination: `find().sort({createdAt: -1}).skip().limit()`
- Analytics aggregation: Daily aggregation pipeline
- User data access: Tenant isolation via teamId

---

### 6. Deployment Architecture

**Docker**:
```
Dockerfile (multi-stage)
  ├─ Stage 1: Dependencies
  ├─ Stage 2: Builder
  └─ Stage 3: Production
       ├─ Non-root user
       ├─ Health checks
       └─ Signal handling
```

**Docker Compose**:
```
Services:
  ├─ MongoDB
  ├─ Application
  └─ Redis (optional)
```

**Kubernetes**:
```
Deployment
  ├─ 3 replicas
  ├─ Rolling updates
  ├─ Health checks
  └─ Anti-affinity

HPA (Autoscaling)
  ├─ Min: 3, Max: 10
  ├─ CPU trigger: 80%
  └─ Memory trigger: 85%

Ingress + TLS
  ├─ Nginx controller
  ├─ Let's Encrypt
  └─ Rate limiting
```

---

### 7. API Design

**Versioning**: `/api/v1/`

**REST Principles**:
- GET: Retrieve (safe, idempotent)
- POST: Create (safe, not idempotent)
- PUT: Update (safe, idempotent)
- DELETE: Delete (not safe, idempotent)

**Pagination**:
```json
{
  "data": [ /* items */ ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

**Error Format**:
```json
{
  "success": false,
  "error": "Human-readable message",
  "errors": {
    "fieldName": "Field-specific error"
  }
}
```

---

### 8. Authentication Flow

```
User Registration
  ↓
Password Hashing (bcryptjs)
  ↓
User Created
  ↓
JWT Token Generated
  ↓
Token Returned to Client

Client Stores Token
  ↓
Subsequent Requests Include Token in Header
  ↓
Middleware Verifies JWT
  ↓
User Loaded from DB
  ↓
Request Processed
```

---

### 9. Data Security

**Encryption**:
- Passwords: bcryptjs (10 rounds)
- API Keys: SHA-256 hash
- Integration Secrets: Encrypted in DB
- SSL/TLS: All network transmission

**Isolation**:
- Multi-tenant: teamId field
- Query filters: All queries filtered by teamId
- Authorization: Verified at middleware

---

### 10. Scaling Strategy

**Vertical Scaling**:
- Increase CPU/Memory per instance
- Better for development/staging

**Horizontal Scaling**:
- Multiple application instances (3+)
- Load balancer distributes traffic
- MongoDB replication
- Stateless applications

**Caching**:
- Redis for session (optional)
- HTTP cache headers
- CDN for static assets

---

## Request Flow Example

### Create Bot Flow
```
Client
  ↓ POST /api/v1/bots
Request Middleware
  ↓ Rate limit check
  ↓ JWT verification
  ↓ User loaded
  ↓ Team membership check
Validation Layer
  ↓ Input validation
  ↓ Schema validation
Business Logic
  ↓ Bot object created
  ↓ Database insert
  ↓ Audit log created
Response
  ↓ 201 Created
  ↓ Bot data returned
Client
  ↓ Bot created successfully
```

---

## Technology Decisions

### Why Next.js?
- Full-stack JavaScript
- API routes (no separate backend)
- Server-side rendering
- Built-in optimization
- Great DX

### Why MongoDB?
- Flexible schema
- Scales horizontally
- JSON-like documents
- Great for startups
- Good free tier (Atlas)

### Why JWT?
- Stateless authentication
- Works with microservices
- Standard approach
- Good security (with HTTPS)

### Why Docker?
- Consistent environments
- Easy deployment
- Container orchestration
- Cloud-native

### Why Kubernetes?
- Auto-scaling
- High availability
- Rolling updates
- Industry standard

---

## Performance Characteristics

**API Response Time**:
- Target: <100ms (p95)
- Typical: 20-50ms for simple queries
- Complex analytics: 100-500ms

**Database Performance**:
- Simple queries: 1-5ms
- Aggregation: 10-100ms
- Full collection scan: Variable

**Concurrent Users**:
- Single instance: 100+
- Load balanced: 1000+
- Kubernetes cluster: 10,000+

---

## Monitoring Points

**Application**:
- Request count by endpoint
- Error rate
- Response time (p50, p95, p99)
- Active users

**Database**:
- Connection count
- Query latency
- Replication lag
- Storage usage

**Infrastructure**:
- CPU usage
- Memory usage
- Network I/O
- Disk usage

---

## Disaster Recovery

**Backup Strategy**:
- Daily MongoDB backups
- 30-day retention
- Point-in-time recovery

**High Availability**:
- MongoDB replication (3+ nodes)
- Application multi-replica
- Load balancer failover

**Monitoring**:
- Health checks every 10s
- Automated failover
- Alerts on failures

---

## Security Layers

```
Layer 1: Network
  ├─ HTTPS/TLS
  ├─ Rate limiting
  └─ DDoS protection

Layer 2: Application
  ├─ Input validation
  ├─ JWT auth
  ├─ RBAC
  └─ Audit logs

Layer 3: Data
  ├─ Encryption at rest
  ├─ Encryption in transit
  ├─ Access control
  └─ Anonymization

Layer 4: Infrastructure
  ├─ Firewall rules
  ├─ VPC/Network isolation
  ├─ Secrets management
  └─ Compliance (GDPR, HIPAA)
```

---

## Conclusion

BotForgeBuilder is built on:
- ✅ Scalable architecture
- ✅ Security-first design
- ✅ Developer-friendly APIs
- ✅ Operations-ready deployment
- ✅ Enterprise-grade reliability

This architecture supports from MVP to massive scale!
