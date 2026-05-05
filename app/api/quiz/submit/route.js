import { ensureQuizTable, sql } from "@/lib/db";

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

    await sql`
      INSERT INTO quiz_results (name, email, set_id, set_title, answers)
      VALUES (${String(name).trim()}, ${String(email).trim().toLowerCase()}, ${setId}, ${setTitle}, ${JSON.stringify(answers)}::jsonb)
    `;

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to save quiz result" },
      { status: 500 }
    );
  }
}
