# HeadingFWD website

## 0. Deployment

This project is deployed on Vercel. Pushing to the `production` branch triggers an automatic deployment.

**Deployment Workflow:**

```bash
# Deploy using the custom script (merges main → production and pushes)
pnpm run deploy
```

The deploy script:

1. Checks out `main` branch and pushes latest changes
2. Checks out `production` branch
3. Merges `main` into `production`
4. Pushes to trigger Vercel deployment
5. Returns to `main` branch

**Manual Deployment:**

```bash
# Push directly to production branch
git checkout production
git merge main
git push
git checkout main
```

**Branch Strategy:**

- `main` - Main development branch
- `production` - Production deployment branch (triggers Vercel deployment)
- Feature branches - For new features (merge to `main` via PR)

## 1. Database Setup

This project uses SQLite for local development/testing and Turso (a distributed SQLite database) for production.

### 1.1 Local Development (SQLite)

For local development, the application uses a simple file-based SQLite database.

**Important:** In development, automatic migrations are **disabled**. Use `db:push` for faster iteration.

```bash
# Install dependencies
pnpm install

# Sync database schema (required for first setup)
pnpm run db:push

# Start development server
pnpm run dev
```

**Development Workflow:**

- Database file: `./db.sqlite` (created automatically)
- Schema changes: Run `pnpm run db:push` to sync your schema
- No migration tracking in development
- Automatic migrations skip in development mode

When you start the dev server, you'll see:

```
[Database] Development mode - automatic migrations disabled
[Database] Use 'npm run db:push' to sync schema changes to your local database
```

### 1.2 Production (Turso)

