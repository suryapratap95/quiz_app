import { ensureSchema, query } from "@/lib/db";
import { WEXAM_RESULTS_ORDER_SQL } from "@/lib/wexam-groups";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// GET /api/results — get all results across all exams (admin only)
export async function GET(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();

    const { rows } = await query(
      `SELECT qr.id, qr.name, qr.email, qr.exam_id, qr.exam_title,
              qr.score, qr.total, qr.percentage, qr.created_at as timestamp,
              e.color as exam_color, e.parent_exam_id, e.set_label
       FROM quiz_results qr
       LEFT JOIN exams e ON e.id = qr.exam_id
       ORDER BY ${WEXAM_RESULTS_ORDER_SQL}, qr.created_at DESC`
    );

    // Also return exams list for grouping
    const { rows: exams } = await query(
      `SELECT id, title, color, parent_exam_id, set_label FROM exams`
    );

    return Response.json({ results: rows, exams });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to fetch results" }, { status: 500 });
  }
}
