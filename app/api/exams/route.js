import { ensureSchema, query } from "@/lib/db";
const EXAM_LIST_ORDER_SQL = `
  CASE id
    WHEN 'nexam-a' THEN 0
    WHEN 'nexam-b' THEN 1
    WHEN 'nexam-c' THEN 2
    WHEN 'wexam-a' THEN 3
    WHEN 'wexam-b' THEN 4
    WHEN 'wexam-c' THEN 5
    ELSE 6
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
        : `SELECT id, title, description, duration, color, is_active, show_results, allow_multiple_attempts, parent_exam_id, set_label
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
    const { title, description, duration, color, show_results, allow_multiple_attempts, create_sets, set_mode } = body;

    if (!title?.trim()) {
      return Response.json({ error: "Exam title is required" }, { status: 400 });
    }

    // If create_sets is true, create 3 sets (A, B, C) as a group
    if (create_sets) {
      const groupId = `examgrp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const setLabels = ["Set A", "Set B", "Set C"];
      const setColors = [color || "#0891B2", "#4F46E5", "#0D9488"];
      const setIds = [];

      for (let i = 0; i < 3; i++) {
        const setId = `${groupId}-${String.fromCharCode(97 + i)}`;
        await query(
          `INSERT INTO exams (id, title, description, duration, color, show_results, allow_multiple_attempts, parent_exam_id, set_label)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            setId,
            `${title.trim()} — ${setLabels[i]}`,
            description?.trim() || "",
            duration?.trim() || "30 min",
            setColors[i],
            show_results ?? false,
            allow_multiple_attempts ?? false,
            groupId,
            setLabels[i],
          ]
        );
        setIds.push(setId);
      }

      return Response.json({ groupId, setIds, ok: true, sets: true });
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