For production, we use [Turso](https://turso.tech/), a distributed SQLite database built on libSQL.

#### 1.2.1 Setting up Turso

1. **Install Turso CLI**

   ```bash
   # macOS/Linux
   curl -sSfL https://get.tur.so/install.sh | bash

   # Or using Homebrew
   brew install tursodatabase/tap/turso
   ```

2. **Authenticate with Turso**

   ```bash
   turso auth signup  # Create account (if needed)
   turso auth login   # Login to existing account
   ```

3. **Create a Database**

   ```bash
   # Create a new database
   turso db create headingfwd-terminal

   # Get the database URL
   turso db show headingfwd-terminal
   ```

4. **Generate an Auth Token**

   ```bash
   # Create an auth token for your database
   turso db tokens create headingfwd-terminal
   ```

5. **Configure Environment Variables**

   Add these to your production environment (e.g., Vercel):

   ```bash
   DATABASE_URL="libsql://headingfwd-terminal-[your-org].turso.io"
   TURSO_AUTH_TOKEN="your-generated-token-here"
   ```

6. **Deploy and Start**

   **Important:** Database migrations run automatically on server startup! You don't need to manually run migrations in production.

   The application uses Next.js instrumentation to:
   - Check database connectivity on startup
   - Automatically apply any pending migrations
   - Provide detailed error messages if setup is incorrect
   - Fail fast in production to prevent serving requests with a broken database

#### 1.2.2 Automatic Migrations (Production Only)

**Important:** Automatic migrations only run in **production**. In development, use `npm run db:push`.

Migrations are applied automatically when the production server starts through the `src/instrumentation.ts` file.

**What happens on startup:**

**Development Mode (NODE_ENV=development):**

- Automatic migrations are **skipped**
- Use `npm run db:push` to sync schema changes
- Faster iteration without migration tracking
- Log message: "Development mode - automatic migrations disabled"

**Production Mode (NODE_ENV=production):**

1. Server starts and loads instrumentation hook
2. Connects to the database using `DATABASE_URL` and `TURSO_AUTH_TOKEN`
3. Checks for pending migrations in the `drizzle/` folder
4. Applies any new migrations that haven't been run yet
5. Logs success or fails fast with detailed error messages

**Error Messages (Production Only):**

If something goes wrong in production, you'll see helpful error messages:

- **Authentication Failed**: Invalid or expired `TURSO_AUTH_TOKEN`
- **Database Not Found**: Database doesn't exist (need to create it first)
- **Migration Files Not Found**: Missing `drizzle/` folder or migration files
- **Connection Failed**: Network or connectivity issues

The server will **fail to start** if the database is not accessible in production. This prevents serving requests with a broken database.

#### 1.2.3 Manual Migration (Optional)

If you need to run migrations manually (e.g., from CI/CD):

```bash
# Set environment variables for Turso
export DATABASE_URL="libsql://your-database.turso.io"
export TURSO_AUTH_TOKEN="your-token"

# Push schema to Turso
npm run db:push

# Or generate and run migrations
npm run db:generate
npm run db:migrate
```

### 1.3 Database Schema Management

This project uses [Drizzle ORM](https://orm.drizzle.team/) for database management.

**Available Commands:**

```bash
# Push schema changes directly (recommended for development)
npm run db:push

# Generate migration files from schema
npm run db:generate

# Apply migrations
npm run db:migrate

# Open Drizzle Studio (visual database browser)
npm run db:studio
```

**Schema Location:** `src/server/db/schema.ts`

### 1.4 Environment Variables

Configure these in your `.env` file (see `.env.example`):

**Database Configuration:**

```env
# Development/Test - Use local SQLite
DATABASE_URL="file:./db.sqlite"
TURSO_AUTH_TOKEN=""  # Leave empty for local development

# Production - Use Turso
DATABASE_URL="libsql://your-database-name.turso.io"
TURSO_AUTH_TOKEN="your-turso-auth-token"
```

**Cloudflare Turnstile (CAPTCHA):**

```env
TURNSTILE_SECRET_KEY="your-secret-key"
NEXT_PUBLIC_TURNSTILE_SITE_KEY="your-site-key"
NEXT_PUBLIC_DISABLE_CAPTCHA="false"  # Set to "true" for development/testing only
```

**OpenAI Configuration:**

```env
OPENAI_API_KEY="your-openai-api-key"
```

**Rate Limiting:**

```env
MESSAGE_RATE_LIMIT="10"  # Maximum AI messages per minute
```

**LangSmith (Optional - for observability):**

```env
LANGSMITH_TRACING="false"  # Set to "true" to enable tracing
LANGSMITH_API_KEY="your-langsmith-api-key"
LANGSMITH_PROJECT="your-project-name"
```

**Contact Information (for /contact command):**

```env
CONTACT_EMAIL="your-email@example.com"
CONTACT_LINKEDIN="https://www.linkedin.com/in/yourprofile"
CONTACT_GITHUB="https://github.com/yourusername"
```

### 1.5 Database Tables

Current schema includes:

- `chatSessions` - Chat session management
- `chatMessages` - Message history storage
- `rateLimitLogs` - Rate limiting tracking

### 1.6 Health Check

The application includes a health check endpoint at `/api/health` that:

- Tests database connectivity
- Returns `200 OK` if the database is accessible
- Returns `503 Service Unavailable` if the database is down
- Includes error details for debugging

**Usage:**

```bash
# Check application health
curl https://your-app.vercel.app/api/health

# Response when healthy:
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2025-10-30T13:30:00.000Z"
}

# Response when unhealthy:
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection failed",
  "code": "DATABASE_CONNECTION_FAILED",
  "timestamp": "2025-10-30T13:30:00.000Z"
}
```

Use this endpoint for:

- Monitoring and alerting
- Vercel health checks
- Load balancer health probes
- Debugging database connectivity

### 1.7 Troubleshooting

**Connection Issues:**

- Verify `DATABASE_URL` is correctly formatted
- For Turso: Ensure `TURSO_AUTH_TOKEN` is set and valid
- Check token hasn't expired: `turso db tokens list <database-name>`

**Migration Issues:**

- Turso databases must exist before running migrations
- Use `turso db create` to create the database first
- Verify you have write permissions on the database

**Local Development:**

- If `db.sqlite` is corrupted, delete it and run `npm run db:push` again
- The database file is gitignored and won't be committed
