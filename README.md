# Authscale — Instant Express API with MongoDb and JWT auth and built-in user management.

A powerful CLI tool that instantly scaffolds a production-ready Node.js backend with Express and MongoDB. It auto-generates clean REST APIs, JWT auth (access + refresh tokens), MongoDB transactions, soft delete, update tracking, validation, and full security hardening. Includes centralized error handling, logging, Docker setup, environment config, and database scaling templates—everything set up automatically with a single command.

## Installation

You don't need to install it globally. Just use `npx`:

```bash
npx authscale <project-name>
```

Or with npm:

```bash
npm create authscale@latest <project-name>
```

## Usage

```bash
npx authscale my-backend
```

This will create a new directory called `my-backend` with a complete backend template.

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

After creating your project:

```bash
cd <project-name>
npm install
cp .env.example .env  # If .env.example exists
npm run dev
```

## Project Structure

```
<project-name>/
├── src/
│   ├── config/          # Configuration
│   ├── constants/       # Status codes, messages
│   ├── controllers/     # Request handlers
│   ├── middlewares/     # Auth, validation, error handling
│   ├── models/          # Database schemas
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── utils/           # Helper functions
│   ├── app.js           # Express app setup
│   └── server.js        # Server entry point
├── test/                # Test files
├── docker-compose.yml    # Docker Compose setup
├── Dockerfile           # Docker configuration
└── package.json         # Dependencies
```

## Requirements

- Node.js >= 18.0.0
- npm >= 9.0.0

## License

This project is open source and available under the MIT License.  


---

## Contact

If you have any questions, feedback, or suggestions, feel free to reach out:

- 📧 Email: [bidyut.kundu.dev@gmail.com](bidyut.kundu.dev@gmail.com)  
- 💻 GitHub: [https://github.com/bidyut10/authscale](https://github.com/bidyut10/authscale)  
- 🐦 Portfolio: [https://bidyutkundu.netlify.app](https://bidyutkundu.netlify.app) 

