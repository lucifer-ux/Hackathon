import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
let activeClient = null;

// Initialize default client from env vars if available
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    activeClient = supabase;
}

/**
 * Create a new Supabase client with user-provided credentials
 */
export function createDynamicClient(url, anonKey) {
    return createClient(url, anonKey);
}

/**
 * Set the active client for queries
 */
export function setActiveClient(client) {
    activeClient = client;
}

/**
 * Get the current active client
 */
export function getActiveClient() {
    return activeClient || supabase;
}

/**
 * Test connection to Supabase by attempting to fetch from a system table
 */
export async function testConnection(client) {
    try {
        // Try to access the schema - this will fail if credentials are wrong
        const { error } = await client.from('_test_connection_').select('*').limit(1);

        // We expect a "relation does not exist" error for non-existent table
        // Auth errors would be different (401/403)
        if (error) {
            // Check if it's an auth error
            if (error.code === 'PGRST301' || error.message?.includes('JWT') ||
                error.message?.includes('auth') || error.code === '401' || error.code === '403') {
                return { success: false, error: 'Invalid credentials or unauthorized' };
            }
            // Table not found is expected - connection works
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Parse a CSV file and return structured data
 */
export function parseCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const text = e.target.result;
                const lines = text.split(/\r?\n/).filter(line => line.trim());

                if (lines.length < 2) {
                    reject(new Error('CSV must have at least a header row and one data row'));
                    return;
                }

                // Parse header
                const columns = parseCSVLine(lines[0]);

                // Parse rows
                const rows = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = parseCSVLine(lines[i]);
                    if (values.length === columns.length) {
                        const row = {};
                        columns.forEach((col, idx) => {
                            // Clean column name for database compatibility
                            const cleanCol = col.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
                            row[cleanCol] = parseValue(values[idx]);
                        });
                        rows.push(row);
                    }
                }

                // Return cleaned column names
                const cleanColumns = columns.map(col =>
                    col.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '')
                );

                resolve({ columns: cleanColumns, rows });
            } catch (err) {
                reject(err);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Parse a single CSV line handling quotes
 */
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}

/**
 * Parse a string value to appropriate type
 */
function parseValue(value) {
    if (value === '' || value === null || value === undefined) {
        return null;
    }

    // Try number
    const num = Number(value);
    if (!isNaN(num) && value.trim() !== '') {
        return num;
    }

    // Try boolean
    const lower = value.toLowerCase();
    if (lower === 'true') return true;
    if (lower === 'false') return false;

    // Return as string
    return value;
}

/**
 * Fetch list of tables from the connected Supabase database
 * Uses the information_schema to get public tables
 */
