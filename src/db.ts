import { sql, SQL } from "bun";

/**
 * Database connection singleton
 * Uses Bun's native SQL module with PostgreSQL
 * 
 * Configuration via environment variables:
 * - DATABASE_URL: Full PostgreSQL connection string (postgres://user:pass@host:port/db)
 * - Or individual variables: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 * 
 * Features:
 * - Connection pooling (configurable max connections)
 * - Automatic prepared statements
 * - Built-in transaction support
 * - Type-safe error handling
 */

// Create a single database connection instance
// Uses DATABASE_URL or individual PG* environment variables for configuration
export const db = new SQL({
    // Connection pooling settings
    max: parseInt(process.env.DB_POOL_MAX || "20", 10),
    idleTimeout: 30, // Close idle connections after 30 seconds
    connectionTimeout: 10, // Timeout for establishing new connections
});

// Helper function to run queries
export async function query<T = any>(sql: TemplateStringsArray, ...values: any[]): Promise<T[]> {
    try {
        const result = await db`${sql}${values}`;
        return result as T[];
    } catch (error) {
        console.error("Database query error:", error);
        throw error;
    }
}

// Helper function for transactions
export async function transaction<T>(
    callback: (tx: any) => Promise<T>
): Promise<T> {
    return db.begin(callback);
}

// Health check
export async function checkConnection(): Promise<boolean> {
    try {
        const result = await db`SELECT 1`;
        return true;
    } catch (error) {
        console.error("Database connection check failed:", error);
        return false;
    }
}

export default db;
