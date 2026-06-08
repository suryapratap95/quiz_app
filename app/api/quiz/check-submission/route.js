import { ensureQuizTable, query } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "").trim().toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    await ensureQuizTable();

    const { rows } = await query(
      `SELECT set_title AS "setTitle", created_at AS "submittedAt"
       FROM quiz_results
       WHERE email = $1
       LIMIT 1`,
      [email]
    );

    if (rows.length === 0) {
      return Response.json({ submitted: false });
    }

    return Response.json({
      submitted: true,
      setTitle: rows[0].setTitle,
      submittedAt: rows[0].submittedAt,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to check submission status" },
      { status: 500 }
    );
  }
}
