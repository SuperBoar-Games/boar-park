import { sql } from "bun";

/**
 * Database utility functions
 * Wraps Bun's SQL module for consistent query execution
 */

/**
 * Execute a raw SQL query with parameters
 * Uses Bun's template literal syntax internally
 */
export async function query<T = any>(sqlString: string, params: any[] = []): Promise<T[]> {
    // Build the SQL template by replacing $1, $2, etc. with actual values
    const parts = sqlString.split(/\$\d+/);
    const values = params;

    // Use Bun's sql template tag
    let result;
    if (values.length === 0) {
        result = await sql.unsafe(sqlString);
    } else {
        // Build query with parameters
        const query = sql([sqlString] as any, ...values);
        result = await query;
    }

    return result as T[];
}

/**
 * Execute a query and return the first result
 */
export async function queryOne<T = any>(sqlString: string, params: any[] = []): Promise<T | null> {
    const results = await query<T>(sqlString, params);
    return results[0] || null;
}

/**
 * Execute a query within a transaction
 */
export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
    await sql`BEGIN`;
    try {
        const result = await callback();
        await sql`COMMIT`;
        return result;
    } catch (error) {
        await sql`ROLLBACK`;
        throw error;
    }
}

/**
 * Helper to execute queries using Bun's native parameter binding
 * This is more efficient than string replacement
 */
export async function exec<T = any>(sqlString: string, ...params: any[]): Promise<T[]> {
    // Use unsafe for now, but Bun will handle escaping
    return await sql.unsafe(sqlString, params) as T[];
}
