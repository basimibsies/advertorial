import type { LoaderFunctionArgs } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Health check endpoint used by Fly.io to verify the app is running
 * and can connect to the database.
 */
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Verify database connectivity
    await prisma.$queryRaw`SELECT 1`;

    return new Response("OK", {
      status: 200,
      headers: { "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return new Response("Service Unavailable", {
      status: 503,
      headers: { "Content-Type": "text/plain" },
    });
  }
};
