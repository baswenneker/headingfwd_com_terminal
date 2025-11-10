/**
 * Next.js instrumentation hook - runs once on server startup
 * https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 *
 * Database Migration Strategy:
 * - Production: Runs migrations automatically on startup
 * - Development: Skip migrations, use `npm run db:push` for schema changes
 */
export async function register() {
  // Only run in Node.js runtime (not Edge)
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Lazy import Node.js modules to avoid Edge Runtime errors
    const path = await import("path");
    const { migrate } = await import("drizzle-orm/libsql/migrator");

    // Lazy import to avoid circular dependencies
    const { db } = await import("~/server/db");

    // Only run migrations in production
    // In development, use `npm run db:push` for faster iteration
    if (process.env.NODE_ENV === "production") {
      try {
        console.log("[Database] Running migrations on startup...");

        // Use absolute path to ensure migrations are found in Vercel deployments
        const migrationsFolder = path.default.join(process.cwd(), "drizzle");
        console.log(`[Database] Migrations folder: ${migrationsFolder}`);

        // Run migrations - this is idempotent and safe to run multiple times
        await migrate(db, {
          migrationsFolder,
        });

        console.log("[Database] ✓ Migrations completed successfully");
      } catch (error) {
        console.error("[Database] ✗ Migration failed:", error);

        if (error instanceof Error) {
          // Provide helpful, actionable error messages
          const errorMessage = error.message.toLowerCase();

          if (
            errorMessage.includes("unauthorized") ||
            errorMessage.includes("auth") ||
            errorMessage.includes("token")
          ) {
            console.error(
              "\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Database Error: Authentication Failed\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "The database connection was rejected due to authentication.\n" +
                "\n" +
                "Possible causes:\n" +
                "  • TURSO_AUTH_TOKEN is not set\n" +
                "  • TURSO_AUTH_TOKEN is invalid or expired\n" +
                "  • Token doesn't have permission for this database\n" +
                "\n" +
                "To fix:\n" +
                "  1. Check your TURSO_AUTH_TOKEN environment variable\n" +
                "  2. Generate a new token: turso db tokens create <database-name>\n" +
                "  3. Check token status: turso db tokens list <database-name>\n" +
                "  4. Update your environment variables in production\n" +
                "═══════════════════════════════════════════════════════════\n",
            );
          } else if (
            errorMessage.includes("not found") ||
            errorMessage.includes("enotfound") ||
            errorMessage.includes("does not exist")
          ) {
            console.error(
              "\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Database Error: Database Not Found\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "The database could not be found at the specified URL.\n" +
                "\n" +
                "Possible causes:\n" +
                "  • Database hasn't been created yet\n" +
                "  • DATABASE_URL is incorrect\n" +
                "  • Network connectivity issues\n" +
                "\n" +
                "To fix:\n" +
                "  1. Create the database: turso db create <database-name>\n" +
                "  2. Verify DATABASE_URL: turso db show <database-name>\n" +
                "  3. Check your DATABASE_URL environment variable\n" +
                "  4. Ensure format: libsql://your-database.turso.io\n" +
                "═══════════════════════════════════════════════════════════\n",
            );
          } else if (
            errorMessage.includes("meta/_journal.json") ||
            errorMessage.includes("migrations") ||
            errorMessage.includes("enoent")
          ) {
            console.error(
              "\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Database Error: Migration Files Not Found\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "The migration files could not be found.\n" +
                "\n" +
                "Possible causes:\n" +
                "  • Migration files not generated\n" +
                "  • drizzle/ folder missing from deployment\n" +
                "  • Build process didn't include migration files\n" +
                "\n" +
                "To fix:\n" +
                "  1. Generate migrations: npm run db:generate\n" +
                "  2. Ensure drizzle/ folder exists with migrations\n" +
                "  3. Check that drizzle/ is not in .gitignore\n" +
                "  4. Verify deployment includes migration files\n" +
                "═══════════════════════════════════════════════════════════\n",
            );
          } else if (
            errorMessage.includes("network") ||
            errorMessage.includes("timeout") ||
            errorMessage.includes("connect")
          ) {
            console.error(
              "\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Database Error: Connection Failed\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Could not establish a connection to the database.\n" +
                "\n" +
                "Possible causes:\n" +
                "  • Network connectivity issues\n" +
                "  • Database server is down\n" +
                "  • Firewall blocking connection\n" +
                "  • Invalid DATABASE_URL format\n" +
                "\n" +
                "To fix:\n" +
                "  1. Check your network connection\n" +
                "  2. Verify DATABASE_URL is correct\n" +
                "  3. Test connection: turso db shell <database-name>\n" +
                "  4. Check Turso service status\n" +
                "═══════════════════════════════════════════════════════════\n",
            );
          } else {
            console.error(
              "\n" +
                "═══════════════════════════════════════════════════════════\n" +
                "Database Error: Initialization Failed\n" +
                "═══════════════════════════════════════════════════════════\n" +
                `Error: ${error.message}\n` +
                "\n" +
                "Troubleshooting steps:\n" +
                "  1. Verify DATABASE_URL is set correctly\n" +
                "  2. Verify TURSO_AUTH_TOKEN is set (for production)\n" +
                "  3. Ensure database exists: turso db list\n" +
                "  4. Check database permissions\n" +
                "  5. Review error message above for specific details\n" +
                "═══════════════════════════════════════════════════════════\n",
            );
          }
        }

        // In production, we want to fail fast and prevent the server from starting
        // with a broken database connection
        console.error(
          "\n[Database] FATAL: Cannot start server without database connection in production",
        );
        throw error;
      }
    } else {
      // Development mode - skip automatic migrations
      console.log(
        "\x1b[33m[Database] Development mode - automatic migrations disabled\x1b[0m",
      );
      console.log(
        "\x1b[33m[Database] Use 'npm run db:push' to sync schema changes to your local database\x1b[0m",
      );
    }
  }
}
