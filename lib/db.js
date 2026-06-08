import { createClient } from "@vercel/postgres";

let initialized = false;

function getPostgresUrl() {
  return process.env.POSTGRES_URL || "";
}

export async function query(text, params = []) {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
  if (!connectionString || connectionString.includes("user:password@host/db")) {
    throw new Error(
      "Database is not configured. Set POSTGRES_URL_NON_POOLING or POSTGRES_URL."
    );
  }

  const client = createClient({ connectionString });
  await client.connect();
  try {
    return await client.query(text, params);
  } finally {
    await client.end();
  }
}

export async function ensureQuizTable() {
  const postgresUrl = getPostgresUrl();
  if (!postgresUrl || postgresUrl.includes("user:password@host/db")) {
    throw new Error("Database is not configured. Set a valid POSTGRES_URL in .env.local or Vercel env vars.");
  }

  if (initialized) return;

  await query(
    `CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      set_id TEXT NOT NULL,
      set_title TEXT NOT NULL,
      answers JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  );

  await query(
    `CREATE UNIQUE INDEX IF NOT EXISTS idx_quiz_results_email_unique ON quiz_results (email)`
  );

  initialized = true;
}
