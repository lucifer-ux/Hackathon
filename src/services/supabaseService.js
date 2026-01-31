import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

export async function executeQuery(queryConfig) {
    if (!supabase) {
        throw new Error("Supabase client not initialized. Check your environment variables.");
    }

    try {
        const { table, select, filters, order, limit } = queryConfig;

        let query = supabase.from(table).select(select);

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
