// Initialize MongoDB database with collections and indexes

const dbName = 'botforge';
const db = db.getSiblingDB(dbName);

// Create collections with validation
db.createCollection('users', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['email', 'password'],
      properties: {
        _id: { bsonType: 'objectId' },
        email: { bsonType: 'string' },
        password: { bsonType: 'string' },
        firstName: { bsonType: 'string' },
        lastName: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('teams', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['name', 'ownerId'],
      properties: {
        _id: { bsonType: 'objectId' },
        name: { bsonType: 'string' },
        ownerId: { bsonType: 'objectId' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
});

db.createCollection('bots', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['id', 'name'],
      properties: {
        _id: { bsonType: 'objectId' },
        id: { bsonType: 'string' },
        name: { bsonType: 'string' },
        createdAt: { bsonType: 'date' },
      },
    },
  },
});

// Create other collections
db.createCollection('webhooks');
db.createCollection('auditlogs');
db.createCollection('conversations');
db.createCollection('botanalytics');
db.createCollection('apikeys');
db.createCollection('integrations');
db.createCollection('teaminvites');

// Create indexes for performance
// Users indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ createdAt: -1 });

// Teams indexes
db.teams.createIndex({ ownerId: 1 });
db.teams.createIndex({ name: 1 });
db.teams.createIndex({ createdAt: -1 });

// Bots indexes
db.bots.createIndex({ id: 1 }, { unique: true });
db.bots.createIndex({ teamId: 1 });
db.bots.createIndex({ createdBy: 1 });
db.bots.createIndex({ createdAt: -1 });
db.bots.createIndex({ status: 1 });

// Webhooks indexes
db.webhooks.createIndex({ teamId: 1 });
db.webhooks.createIndex({ isActive: 1 });
db.webhooks.createIndex({ createdAt: -1 });

// Audit logs indexes
db.auditlogs.createIndex({ userId: 1, createdAt: -1 });
db.auditlogs.createIndex({ teamId: 1, createdAt: -1 });
db.auditlogs.createIndex({ resource: 1, resourceId: 1 });
db.auditlogs.createIndex({ createdAt: -1 });

// Conversations indexes
db.conversations.createIndex({ botId: 1, createdAt: -1 });
db.conversations.createIndex({ teamId: 1, createdAt: -1 });
db.conversations.createIndex({ conversationId: 1 }, { unique: true });
db.conversations.createIndex({ 'metadata.userEmail': 1 });

// Bot analytics indexes
db.botanalytics.createIndex({ botId: 1, date: -1 });
db.botanalytics.createIndex({ teamId: 1, date: -1 });

// API keys indexes
db.apikeys.createIndex({ teamId: 1 });
db.apikeys.createIndex({ keyHash: 1 });

// Integrations indexes
db.integrations.createIndex({ teamId: 1 });
db.integrations.createIndex({ platform: 1 });
db.integrations.createIndex({ isActive: 1 });

// Team invites indexes
db.teaminvites.createIndex({ teamId: 1 });
db.teaminvites.createIndex({ email: 1 });
db.teaminvites.createIndex({ token: 1 }, { unique: true });
db.teaminvites.createIndex({ expiresAt: 1 });

print('Database initialized successfully!');
