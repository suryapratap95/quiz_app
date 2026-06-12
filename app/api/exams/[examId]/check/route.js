import { ensureSchema, query } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/exams/:examId/check — check if email already submitted for this exam
export async function POST(request, { params }) {
  try {
    await ensureSchema();
    const { examId } = await params;
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    const { rows } = await query(
      `SELECT exam_title, created_at as "submittedAt"
       FROM quiz_results WHERE email = $1 AND exam_id = $2 LIMIT 1`,
      [email, examId]
    );

    if (rows.length === 0) {
      return Response.json({ submitted: false });
    }

    return Response.json({
      submitted: true,
      examTitle: rows[0].exam_title,
      submittedAt: rows[0].submittedAt,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to check submission" },
      { status: 500 }
    );
  }
}
