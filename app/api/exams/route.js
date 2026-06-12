import { ensureSchema, query } from "@/lib/db";
const EXAM_LIST_ORDER_SQL = `
  CASE id
    WHEN 'wexam-a' THEN 0
    WHEN 'wexam-b' THEN 1
    WHEN 'wexam-c' THEN 2
    ELSE 3
  END,
  created_at DESC
`;

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// GET /api/exams — list all exams (public: active only, admin: all)
export async function GET(request) {
  try {
    await ensureSchema();
    const isAdmin = isAuthorized(request);

    const { rows: exams } = await query(
      isAdmin
        ? `SELECT * FROM exams ORDER BY ${EXAM_LIST_ORDER_SQL}`
        : `SELECT id, title, description, duration, color, show_results, allow_multiple_attempts
           FROM exams WHERE is_active = true ORDER BY ${EXAM_LIST_ORDER_SQL}`
    );

    // Attach question count
    for (const exam of exams) {
      const { rows } = await query(
        `SELECT COUNT(*)::int as count FROM questions WHERE exam_id = $1`,
        [exam.id]
      );
      exam.question_count = rows[0]?.count || 0;
    }

    return Response.json({ exams });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to fetch exams" }, { status: 500 });
  }
}

// POST /api/exams — create a new exam (admin only)
export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const body = await request.json();
    const { title, description, duration, color, show_results, allow_multiple_attempts } = body;

    if (!title?.trim()) {
      return Response.json({ error: "Exam title is required" }, { status: 400 });
    }

    const id = `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    await query(
      `INSERT INTO exams (id, title, description, duration, color, show_results, allow_multiple_attempts)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        id,
        title.trim(),
        description?.trim() || "",
        duration?.trim() || "30 min",
        color || "#6366f1",
        show_results ?? false,
        allow_multiple_attempts ?? false,
      ]
    );

    return Response.json({ id, ok: true });
  } catch (error) {
    return Response.json({ error: error?.message || "Failed to create exam" }, { status: 500 });
  }
}
