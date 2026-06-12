import { ensureSchema, query } from "@/lib/db";
import {
  isWexamGroupId,
  WEXAM_RESULTS_ORDER_SQL,
  WEXAM_SET_IDS,
} from "@/lib/wexam-groups";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// GET /api/exams/:examId/results — get all submissions for an exam (admin only)
export async function GET(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;

    const { rows } = isWexamGroupId(examId)
      ? (
          await query(
            `SELECT id, name, email, exam_id, exam_title, answers, score, total, percentage, created_at as timestamp
             FROM quiz_results
             WHERE exam_id = ANY($1::text[])
             ORDER BY ${WEXAM_RESULTS_ORDER_SQL}`,
            [WEXAM_SET_IDS]
          )
        )
      : await query(
          `SELECT id, name, email, exam_id, exam_title, answers, score, total, percentage, created_at as timestamp
           FROM quiz_results
           WHERE exam_id = $1
           ORDER BY LOWER(name) ASC`,
          [examId]
        );

    return Response.json({ results: rows });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to fetch results" }, { status: 500 });
  }
}

// DELETE /api/exams/:examId/results — clear all submissions for an exam (admin only)
export async function DELETE(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params;

    await query(`DELETE FROM quiz_results WHERE exam_id = $1`, [examId]);

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to clear results" }, { status: 500 });
  }
}
