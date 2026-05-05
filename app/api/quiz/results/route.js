import { ensureQuizTable, sql } from "@/lib/db";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;

  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

export async function GET() {
  try {
    await ensureQuizTable();

    const { rows } = await sql`
      SELECT
        id,
        name,
        email,
        set_id AS "setId",
        set_title AS "setTitle",
        answers,
        created_at AS timestamp
      FROM quiz_results
      ORDER BY created_at DESC
    `;

    return Response.json({ results: rows });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to load quiz results" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureQuizTable();
    await sql`TRUNCATE TABLE quiz_results`;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to clear quiz results" },
      { status: 500 }
    );
  }
}
