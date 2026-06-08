import { ensureQuizTable, query } from "@/lib/db";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, email, setId, setTitle, answers } = body;

    if (!name || !String(name).trim()) {
      return Response.json({ error: "Name is required" }, { status: 400 });
    }

    if (!email || !EMAIL_REGEX.test(String(email).trim())) {
      return Response.json({ error: "Valid email is required" }, { status: 400 });
    }

    if (!setId || !setTitle || !answers || typeof answers !== "object") {
      return Response.json({ error: "Invalid submission payload" }, { status: 400 });
    }

    await ensureQuizTable();

    const normalizedEmail = String(email).trim().toLowerCase();

    const existing = await query(
      `SELECT id FROM quiz_results WHERE email = $1 LIMIT 1`,
      [normalizedEmail]
    );

    if (existing.rows.length > 0) {
      return Response.json(
        { error: "You have already submitted this exam. Only one submission is allowed per email." },
        { status: 409 }
      );
    }

    await query(
      `INSERT INTO quiz_results (name, email, set_id, set_title, answers)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [
        String(name).trim(),
        normalizedEmail,
        setId,
        setTitle,
        JSON.stringify(answers),
      ]
    );

    return Response.json({ ok: true });
  } catch (error) {
    if (error?.code === "23505") {
      return Response.json(
        { error: "You have already submitted this exam. Only one submission is allowed per email." },
        { status: 409 }
      );
    }

    return Response.json(
      { error: error?.message || "Failed to save quiz result" },
      { status: 500 }
    );
  }
}
