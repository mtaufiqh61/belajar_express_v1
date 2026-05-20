# Belajar Express v1.0

A learning project showcasing a RESTful API built with Express.js, featuring user authentication, product management, and email queuing with RabbitMQ.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: PostgreSQL (with Sequelize for migrations)
- **Cache**: Redis
- **Message Queue**: RabbitMQ
- **Authentication**: JWT (Access Token + Refresh Token)
- **File Upload**: Multer (stored in `public/uploads`)
- **Logging**: Pino
- **Validation**: Joi
- **Load Balancing**: Nginx (reverse proxy for 2 instances)
- **Containerization**: Docker & Docker Compose

## Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development without Docker)
- Nginx installed on your OS (for mounting in Docker)

## Project Structure

```
src/
├── config/          # Database, RabbitMQ, and app config
├── controllers/     # Request handlers (auth, products, users)
├── middlewares/     # Auth, validation middleware
├── routes/          # API route definitions
├── services/        # Business logic layer
├── tests/           # Integration tests
├── types/           # TypeScript type definitions
├── utils/           # Helpers (logger, error handling, rate limiter)
├── validations/     # Joi validation schemas
├── workers/         # Background workers (email sender via RabbitMQ)
├── app.ts           # Express app setup
└── server.ts        # Server entry point
```

## Setup & Installation

### 1. Clone and Install Dependencies

```bash
git clone <repo-url>
cd belajar-express
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in all values:

```bash
cp .env.example .env
```

Required variables:
- `SECRET_KEY`, `REFRESH_SECRET_KEY` - JWT signing keys
- `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_PORT` - PostgreSQL credentials
- `REDIS_PASSWORD` - Redis authentication
- `RABBITMQ_DEFAULT_USER`, `RABBITMQ_DEFAULT_PASS` - RabbitMQ credentials
- `MAIL_*` - Gmail SMTP settings
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment (development, test, production)

### 3. Update Nginx Config Path (Important)

In `docker-compose.yml`, update the Nginx volume path to match your OS:

```yaml
web-server:
  volumes:
    - /path/to/your/nginx.conf:/etc/nginx/nginx.conf  # Update this path
```

**Example paths:**
- **macOS**: `/opt/homebrew/etc/nginx/nginx.conf`
- **Linux**: `/etc/nginx/nginx.conf`
- **Windows (WSL2)**: `/mnt/c/path/to/nginx.conf` or use Docker Desktop path

### 4. Start Services with Docker Compose

```bash
docker-compose up --build -d
```

This will:
- Create and start PostgreSQL, Redis, RabbitMQ
- Run database migrations automatically
- Start 2 Express instances (app1 on :3001, app2 on :3002)
- Start Nginx on port 80 (load balancer)
- Start RabbitMQ email worker

## API Endpoints

Base URL: `http://localhost` (through Nginx load balancer)

### Authentication (`/api/v1/auth`)

- `POST /register` - Register new user with avatar upload
- `POST /login` - Login and get access token
- `POST /logout` - Logout (invalidates tokens)
- `POST /refresh-token` - Refresh expired access token

### Users (`/api/v1/users`)

- `GET /?page=1&limit=10&searchName=&searchEmail=` - Get all users (cached)
- `GET /:id` - Get user by ID (cached)

### Products (`/api/v1/products`)

- `GET /?page=1&limit=10&prodName=&priceStart=&priceEnd=&prodDesc=` - Get products (cached)
- `POST /` - Create product (authenticated)

## Running Locally (Without Docker)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Run migrations (requires PostgreSQL running)
npm run migration

# Start development server
npm run dev
```

## Running Tests

```bash
npm test
```

Tests are standalone (no Docker required). Integration tests cover auth and product endpoints.

## Building for Production

```bash
# Build TypeScript
npm run build:ts

# Start server
npm start
```

## Key Features

✅ **JWT Authentication** - Access + Refresh token pattern with Redis session store
✅ **Rate Limiting** - Different limits for auth (`/auth`) and general endpoints
✅ **File Upload** - Avatar upload with validation (JPEG, JPG, PNG, max 5MB)
✅ **Caching** - Redis cache for users and products (invalidated on create/update)
✅ **Email Queuing** - RabbitMQ worker for async email sending (optional but recommended)
✅ **Load Balancing** - 2 Express instances behind Nginx
✅ **Structured Logging** - Pino logger for debugging
✅ **Error Handling** - Custom AppError with field-level validation errors
✅ **Database Migrations** - Sequelize for schema version control

## Worker (Email Sending)

The email worker listens to RabbitMQ and sends emails asynchronously. If the worker crashes:
- Emails stay in the queue
- Registration still succeeds
- Error is logged in Docker terminal

Restart with:
```bash
docker-compose restart worker
```

## Environment Notes

- **Development**: `NODE_ENV=development` enables hot reload with `ts-node-dev`
- **Production**: Build TypeScript first, then run from `dist/`
- **Test**: Uses test database (`DB_NAME_TEST`)

## Troubleshooting

### "Cannot connect to RabbitMQ"
- Ensure RabbitMQ service is running: `docker-compose ps`
- Check credentials in `.env` match `docker-compose.yml`
- Worker errors won't block registration — check Docker logs: `docker-compose logs worker`

### "Nginx config not found"
- Update volume path in `docker-compose.yml` to your OS's nginx.conf location
- Verify path exists: `ls -l /path/to/nginx.conf`

### "Database connection refused"
- Ensure PostgreSQL is running: `docker-compose ps`
- Check `DB_HOST`, `DB_USER`, `DB_PASSWORD` in `.env`
- Migrations run automatically; check logs: `docker-compose logs db`

### "Redis connection failed"
- Check Redis password in `.env` matches `REDIS_PASSWORD`
- Verify cache service is running: `docker-compose ps cache`

## Notes for Learning

This is a learning project demonstrating:
- Clean architecture (controllers → services)
- Async/await patterns
- Error handling middleware
- JWT token refresh strategy
- Redis caching
- Database migrations
- Multi-instance deployment with load balancing
- Background job processing with message queues

Feel free to experiment, break things, and learn!

## Author

mtaufiqh61

## License

ISC