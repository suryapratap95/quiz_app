import { createClient } from "@vercel/postgres";

let initialized = false;

export async function query(text, params = []) {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL || "";
  if (!connectionString || connectionString.includes("user:password@host/db")) {
    throw new Error(
      "Database is not configured. Set POSTGRES_URL in .env.local or Vercel env vars."
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

export async function ensureSchema() {
  if (initialized) return;

  // Exams table — stores trainer-created exams
  await query(`
    CREATE TABLE IF NOT EXISTS exams (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      duration TEXT DEFAULT '30 min',
      color TEXT DEFAULT '#6366f1',
      created_by TEXT DEFAULT 'trainer',
      is_active BOOLEAN DEFAULT true,
      allow_multiple_attempts BOOLEAN DEFAULT false,
      show_results BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Questions table — stores questions for each exam
  await query(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
      question_text TEXT NOT NULL,
      options JSONB NOT NULL,
      correct_answer INTEGER NOT NULL,
      topic TEXT DEFAULT 'General',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Submissions table — student quiz submissions
  await query(`
    CREATE TABLE IF NOT EXISTS quiz_results (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      exam_id TEXT NOT NULL,
      exam_title TEXT NOT NULL,
      answers JSONB NOT NULL,
      score INTEGER DEFAULT 0,
      total INTEGER DEFAULT 0,
      percentage NUMERIC(5,2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);

  // Unique constraint on email + exam_id for single attempt per exam
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_quiz_results_email_exam'
      ) THEN
        CREATE UNIQUE INDEX idx_quiz_results_email_exam ON quiz_results (email, exam_id);
      END IF;
    END $$;
  `);

  initialized = true;
}

// Legacy compat
export const ensureQuizTable = ensureSchema;
