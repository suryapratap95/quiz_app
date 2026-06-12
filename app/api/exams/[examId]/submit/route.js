import { ensureSchema, query } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/exams/:examId/submit — submit quiz answers
export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const { examId } = await params;
    const body = await request.json();
    const { name, email, answers } = body;

    if (!name || !String(name).trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }
    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!answers || typeof answers !== "object") {
      return Response.json({ error: "Answers are required" }, { status: 400 });
    }

    // Get exam info
    const { rows: exams } = await query(
      `SELECT id, title, allow_multiple_attempts FROM exams WHERE id = $1 AND is_active = true`,
      [examId]
    );
    if (exams.length === 0) {
      return Response.json({ error: "Exam not found or inactive" }, { status: 404 });
    }

    const exam = exams[0];
    const normalizedEmail = String(email).trim().toLowerCase();

    // Check if already submitted (unless multiple attempts allowed)
    if (!exam.allow_multiple_attempts) {
      const { rows: existing } = await query(
        `SELECT id FROM quiz_results WHERE email = $1 AND exam_id = $2 LIMIT 1`,
        [normalizedEmail, examId]
      );
      if (existing.length > 0) {
        return Response.json(
          { error: "You have already submitted this exam. Only one attempt is allowed." },
          { status: 409 }
        );
      }
    }

    // Get questions to calculate score
    const { rows: questions } = await query(
      `SELECT id, correct_answer FROM questions WHERE exam_id = $1`,
      [examId]
    );

    let score = 0;
    for (const q of questions) {
      if (answers[q.id] === q.correct_answer) {
        score++;
      }
    }
    const total = questions.length;
    const percentage = total > 0 ? Math.round((score / total) * 100 * 100) / 100 : 0;

    await query(
      `INSERT INTO quiz_results (name, email, exam_id, exam_title, answers, score, total, percentage)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8)`,
      [
        String(name).trim(),
        normalizedEmail,
        examId,
        exam.title,
        JSON.stringify(answers),
        score,
        total,
        percentage,
      ]
    );

    return Response.json({ ok: true, score, total, percentage });
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        { error: "You have already submitted this exam. Only one attempt is allowed." },
        { status: 409 }
      );
    }
    return Response.json(
      { error: error?.message || "Failed to submit quiz" },
      { status: 500 }
    );
  }
}
