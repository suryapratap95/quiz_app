import { ensureSchema, query } from "@/lib/db";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

/**
 * Seeded PRNG (mulberry32) for deterministic shuffling.
 */
function mulberry32(seed) {
  let t = seed >>> 0;
  return function () {
    t += 0x6d2b79f5;
    let x = t;
    x = Math.imul(x ^ (x >>> 15), x | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleWithSeed(array, seed) {
  const rand = mulberry32(seed);
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// POST /api/exams/:examId/shuffle-sets — shuffle questions from source exam into its sibling sets
// Body: { sourceExamId: string } — the set that has the questions to distribute
export async function POST(request, { params }) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await ensureSchema();
    const { examId } = await params; // examId is the groupId or one of the set IDs
    const body = await request.json();
    const { sourceExamId } = body;

    if (!sourceExamId) {
      return Response.json({ error: "sourceExamId is required" }, { status: 400 });
    }

    // Get source questions
    const { rows: sourceQuestions } = await query(
      `SELECT id, question_text, options, correct_answer, topic, sort_order
       FROM questions WHERE exam_id = $1 ORDER BY sort_order ASC`,
      [sourceExamId]
    );

    if (sourceQuestions.length === 0) {
      return Response.json(
        { error: "Source exam has no questions to shuffle" },
        { status: 400 }
      );
    }

    // Find all sibling sets (exams with same parent_exam_id)
    const { rows: sourceExam } = await query(
      `SELECT parent_exam_id FROM exams WHERE id = $1`,
      [sourceExamId]
    );

    if (sourceExam.length === 0 || !sourceExam[0].parent_exam_id) {
      return Response.json(
        { error: "Source exam is not part of a set group" },
        { status: 400 }
      );
    }

    const parentId = sourceExam[0].parent_exam_id;

    // Get all sibling sets
    const { rows: siblingExams } = await query(
      `SELECT id, set_label FROM exams WHERE parent_exam_id = $1 ORDER BY set_label ASC`,
      [parentId]
    );

    if (siblingExams.length < 2) {
      return Response.json(
        { error: "Need at least 2 sets to shuffle" },
        { status: 400 }
      );
    }

    const results = {};
    const baseSeed = Date.now();

    for (let setIdx = 0; setIdx < siblingExams.length; setIdx++) {
      const setExam = siblingExams[setIdx];

      // Skip the source — it already has its questions
      if (setExam.id === sourceExamId) {
        results[setExam.id] = { label: setExam.set_label, action: "kept", count: sourceQuestions.length };
        continue;
      }

      // Clear existing questions for this set
      await query(`DELETE FROM questions WHERE exam_id = $1`, [setExam.id]);

      // Shuffle questions with a different seed per set
      const seed = baseSeed + (setIdx + 1) * 1000;
      const shuffledQuestions = shuffleWithSeed(sourceQuestions, seed);

      // Also shuffle options within each question
      let inserted = 0;
      for (let qi = 0; qi < shuffledQuestions.length; qi++) {
        const q = shuffledQuestions[qi];
        const opts = typeof q.options === "string" ? JSON.parse(q.options) : q.options;

        // Shuffle option order
        const optionIndices = opts.map((_, i) => i);
        const shuffledOptionIndices = shuffleWithSeed(optionIndices, seed * 1000 + qi + 1);
        const newOpts = shuffledOptionIndices.map((i) => opts[i]);
        const newCorrectAnswer = shuffledOptionIndices.indexOf(q.correct_answer);

        const newId = `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

        await query(
          `INSERT INTO questions (id, exam_id, question_text, options, correct_answer, topic, sort_order)
           VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7)`,
          [
            newId,
            setExam.id,
            q.question_text,
            JSON.stringify(newOpts),
            newCorrectAnswer,
            q.topic || "General",
            qi,
          ]
        );
        inserted++;
      }

      results[setExam.id] = { label: setExam.set_label, action: "shuffled", count: inserted };
    }

    return Response.json({
      ok: true,
      message: `Shuffled ${sourceQuestions.length} questions across ${siblingExams.length} sets`,
      results,
    });
  } catch (error) {
    return Response.json(
      { error: error?.message || "Failed to shuffle questions" },
      { status: 500 }
    );
  }
}
