# Authscale Backend Server

A production-ready Node.js backend built with Express, JWT and MongoDB. This is a solid foundation you can use for any project - it's got everything you need and nothing you don't.

## What's Included

- **RESTful API** - Clean, organized endpoints
- **JWT Authentication** - Secure token-based auth with refresh tokens (24h access, 30d refresh)
- **MongoDB** - Database with Mongoose, includes connection retry logic and transaction support
- **Soft Delete** - User accounts can be soft-deleted with timestamp tracking
- **Update Tracking** - Automatic tracking of user updates with timestamps
- **Transactions** - All database operations use transactions (start, commit, rollback)
- **Security** - Rate limiting, CORS, XSS protection, NoSQL injection prevention
- **Account Protection** - Users can only access/modify their own accounts
- **Validation** - Comprehensive input validation for all data types
- **Error Handling** - Centralized error handling with proper status codes
- **Logging** - Comprehensive logging for all operations
- **Docker** - Ready to deploy with Docker
- **Environment Config** - Centralized configuration management
- **Database Scaling** - Documentation for replica sets, sharding, and migrations

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env` and set:
- `MONGO_URL` - Your MongoDB connection string
- `JWT_SECRET` - A strong random string for JWT signing
- `JWT_REFRESH_SECRET` - Another strong random string for refresh tokens
- `ALLOWED_ORIGINS` - Comma-separated list of allowed frontend URLs
- `PORT` - Server port (default: 4000)

### 3. Run the Server

Development (with auto-reload):
```bash
npm run dev
```

Production:
```bash
npm start
```

The server will start on the port you set in `.env` (or default 4000).

## Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration - all settings in one place
│   ├── constants/       # Status codes, messages, etc.
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling, etc.
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── test/                # Test files and scripts
├── .env.example         # Environment variables template
├── docker-compose.yml   # Docker Compose setup
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies
```

## API Endpoints

### Health Check
```
GET /api/v1/health
```
Returns server status and database connection info.

### User Management

**Register**
```
POST /api/v1/users/register
Body: {
  "email": "user@example.com",
  "name": "John Doe",
  "password": "SecurePass123"
}
```

**Login**
```
POST /api/v1/users/login
Body: {
  "email": "user@example.com",
  "password": "SecurePass123"
}
```
Returns user data and tokens.

**Get Profile** (requires auth)
```
GET /api/v1/users/profile
Headers: {
  "Authorization": "Bearer <token>"
}
```

**Update Profile** (requires auth)
```
PUT /api/v1/users/profile
Headers: {
  "Authorization": "Bearer <token>"
}
Body: {
  "name": "Updated Name"
}
```

**Logout** (requires auth)
```
POST /api/v1/users/logout
Headers: {
  "Authorization": "Bearer <token>"
}
```

**Delete Account** (requires auth - soft delete)
```
DELETE /api/v1/users/account
Headers: {
  "Authorization": "Bearer <token>"
}
```
Soft deletes the user account. The account is marked as deleted with a timestamp but not removed from the database. Users can only delete their own accounts.

## Configuration

All configuration is centralized in `src/config/env.js`. Change values there and they'll be used throughout the app. This makes it easy to manage settings without hunting through multiple files.

Key settings you can adjust:
- Database connection options
- Rate limiting thresholds
- JWT expiration times (Access: 24h, Refresh: 30d)
- CORS allowed origins
- Body parser limits
- Compression settings
- Test settings

## Validation

The validation middleware is comprehensive. You can validate:
- Required fields
- Email format
- Password strength (with customizable rules)
- String length (min/max)
- Numbers (min/max)
- URLs, phone numbers, dates
- Enums (allowed values)
- Arrays, objects
- UUIDs, MongoDB ObjectIds
- Custom validation functions

Example usage in routes:
```javascript
validateBody({
  required: ['email', 'name'],
  fields: {
    email: {
      required: true,
      type: 'string',
      email: true,
      minLength: 5,
      maxLength: 255,
    },
    name: {
      required: true,
      type: 'string',
      minLength: 2,
      maxLength: 50,
    },
  },
})
```

## Security Features

- **Helmet** - Security headers
- **CORS** - Configurable cross-origin access
- **Rate Limiting** - Prevents abuse (global and per-endpoint)
- **XSS Protection** - Sanitizes input
- **NoSQL Injection Prevention** - Protects MongoDB queries
- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt with configurable salt rounds
- **Input Validation** - Multiple layers of validation

## Testing

### Quick Test

```bash
# Start server
npm run dev

# Run all tests (in another terminal)
npm test
```

