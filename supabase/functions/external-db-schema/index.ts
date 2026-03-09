import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Pool } from "https://deno.land/x/postgres@v0.19.3/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const dbUrl = Deno.env.get('EXTERNAL_DB_URL');
  if (!dbUrl) {
    return new Response(JSON.stringify({ error: 'EXTERNAL_DB_URL not configured' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Build proper connection string if not already a URL
  let connectionString = dbUrl;
  if (!dbUrl.startsWith('postgresql://') && !dbUrl.startsWith('postgres://')) {
    // Assume the secret is just the password, construct the full URL
    connectionString = `postgresql://agencexp_onufemmes_user:${dbUrl}@91.204.209.25:5432/agencexp_onufemmes`;
  }

  const pool = new Pool(connectionString, 1);

  try {
    const connection = await pool.connect();
    try {
      const result = await connection.queryObject(`
        SELECT 
          t.table_schema,
          t.table_name,
          c.column_name,
          c.data_type,
          c.is_nullable,
          c.column_default
        FROM information_schema.tables t
        JOIN information_schema.columns c 
          ON t.table_name = c.table_name 
          AND t.table_schema = c.table_schema
        WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
          AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_schema, t.table_name, c.ordinal_position
      `);

      const tables: Record<string, any> = {};
      for (const row of result.rows as any[]) {
        const key = `${row.table_schema}.${row.table_name}`;
        if (!tables[key]) {
          tables[key] = { schema: row.table_schema, table: row.table_name, columns: [] };
        }
        tables[key].columns.push({
          name: row.column_name,
          type: row.data_type,
          nullable: row.is_nullable === 'YES',
          default: row.column_default,
        });
      }

      return new Response(JSON.stringify({ tables: Object.values(tables) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('DB connection error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } finally {
    await pool.end();
  }
});
