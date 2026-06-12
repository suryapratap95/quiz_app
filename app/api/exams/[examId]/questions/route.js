import { ensureSchema, query } from "@/lib/db";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// POST /api/exams/:examId/questions — add questions to exam (admin only)
export async function POST(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;
    const body = await request.json();
    const { questions } = body;

    if (!Array.isArray(questions) || questions.length === 0) {
      return Response.json({ error: "Questions array is required" }, { status: 400 });
    }

    // Verify exam exists
    const { rows: exams } = await query(`SELECT id FROM exams WHERE id = $1`, [examId]);
    if (exams.length === 0) {
      return Response.json({ error: "Exam not found" }, { status: 404 });
    }

    // Get current max sort_order
    const { rows: maxRows } = await query(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order FROM questions WHERE exam_id = $1`,
      [examId]
    );
    let sortOrder = (maxRows[0]?.max_order ?? -1) + 1;

    let inserted = 0;
    for (const q of questions) {
      if (!q.question_text?.trim() || !Array.isArray(q.options) || q.options.length < 2) {
        continue;
      }

      const id = q.id || `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      await query(
        `INSERT INTO questions (id, exam_id, question_text, options, correct_answer, topic, sort_order)
         VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
           question_text = EXCLUDED.question_text,
           options = EXCLUDED.options,
           correct_answer = EXCLUDED.correct_answer,
           topic = EXCLUDED.topic,
           sort_order = EXCLUDED.sort_order`,
        [
          id,
          examId,
          q.question_text.trim(),
          JSON.stringify(q.options),
          q.correct_answer ?? 0,
          q.topic || "General",
          sortOrder++,
        ]
      );
      inserted++;
    }

    return Response.json({ ok: true, inserted });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to add questions" }, { status: 500 });
  }
}

// DELETE /api/exams/:examId/questions — remove all questions from exam (admin only)
export async function DELETE(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;

    await query(`DELETE FROM questions WHERE exam_id = $1`, [examId]);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to delete questions" }, { status: 500 });
  }
}