The test script automatically checks:
- All API endpoints
- Validation (email, password, required fields)
- Security (CORS, XSS, NoSQL injection, rate limiting)
- Error handling
- Authentication

### Other Test Methods

**Security Tests:**
```bash
npm run test:security
```

**Quick Test Script:**
```bash
./test/quick-test.sh
```

**REST Client (VS Code):**
Open `test/api-tests.http` and use REST Client extension

See `test/TESTING_GUIDE.md` for detailed testing procedures.

## Adding New Features

The structure makes it easy to add new features. Here's the pattern:

1. **Create a Model** (`src/models/your-model.js`)
2. **Create a Service** (`src/services/your-service.js`) - put business logic here
3. **Create a Controller** (`src/controllers/your-controller.js`) - handle HTTP requests
4. **Create Routes** (`src/routes/your-route.js`) - define endpoints
5. **Add to Main Routes** (`src/routes/index.js`) - register your routes

The validation middleware can handle pretty much any validation you need, and the error handler will catch and format errors automatically.

## Docker

### Using Docker Compose

```bash
docker-compose up -d
```

This starts the API and MongoDB in containers.

### Using Dockerfile

```bash
docker build -t backend-api .
docker run -p 4000:4000 --env-file .env backend-api
```

## Production Deployment

Before deploying:

1. Set `NODE_ENV=production` in your environment
2. Use strong, unique JWT secrets
3. Configure proper CORS origins
4. Set up MongoDB (use a managed service like MongoDB Atlas)
5. Adjust rate limiting for your needs
6. Use HTTPS (via reverse proxy like Nginx)
7. Set up logging and monitoring
8. Use a process manager like PM2
9. Configure MongoDB replica sets for high availability (see `docs/DATABASE_SCALING.md`)
10. Set up database backups

### PM2 Setup

```bash
npm install -g pm2
pm2 start src/server.js --name backend-api
pm2 save
pm2 startup
```

## Environment Variables

See `.env.example` for all available options. Required variables:
- `MONGO_URL`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `NODE_ENV`

Everything else has sensible defaults. All configuration is centralized - change values in `.env` and they'll be used throughout the app.

## Troubleshooting

**MongoDB connection issues:**
- Check your `MONGO_URL` is correct
- Make sure MongoDB is running
- Check network/firewall settings

**JWT errors:**
- Verify `JWT_SECRET` is set
- Check token hasn't expired
- Ensure token format is correct (Bearer token)

**CORS errors:**
- Add your frontend URL to `ALLOWED_ORIGINS`
- Check CORS configuration

**Rate limiting:**
- Adjust limits in `.env` or `src/config/env.js`
- Check if you're hitting the limits

**Tests can't connect:**
- Make sure server is running
- Check port matches your `.env` PORT setting
- Verify `TEST_BASE_URL` in `.env` if set

## Architecture

### Request Flow

```
Client Request
    ↓
Security Middleware (CORS, Helmet, Rate Limiting)
    ↓
Request ID Middleware
    ↓
Body Parser
    ↓
Route Handler
    ↓
Validation Middleware
    ↓
Authentication Middleware (if protected)
    ↓
Controller
    ↓
Service (Business Logic)
    ↓
Model (Database)
    ↓
Response
    ↓
Error Handler (if error)
```

### Layer Responsibilities

- **Routes**: Define endpoints and apply route-specific middleware
- **Controllers**: Handle HTTP requests, call services, return responses
- **Services**: Business logic, database operations
- **Models**: Database schemas and validation
- **Middlewares**: Cross-cutting concerns (auth, validation, logging)
- **Utils**: Reusable helper functions
- **Config**: Environment and database configuration

## Database Scaling and Migration

For production-level database scaling, see the comprehensive guide:

📖 **[Database Scaling Guide](docs/DATABASE_SCALING.md)**

This guide covers:
- **Replica Sets**: Setup for high availability and read scaling
- **Sharding**: Horizontal scaling for large datasets
- **Data Seeding**: Scripts for importing/exporting data
- **Migration**: Moving between MongoDB clusters
- **Best Practices**: Production recommendations

### Quick Seed Script

To seed your database with test data, create seed scripts as shown in the Database Scaling guide, or use MongoDB's native tools:

```bash
# Export data
mongoexport --uri="$MONGO_URL" --collection=users --out=users.json

# Import data
mongoimport --uri="$MONGO_URL" --collection=users --file=users.json
```

## License

MIT

## Support

If you run into issues, check:
1. Error logs in the console
2. MongoDB connection status
3. Environment variables are set correctly
4. Network/firewall isn't blocking connections
5. Database scaling guide for production setup
