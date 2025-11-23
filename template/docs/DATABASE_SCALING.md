# Database Scaling and Migration Guide

This guide covers production-level database scaling strategies for MongoDB, including replica sets, sharding, data migration, and seed scripts.

## Table of Contents
1. [MongoDB Replica Set Setup](#mongodb-replica-set-setup)
2. [Sharding for Horizontal Scaling](#sharding-for-horizontal-scaling)
3. [Data Seeding and Export/Import](#data-seeding-and-exportimport)
4. [Database Migration Between Clusters](#database-migration-between-clusters)
5. [Production Best Practices](#production-best-practices)

---

## MongoDB Replica Set Setup

### What is a Replica Set?

A MongoDB replica set is a group of MongoDB instances that maintain the same data set. It provides:
- **High Availability**: Automatic failover if primary node fails
- **Data Redundancy**: Multiple copies of data
- **Read Scalability**: Distribute read operations across replicas

### Setup Steps

#### 1. Update Connection String

Update your `.env` file to use a replica set connection string:

```env
# Single node (development)
MONGO_URL=mongodb://localhost:27017/your-database

# Replica Set (production)
MONGO_URL=mongodb://primary:27017,secondary1:27017,secondary2:27017/your-database?replicaSet=rs0
```

#### 2. Configure Replica Set (Local Development)

If running MongoDB locally, initialize a replica set:

```bash
# Start MongoDB instances (in separate terminals)
mongod --port 27017 --dbpath /data/db1 --replSet rs0
mongod --port 27018 --dbpath /data/db2 --replSet rs0
mongod --port 27019 --dbpath /data/db3 --replSet rs0

# Connect to primary and initialize
mongosh --port 27017

# In MongoDB shell:
rs.initiate({
  _id: "rs0",
  members: [
    { _id: 0, host: "localhost:27017" },
    { _id: 1, host: "localhost:27018" },
    { _id: 2, host: "localhost:27019" }
  ]
})

# Check status
rs.status()
```

#### 3. Update Application Code

The current codebase already supports replica sets through the connection string. No code changes needed!

#### 4. MongoDB Atlas (Cloud - Recommended)

MongoDB Atlas provides managed replica sets:

1. **Create Cluster**:
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Create a free M0 cluster (512MB storage)
   - Select your preferred region

2. **Configure Replica Set**:
   - Atlas automatically creates a 3-member replica set
   - Connection string includes all replica members

3. **Get Connection String**:
   ```
   mongodb://localhost:27017/your-database
   ```

4. **Update .env**:
   ```env
  mongodb://localhost:27017/your-database
   ```

#### 5. Read Preferences (Optional)

For read-heavy applications, configure read preferences in `src/config/database.js`:

```javascript
const options = {
  maxPoolSize: env.MONGO_MAX_POOL_SIZE,
  serverSelectionTimeoutMS: env.MONGO_SERVER_SELECTION_TIMEOUT,
  socketTimeoutMS: env.MONGO_SOCKET_TIMEOUT,
  readPreference: 'secondaryPreferred', // Read from secondary if available
  readConcern: { level: 'majority' },
  writeConcern: { w: 'majority' },
};
```

---

## Sharding for Horizontal Scaling

### What is Sharding?

Sharding distributes data across multiple machines (shards) to handle large datasets and high throughput. Each shard is a separate replica set.

### When to Use Sharding

- **Data Size**: When your database exceeds single server capacity
- **Write Throughput**: When write operations exceed single server capacity
- **Memory Limits**: When working set exceeds RAM

**Note**: Sharding adds complexity. Start with replica sets and scale to sharding when needed.

### Setup Steps

#### 1. Architecture Overview

```
Application
    ↓
Mongos (Query Router)
    ↓
┌─────────┬─────────┬─────────┐
│ Shard 1 │ Shard 2 │ Shard 3 │
│ (RS)    │ (RS)    │ (RS)    │
└─────────┴─────────┴─────────┘
```

#### 2. Configure Shard Key

Choose a shard key that distributes data evenly. For users, `email` or `_id` works well:

```javascript
// In src/models/user-model.js, add shard key index
userSchema.index({ email: 1 }); // This will be the shard key
```

#### 3. Enable Sharding (MongoDB Atlas)

1. **Upgrade to M10+ cluster** (sharding requires paid tier)
2. **Enable Sharding**:
   - Go to Atlas → Clusters → Configure
   - Enable "Sharding"
   - Configure shard key

#### 4. Manual Sharding Setup (Advanced)

For self-hosted MongoDB:

```bash
# 1. Start Config Servers (3 nodes for replica set)
mongod --configsvr --replSet configReplSet --port 27019 --dbpath /data/configdb

# 2. Start Mongos (Query Router)
mongos --configdb configReplSet/localhost:27019 --port 27017

# 3. Start Shard Servers (each as replica set)
mongod --shardsvr --replSet shard1 --port 27018 --dbpath /data/shard1
mongod --shardsvr --replSet shard2 --port 27020 --dbpath /data/shard2

# 4. Connect to Mongos and enable sharding
mongosh --port 27017

# In MongoDB shell:
sh.enableSharding("your-database")
sh.shardCollection("your-database.users", { "email": 1 })
```

#### 5. Update Connection String

Point your application to the `mongos` router:

```env
MONGO_URL=mongodb://mongos-host:27017/your-database
```

#### 6. Application Code

No code changes needed! Mongoose handles sharding transparently.

---

## Data Seeding and Export/Import

### Seed Scripts

Create seed scripts to populate your database with initial or test data.

#### 1. Create Seed Script

Create `scripts/seed-users.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user-model.js';
import { hashPassword } from '../src/utils/password.js';
import { generateAccessToken, generateRefreshToken } from '../src/utils/jwt.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const seedUsers = async () => {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Clear existing users (optional - be careful in production!)
    // await User.deleteMany({});

    const users = [
      {
        email: 'admin@example.com',
        name: 'Admin User',
        password: 'Admin1234',
        isActive: true,
      },
      {
        email: 'user1@example.com',
        name: 'Test User 1',
        password: 'Test1234',
        isActive: true,
      },
      {
        email: 'user2@example.com',
        name: 'Test User 2',
        password: 'Test1234',
        isActive: true,
      },
    ];

    const createdUsers = [];

    for (const userData of users) {
      // Check if user exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        logger.warn(`User ${userData.email} already exists, skipping`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = new User({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        isActive: userData.isActive,
        isUpdated: false,
        isDeleted: false,
      });

      await user.save();

      // Generate tokens
      const accessToken = generateAccessToken({ userId: user._id.toString(), email: user.email });
      const refreshToken = generateRefreshToken({ userId: user._id.toString(), email: user.email });

      // Update user with tokens
      user.accessToken = accessToken;
      user.refreshToken = refreshToken;
      await user.save();

      createdUsers.push(user);
      logger.info(`Created user: ${userData.email}`);
    }

    logger.info(`Seeded ${createdUsers.length} users`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error seeding users:', error);
    await disconnectDB();
    process.exit(1);
  }
};

seedUsers();
```

#### 2. Add to package.json

```json
{
  "scripts": {
    "seed": "node scripts/seed-users.js"
  }
}
```

#### 3. Run Seed Script

```bash
npm run seed
```

### Export Data

#### Using MongoDB Tools

```bash
# Export all users
mongoexport --uri="mongodb://localhost:27017/your-database" \
  --collection=users \
  --out=users-export.json \
  --jsonArray

# Export with query (only active users)
mongoexport --uri="mongodb://localhost:27017/your-database" \
  --collection=users \
  --query='{"isDeleted": false}' \
  --out=active-users.json \
  --jsonArray
```

#### Using Mongoose Script

Create `scripts/export-users.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../src/models/user-model.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const exportUsers = async () => {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Fetch all users (excluding deleted)
    const users = await User.find({ isDeleted: false }).lean();

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { password, accessToken, refreshToken, ...safeUser } = user;
      return safeUser;
    });

    // Write to file
    fs.writeFileSync(
      'users-export.json',
      JSON.stringify(sanitizedUsers, null, 2)
    );

    logger.info(`Exported ${sanitizedUsers.length} users to users-export.json`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error exporting users:', error);
    await disconnectDB();
    process.exit(1);
  }
};

exportUsers();
```

### Import Data

#### Using MongoDB Tools

```bash
# Import users
mongoimport --uri="mongodb://localhost:27017/your-database" \
  --collection=users \
  --file=users-export.json \
  --jsonArray
```

#### Using Mongoose Script

Create `scripts/import-users.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import User from '../src/models/user-model.js';
import { hashPassword } from '../src/utils/password.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

const importUsers = async () => {
  try {
    await connectDB();
    logger.info('Connected to database');

    // Read export file
    const data = fs.readFileSync('users-export.json', 'utf8');
    const users = JSON.parse(data);

    let imported = 0;
    let skipped = 0;

    for (const userData of users) {
      // Check if user exists
      const existing = await User.findOne({ email: userData.email });
      if (existing) {
        logger.warn(`User ${userData.email} already exists, skipping`);
        skipped++;
        continue;
      }

      // Create user (password needs to be set separately if not in export)
      const user = new User({
        email: userData.email,
        name: userData.name,
        password: await hashPassword('DefaultPassword123'), // Set default or require in export
        isActive: userData.isActive ?? true,
        isUpdated: userData.isUpdated ?? false,
        isDeleted: userData.isDeleted ?? false,
        createdAt: userData.createdAt ? new Date(userData.createdAt) : new Date(),
      });

      await user.save();
      imported++;
      logger.info(`Imported user: ${userData.email}`);
    }

    logger.info(`Imported ${imported} users, skipped ${skipped} existing users`);
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    logger.error('Error importing users:', error);
    await disconnectDB();
    process.exit(1);
  }
};

importUsers();
```

---

## Database Migration Between Clusters

### Scenario: Moving from One MongoDB Cluster to Another

This guide covers migrating your database from one MongoDB instance/cluster to another (e.g., local to Atlas, or Atlas cluster to Atlas cluster).

### Method 1: MongoDB Dump and Restore (Recommended)

#### Step 1: Export from Source

```bash
# Export entire database
mongodump --uri="mongodb://source-host:27017/your-database" \
  --out=./backup

# Or export specific collection
mongodump --uri="mongodb://source-host:27017/your-database" \
  --collection=users \
  --out=./backup
```

#### Step 2: Restore to Destination

```bash
# Restore entire database
mongorestore --uri="mongodb://destination-host:27017/your-database" \
  ./backup/your-database

# Or restore specific collection
mongorestore --uri="mongodb://destination-host:27017/your-database" \
  --collection=users \
  ./backup/your-database/users.bson
```

#### Step 3: Verify Migration

```bash
# Connect to destination and verify
mongosh "mongodb://destination-host:27017/your-database"

# In MongoDB shell:
db.users.countDocuments()
db.users.find().limit(5)
```

#### Step 4: Update Application

1. **Update .env**:
   ```env
   MONGO_URL=mongodb://destination-host:27017/your-database
   ```

2. **Test Connection**:
   ```bash
   npm start
   ```

3. **Monitor Logs**: Check for connection errors

### Method 2: Live Migration (Zero Downtime)

For production systems requiring zero downtime:

#### Step 1: Setup Replica Set on Destination

Configure destination as a replica set.

#### Step 2: Add Destination as Replica Member

```javascript
// Connect to source primary
mongosh "mongodb://source-host:27017/your-database"

// Add destination as replica member
rs.add({
  host: "destination-host:27017",
  priority: 0, // Lower priority so it doesn't become primary
  votes: 0     // No votes
})
```

#### Step 3: Wait for Sync

Monitor replication lag:

```javascript
rs.printSlaveReplicationInfo()
```

#### Step 4: Remove from Replica Set

Once synced, remove destination from source replica set:

```javascript
rs.remove("destination-host:27017")
```

#### Step 5: Update Application

Update connection string to point to destination.

### Method 3: Application-Level Migration Script

Create `scripts/migrate-database.js`:

```javascript
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/user-model.js';
import { connectDB as connectSource, disconnectDB as disconnectSource } from '../src/config/database.js';
import { logger } from '../src/utils/logger.js';

dotenv.config();

// Source and destination URIs
const SOURCE_URI = process.env.SOURCE_MONGO_URL;
const DEST_URI = process.env.DEST_MONGO_URL;

const migrateDatabase = async () => {
  let sourceConnection, destConnection;

  try {
    // Connect to source
    logger.info('Connecting to source database...');
    sourceConnection = await mongoose.createConnection(SOURCE_URI);
    const SourceUser = sourceConnection.model('User', User.schema);

    // Connect to destination
    logger.info('Connecting to destination database...');
    destConnection = await mongoose.createConnection(DEST_URI);
    const DestUser = destConnection.model('User', User.schema);

    // Fetch all users from source
    logger.info('Fetching users from source...');
    const users = await SourceUser.find({}).lean();
    logger.info(`Found ${users.length} users to migrate`);

    // Migrate users in batches
    const batchSize = 100;
    let migrated = 0;
    let errors = 0;

    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);

      for (const userData of batch) {
        try {
          // Check if user exists in destination
          const existing = await DestUser.findOne({ email: userData.email });
          if (existing) {
            logger.warn(`User ${userData.email} already exists in destination, skipping`);
            continue;
          }

          // Create user in destination
          const user = new DestUser(userData);
          await user.save();
          migrated++;
        } catch (error) {
          logger.error(`Error migrating user ${userData.email}:`, error.message);
          errors++;
        }
      }

      logger.info(`Progress: ${Math.min(i + batchSize, users.length)}/${users.length} users processed`);
    }

    logger.info(`Migration complete: ${migrated} migrated, ${errors} errors`);
  } catch (error) {
    logger.error('Migration error:', error);
    throw error;
  } finally {
    if (sourceConnection) await sourceConnection.close();
    if (destConnection) await destConnection.close();
  }
};

migrateDatabase()
  .then(() => {
    logger.info('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Migration script failed:', error);
    process.exit(1);
  });
```

Run migration:

```bash
SOURCE_MONGO_URL="mongodb://source-host:27017/your-database" \
DEST_MONGO_URL="mongodb://dest-host:27017/your-database" \
node scripts/migrate-database.js
```

---

## Production Best Practices

### 1. Connection Pooling

Already configured in `src/config/database.js`:

```javascript
maxPoolSize: env.MONGO_MAX_POOL_SIZE, // Default: 10
```

**Recommendations**:
- **Small apps**: 10-20 connections
- **Medium apps**: 20-50 connections
- **Large apps**: 50-100 connections

### 2. Indexes

Ensure proper indexes for performance:

```javascript
// Already in user-model.js
userSchema.index({ email: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isDeleted: 1 });
userSchema.index({ isUpdated: 1 });
```

### 3. Monitoring

Monitor database performance:

- **MongoDB Atlas**: Built-in monitoring dashboard
- **Self-hosted**: Use MongoDB Compass or mongostat

### 4. Backup Strategy

#### Automated Backups (MongoDB Atlas)

Atlas provides automated backups:
- Daily snapshots
- Point-in-time recovery
- Configurable retention

#### Manual Backups

```bash
# Daily backup script
mongodump --uri="$MONGO_URL" --out=/backups/$(date +%Y%m%d)
```

### 5. Security

- **Use Authentication**: Always require username/password
- **Enable SSL/TLS**: Use `mongodb+srv://` for Atlas
- **Network Isolation**: Use VPC peering or IP whitelisting
- **Encryption at Rest**: Enable in MongoDB Atlas

### 6. Performance Optimization

- **Read Preferences**: Use `secondaryPreferred` for read-heavy workloads
- **Write Concerns**: Use `majority` for critical writes
- **Query Optimization**: Use `.explain()` to analyze slow queries
- **Connection String Options**:
  ```env
  MONGO_URL=mongodb://host/db?retryWrites=true&w=majority&maxPoolSize=50
  ```

---

## Troubleshooting

### Connection Issues

1. **Check Connection String**: Verify URI format
2. **Network Access**: Ensure IP whitelisting (Atlas) or firewall rules
3. **Authentication**: Verify username/password
4. **DNS Resolution**: Ensure hostnames resolve correctly

### Performance Issues

1. **Check Indexes**: Use `.explain()` on slow queries
2. **Connection Pool**: Increase `maxPoolSize` if needed
3. **Read Preferences**: Distribute reads to secondaries
4. **Sharding**: Consider sharding for very large datasets

### Migration Issues

1. **Data Validation**: Compare document counts before/after
2. **Indexes**: Ensure indexes are recreated on destination
3. **Transactions**: Verify transaction support if using
4. **Rollback Plan**: Keep source database until migration verified

---

## Free Production Options

### MongoDB Atlas Free Tier (M0)

- **512MB Storage**: Sufficient for small-medium apps
- **Shared RAM**: 512MB
- **Replica Set**: 3-member replica set included
- **Backups**: 2GB free backup storage
- **Limitations**: 
  - No sharding (requires M10+)
  - No dedicated resources
  - Connection limits

### Self-Hosted (Free)

- **VPS**: Use free tier from providers (limited resources)
- **Docker**: Run MongoDB in containers
- **Local Development**: Free for development/testing

### Recommended Setup for Production

1. **Start Small**: MongoDB Atlas M0 (free)
2. **Scale Up**: Upgrade to M10+ when needed
3. **Add Sharding**: When data/throughput exceeds single cluster
4. **Monitor**: Use Atlas monitoring or self-hosted tools

---

## Summary

- **Replica Sets**: Use for high availability and read scaling
- **Sharding**: Use for horizontal scaling (requires paid tier)
- **Seeding**: Use scripts for initial/test data
- **Migration**: Use `mongodump`/`mongorestore` or application scripts
- **Best Practices**: Indexes, connection pooling, monitoring, backups

For questions or issues, refer to [MongoDB Documentation](https://docs.mongodb.com/).

