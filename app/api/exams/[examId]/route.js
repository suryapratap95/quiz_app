import { ensureSchema, query } from "@/lib/db";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// GET /api/exams/:examId — get exam with questions
export async function GET(request, { params }) {
  try {
    await ensureSchema();
    const { examId } = await params;

    const { rows: exams } = await query(
      `SELECT * FROM exams WHERE id = $1`,
      [examId]
    );

    if (exams.length === 0) {
      return Response.json({ error: "Exam not found" }, { status: 404 });
    }

    const exam = exams[0];
    const isAdmin = isAuthorized(request);

    // Fetch questions
    const { rows: questions } = await query(
      `SELECT id, question_text, options, ${isAdmin ? "correct_answer," : ""} topic, sort_order
       FROM questions WHERE exam_id = $1 ORDER BY sort_order ASC`,
      [examId]
    );

    return Response.json({ exam, questions });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to fetch exam" }, { status: 500 });
  }
}

// PUT /api/exams/:examId — update exam (admin only)
export async function PUT(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;
    const body = await request.json();
    const { title, description, duration, color, is_active, show_results, allow_multiple_attempts } = body;

    await query(
      `UPDATE exams SET
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        duration = COALESCE($3, duration),
        color = COALESCE($4, color),
        is_active = COALESCE($5, is_active),
        show_results = COALESCE($6, show_results),
        allow_multiple_attempts = COALESCE($7, allow_multiple_attempts),
        updated_at = NOW()
       WHERE id = $8`,
      [title, description, duration, color, is_active, show_results, allow_multiple_attempts, examId]
    );

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to update exam" }, { status: 500 });
  }
}

// DELETE /api/exams/:examId — delete exam and its questions (admin only)
// Also deletes all sibling sets if this is a group parent ID
export async function DELETE(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;

    // Check if this is a dynamic group ID (parent_exam_id)
    const { rows: groupSets } = await query(
      `SELECT id FROM exams WHERE parent_exam_id = $1`,
      [examId]
    );

    if (groupSets.length > 0) {
      // Delete all sets in the group
      for (const set of groupSets) {
        await query(`DELETE FROM quiz_results WHERE exam_id = $1`, [set.id]);
        await query(`DELETE FROM questions WHERE exam_id = $1`, [set.id]);
        await query(`DELETE FROM exams WHERE id = $1`, [set.id]);
      }
    } else {
      // Delete single exam
      await query(`DELETE FROM quiz_results WHERE exam_id = $1`, [examId]);
      await query(`DELETE FROM questions WHERE exam_id = $1`, [examId]);
      await query(`DELETE FROM exams WHERE id = $1`, [examId]);
    }

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to delete exam" }, { status: 500 });
  }
}
