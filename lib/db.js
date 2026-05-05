import { sql } from "@vercel/postgres";

let initialized = false;

export async function ensureQuizTable() {
  const postgresUrl = process.env.POSTGRES_URL || "";
  if (!postgresUrl || postgresUrl.includes("user:password@host/db")) {
    throw new Error("Database is not configured. Set a valid POSTGRES_URL in .env.local or Vercel env vars.");
  }

  if (initialized) return;

  await sql`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      set_id TEXT NOT NULL,
      set_title TEXT NOT NULL,
      answers JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `;

  initialized = true;
}

export { sql };
