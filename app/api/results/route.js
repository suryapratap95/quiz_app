import { ensureSchema, query } from "@/lib/db";

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
              e.color as exam_color
       FROM quiz_results qr
       LEFT JOIN exams e ON e.id = qr.exam_id
       ORDER BY qr.created_at DESC`
    );

    return Response.json({ results: rows });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to fetch results" }, { status: 500 });
  }
}
