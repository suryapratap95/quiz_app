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

  // Existing production databases may have been created before these columns
  // existed. CREATE TABLE IF NOT EXISTS does not update existing tables, so keep
  // the schema forward-compatible with explicit, safe migrations.
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS title TEXT`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS description TEXT DEFAULT ''`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '30 min'`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1'`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'trainer'`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS allow_multiple_attempts BOOLEAN DEFAULT false`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS show_results BOOLEAN DEFAULT false`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  await query(`ALTER TABLE exams ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);
  await query(`UPDATE exams SET title = id WHERE title IS NULL OR title = ''`);
  await query(`ALTER TABLE exams ALTER COLUMN title SET NOT NULL`);

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

  // Repair legacy questions schemas before any query references exam_id. Some
  // earlier versions used camelCase examId, and CREATE TABLE IF NOT EXISTS does
  // not modify existing tables.
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions' AND column_name = 'exam_id'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'questions' AND column_name = 'examId'
        ) THEN
          ALTER TABLE questions RENAME COLUMN "examId" TO exam_id;
        ELSE
          ALTER TABLE questions ADD COLUMN exam_id TEXT;
        END IF;
      END IF;
    END $$;
  `);
  await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic TEXT DEFAULT 'General'`);
  await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0`);
  await query(`ALTER TABLE questions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

  // If a legacy questions table exists without exam_id, attach those questions
  // to a generated legacy exam so trainer login/listing queries do not fail.
  await query(`
    INSERT INTO exams (id, title, description, duration, color)
    SELECT 'legacy-exam', 'Legacy Exam', 'Migrated questions from the previous schema.', '30 min', '#6366f1'
    WHERE EXISTS (
      SELECT 1 FROM questions
      WHERE exam_id IS NULL OR exam_id = ''
    )
    ON CONFLICT (id) DO NOTHING
  `);
  await query(`UPDATE questions SET exam_id = 'legacy-exam' WHERE exam_id IS NULL OR exam_id = ''`);
  await query(`ALTER TABLE questions ALTER COLUMN exam_id SET NOT NULL`);
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'questions_exam_id_fkey'
      ) THEN
        ALTER TABLE questions
          ADD CONSTRAINT questions_exam_id_fkey
          FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE;
      END IF;
    END $$;
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
  // Repair legacy result schemas before any query references exam_id/exam_title.
  // Previous versions used set_id/set_title or camelCase names.
  await query(`
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_results' AND column_name = 'exam_id'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'quiz_results' AND column_name = 'examId'
        ) THEN
          ALTER TABLE quiz_results RENAME COLUMN "examId" TO exam_id;
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'quiz_results' AND column_name = 'set_id'
        ) THEN
          ALTER TABLE quiz_results RENAME COLUMN set_id TO exam_id;
        ELSE
          ALTER TABLE quiz_results ADD COLUMN exam_id TEXT;
        END IF;
      END IF;

      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_results' AND column_name = 'exam_title'
      ) THEN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'quiz_results' AND column_name = 'examTitle'
        ) THEN
          ALTER TABLE quiz_results RENAME COLUMN "examTitle" TO exam_title;
        ELSIF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'quiz_results' AND column_name = 'set_title'
        ) THEN
          ALTER TABLE quiz_results RENAME COLUMN set_title TO exam_title;
        ELSE
          ALTER TABLE quiz_results ADD COLUMN exam_title TEXT;
        END IF;
      END IF;
    END $$;
  `);
  await query(`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS exam_title TEXT`);
  await query(`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0`);
  await query(`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS total INTEGER DEFAULT 0`);
  await query(`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS percentage NUMERIC(5,2) DEFAULT 0`);
  await query(`ALTER TABLE quiz_results ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()`);

  // Migrate legacy result rows that used set_id/set_title instead of exam_id/exam_title.
  // Use a DO block so brand-new databases without set_id/set_title do not fail.
  await query(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_results' AND column_name = 'set_id'
      ) THEN
        UPDATE quiz_results
        SET exam_id = COALESCE(exam_id, set_id, 'legacy-exam')
        WHERE exam_id IS NULL;
      ELSE
        UPDATE quiz_results
        SET exam_id = COALESCE(exam_id, 'legacy-exam')
        WHERE exam_id IS NULL;
      END IF;

      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'quiz_results' AND column_name = 'set_title'
      ) THEN
        UPDATE quiz_results
        SET exam_title = COALESCE(exam_title, set_title, 'Legacy Exam')
        WHERE exam_title IS NULL;
      ELSE
        UPDATE quiz_results
        SET exam_title = COALESCE(exam_title, 'Legacy Exam')
        WHERE exam_title IS NULL;
      END IF;
    END $$;
  `);
  await query(`
    INSERT INTO exams (id, title, description, duration, color)
    SELECT DISTINCT exam_id, COALESCE(exam_title, exam_id), 'Migrated results from the previous schema.', '30 min', '#6366f1'
    FROM quiz_results
    WHERE exam_id IS NOT NULL
    ON CONFLICT (id) DO NOTHING
  `);
  await query(`ALTER TABLE quiz_results ALTER COLUMN exam_id SET NOT NULL`);
  await query(`ALTER TABLE quiz_results ALTER COLUMN exam_title SET NOT NULL`);

  // The previous single-quiz schema allowed only one result per email globally.
  // Multi-exam mode needs uniqueness per email + exam instead.
  await query(`DROP INDEX IF EXISTS idx_quiz_results_email_unique`);

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
