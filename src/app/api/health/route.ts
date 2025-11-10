import { sql } from "drizzle-orm";
import { db } from "~/server/db";
import { ErrorCode } from "~/lib/errors";
import { chatSessions } from "~/server/db/schema";

/**
 * Health check endpoint
 * Tests database connectivity and returns server status
 *
 * This endpoint is useful for:
 * - Monitoring tools and uptime checks
 * - Vercel health checks
 * - Load balancer health probes
 * - Debugging database connectivity issues
 */
export async function GET() {
  try {
    // Simple query to test database connectivity
    // This will throw if the database is unreachable
    // Using a simple count query on an existing table
    await db.select({ count: sql<number>`count(*)` }).from(chatSessions);

    return Response.json(
      {
        status: "healthy",
        database: "connected",
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Log the error for debugging
    console.error("[Health Check] Database connection failed:", errorMessage);

    return Response.json(
      {
        status: "unhealthy",
        database: "disconnected",
        error: errorMessage,
        code: ErrorCode.DATABASE_CONNECTION_FAILED,
        timestamp: new Date().toISOString(),
      },
      { status: 503 }, // Service Unavailable
    );
  }
}