export async function fetchTables(client = null) {
    const activeClientToUse = client || getActiveClient();

    if (!activeClientToUse) {
        return { success: false, tables: [], error: 'No Supabase client connected' };
    }

    try {
        // Try to query information_schema for tables
        // This requires a custom RPC function or we use a workaround
        // We'll try to use the postgrest schema endpoint
        const response = await fetch(`${activeClientToUse.supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': activeClientToUse.supabaseKey,
                'Authorization': `Bearer ${activeClientToUse.supabaseKey}`,
            }
        });

        if (response.ok) {
            const schema = await response.json();
            // The response contains OpenAPI schema with table definitions
            if (schema.definitions) {
                const tables = Object.keys(schema.definitions).filter(
                    name => !name.startsWith('_') && name !== 'rpc'
                );
                return { success: true, tables };
            }
        }

        // Fallback: return empty array if we can't get tables
        return { success: true, tables: [] };
    } catch (err) {
        console.error('Error fetching tables:', err);
        return { success: false, tables: [], error: err.message };
    }
}

/**
 * Infer SQL column type from a JavaScript value
 */
function inferSQLType(value) {
    if (value === null || value === undefined) {
        return 'TEXT';
    }
    if (typeof value === 'boolean') {
        return 'BOOLEAN';
    }
    if (typeof value === 'number') {
        return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC';
    }
    // Check if it looks like a date
    if (typeof value === 'string') {
        const datePattern = /^\d{4}-\d{2}-\d{2}/;
        if (datePattern.test(value)) {
            return 'TIMESTAMP';
        }
    }
    return 'TEXT';
}

/**
 * Infer column types from CSV data by sampling rows
 */
function inferColumnTypes(csvData) {
    const columnTypes = {};

    // Sample first 10 rows (or all if less)
    const sampleSize = Math.min(10, csvData.rows.length);

    csvData.columns.forEach(col => {
        const types = new Set();

        for (let i = 0; i < sampleSize; i++) {
            const value = csvData.rows[i][col];
            if (value !== null && value !== undefined) {
                types.add(inferSQLType(value));
            }
        }

        // Prioritize: TEXT > TIMESTAMP > NUMERIC > INTEGER > BOOLEAN
        if (types.has('TEXT')) {
            columnTypes[col] = 'TEXT';
        } else if (types.has('TIMESTAMP')) {
            columnTypes[col] = 'TIMESTAMP';
        } else if (types.has('NUMERIC')) {
            columnTypes[col] = 'NUMERIC';
        } else if (types.has('INTEGER')) {
            columnTypes[col] = 'INTEGER';
        } else if (types.has('BOOLEAN')) {
            columnTypes[col] = 'BOOLEAN';
        } else {
            columnTypes[col] = 'TEXT';
        }
    });

    return columnTypes;
}

/**
 * Create a table in Supabase using direct SQL execution via RPC
 */
export async function createTable(tableName, csvData) {
    const client = getActiveClient();

    if (!client) {
        return { success: false, error: 'No Supabase client connected' };
    }

    try {
        const columnTypes = inferColumnTypes(csvData);

        // Build CREATE TABLE SQL
        const columnDefs = csvData.columns.map(col => {
            const sqlType = columnTypes[col] || 'TEXT';
            return `"${col}" ${sqlType}`;
        }).join(', ');

        const createSQL = `CREATE TABLE IF NOT EXISTS "${tableName}" (id SERIAL PRIMARY KEY, ${columnDefs})`;

        // Try using the rpc method if available
        const { error } = await client.rpc('exec_sql', { sql: createSQL });

        if (error) {
            // If exec_sql RPC doesn't exist, we can't create tables programmatically
            if (error.message?.includes('function') || error.code === 'PGRST202') {
                return {
                    success: false,
                    error: `Cannot create table automatically. Please create the table manually in Supabase with these columns: ${csvData.columns.join(', ')}`,
                    sql: createSQL
                };
            }
            throw error;
        }

        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Upload CSV data to Supabase table
 * Will attempt to create the table if it doesn't exist
 */
export async function uploadCSVData(tableName, csvData, createIfNotExist = true) {
    const client = getActiveClient();

    if (!client) {
        return { success: false, error: 'No Supabase client connected' };
    }

    try {
        // Insert data in batches of 100
        const batchSize = 100;
        const rows = csvData.rows;
        let insertedCount = 0;

        for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);

            const { error } = await client
                .from(tableName)
                .insert(batch);

            if (error) {
                // Check if it's a "table doesn't exist" error
                if (error.code === '42P01' || error.message?.includes('does not exist') ||
                    error.message?.includes('schema cache')) {

                    if (createIfNotExist && i === 0) {
                        // Try to create the table first
                        const createResult = await createTable(tableName, csvData);

                        if (!createResult.success) {
                            return {
                                success: false,
                                error: createResult.error,
                                needsManualCreate: true,
                                columns: csvData.columns,
                                sql: createResult.sql
                            };
                        }

                        // Retry the insert after table creation
                        const { error: retryError } = await client
                            .from(tableName)
                            .insert(batch);

                        if (retryError) {
                            throw retryError;
                        }
                    } else {
                        return {
                            success: false,
                            error: `Table "${tableName}" does not exist. Please create it first.`,
                            needsManualCreate: true,
                            columns: csvData.columns
                        };
                    }
                } else {
                    throw error;
                }
            }

            insertedCount += batch.length;
        }

        return { success: true, insertedCount };
    } catch (err) {
        return { success: false, error: err.message };
    }
}

/**
 * Execute a query against Supabase (existing functionality preserved)
 */
export async function executeQuery(queryConfig) {
    const client = getActiveClient();

    if (!client) {
        throw new Error("Supabase client not initialized. Please connect to Supabase first.");
    }

    try {
        const { table, select, filters, order, limit } = queryConfig;

        let query = client.from(table).select(select);

        if (filters && Array.isArray(filters)) {
            filters.forEach(filter => {
                const { column, operator, value } = filter;
                switch (operator) {
                    case 'eq': query = query.eq(column, value); break;
                    case 'neq': query = query.neq(column, value); break;
                    case 'gt': query = query.gt(column, value); break;
                    case 'gte': query = query.gte(column, value); break;
                    case 'lt': query = query.lt(column, value); break;
                    case 'lte': query = query.lte(column, value); break;
                    case 'like': query = query.like(column, value); break;
                    case 'ilike': query = query.ilike(column, value); break;
                    case 'in': query = query.in(column, value); break;
                    case 'is': query = query.is(column, value); break;
                    default: console.warn(`Unknown operator ${operator}`);
                }
            });
        }

        if (order) {
            query = query.order(order.column, { ascending: order.ascending ?? true });
        }

        if (limit) {
            query = query.limit(limit);
        }

        const { data, error } = await query;

        if (error) throw error;

        return { data, error: null };

    } catch (err) {
        console.error("Supabase Query Error:", err);
        return { data: null, error: err.message };
    }
}
