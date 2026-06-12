/**
 * Parse questions from extracted text (PDF / DOCX).
 *
 * Strategy:
 *  1. Try structured parsing first (expects numbered Q, A-D options, answer line)
 *  2. Fall back to AI (OpenAI) if OPENAI_API_KEY is set and structured parse yields 0
 */

// ── Structured parser ──────────────────────────────────────
// Supports formats like:
//   Q1. / 1. / 1) — question text
//   A) / a) / A. / (A) — option text
//   Answer: A / Correct: B / Ans: C
const Q_PATTERN = /(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*(.+?)(?=\n\s*(?:[Aa][.)]\s|[(\[]?[Aa][)\]]\s))/gs;
const OPT_PATTERN = /(?:^|\n)\s*[(\[]?\s*([A-Da-d])\s*[)\].:\-]\s*(.+?)(?=\n\s*[(\[]?\s*[A-Da-d]\s*[)\].:\-]|$)/gs;
const ANS_PATTERN = /(?:Answer|Correct|Ans|Key)\s*[:=]\s*[(\[]?\s*([A-Da-d])\s*[)\]]?/i;

function letterToIndex(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
}

export function parseStructured(text) {
  const questions = [];
  const blocks = text.split(/\n\s*(?:Q\.?\s*)?\d+[.)]/);

  // If we can't split meaningfully, try line-by-line
  if (blocks.length <= 1) {
    return parseLineByLine(text);
  }

  // Get the question numbers
  const qMatches = [...text.matchAll(/(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*/g)];

  for (let i = 0; i < qMatches.length; i++) {
    const blockStart = qMatches[i].index + qMatches[i][0].length;
    const blockEnd = i < qMatches.length - 1 ? qMatches[i + 1].index : text.length;
    const block = text.substring(blockStart, blockEnd);

    // Extract question text (everything before first option)
    const firstOpt = block.match(/\n\s*[(\[]?\s*[Aa]\s*[)\].:\-]/);
    if (!firstOpt) continue;

    const questionText = block.substring(0, firstOpt.index).trim();
    const optionsBlock = block.substring(firstOpt.index);

    // Extract options
    const opts = [];
    const optMatches = [...optionsBlock.matchAll(/[(\[]?\s*([A-Da-d])\s*[)\].:\-]\s*(.+?)(?=\n\s*[(\[]?\s*[A-Da-d]\s*[)\].:\-]|\n\s*(?:Answer|Correct|Ans|Key)\s*[:=]|$)/gs)];

    for (const m of optMatches) {
      opts.push(m[2].trim());
    }

    if (opts.length < 2) continue;

    // Extract correct answer
    const ansMatch = optionsBlock.match(ANS_PATTERN) || block.match(ANS_PATTERN);
    const correctAnswer = ansMatch ? letterToIndex(ansMatch[1]) : 0;

    questions.push({
      id: `q-${Date.now()}-${i}`,
      question_text: questionText,
      options: opts,
      correct_answer: Math.min(correctAnswer, opts.length - 1),
      topic: "General",
    });
  }

  return questions;
}

function parseLineByLine(text) {
  const questions = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  let current = null;

  for (const line of lines) {
    // New question
    const qMatch = line.match(/^(?:Q\.?\s*)?(\d+)[.)]\s*(.+)/);
    if (qMatch) {
      if (current && current.options.length >= 2) {
        questions.push(current);
      }
      current = {
        id: `q-${Date.now()}-${questions.length}`,
        question_text: qMatch[2].trim(),
        options: [],
        correct_answer: 0,
        topic: "General",
      };
      continue;
    }

    // Option line
    const optMatch = line.match(/^[(\[]?\s*([A-Da-d])\s*[)\].:\-]\s*(.+)/);
    if (optMatch && current) {
      current.options.push(optMatch[2].trim());
      continue;
    }

    // Answer line
    const ansMatch = line.match(ANS_PATTERN);
    if (ansMatch && current) {
      current.correct_answer = Math.min(
        letterToIndex(ansMatch[1]),
        Math.max(0, current.options.length - 1)
      );
      continue;
    }

    // Continuation of question text
    if (current && current.options.length === 0) {
      current.question_text += " " + line;
    }
  }

  // Push last question
  if (current && current.options.length >= 2) {
    questions.push(current);
  }

  return questions;
}

// ── AI-powered parser (OpenAI fallback) ──────────────────
export async function parseWithAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY not configured for AI parsing fallback");
  }

  const truncated = text.substring(0, 15000); // limit tokens

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are a question paper parser. Extract all MCQ questions from the text. Return JSON:
{
  "questions": [
    {
      "question_text": "...",
      "options": ["A option", "B option", "C option", "D option"],
      "correct_answer": 0,
      "topic": "General"
    }
  ]
}
correct_answer is the 0-based index of the correct option. If you can't determine the correct answer, use 0. The topic should be inferred from the question content if possible.`,
        },
        {
          role: "user",
          content: `Extract all MCQ questions from this text:\n\n${truncated}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error: ${err}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return (parsed.questions || []).map((q, i) => ({
    id: `q-${Date.now()}-${i}`,
    question_text: q.question_text,
    options: q.options,
    correct_answer: q.correct_answer ?? 0,
    topic: q.topic || "General",
  }));
}

// ── Main parser (try structured, fallback to AI) ─────────
export async function parseQuestions(text) {
  // Try structured parsing first
  const structured = parseStructured(text);
  if (structured.length > 0) {
    return { questions: structured, method: "structured" };
  }

  // Fallback to AI if available
  if (process.env.OPENAI_API_KEY) {
    try {
      const aiParsed = await parseWithAI(text);
      if (aiParsed.length > 0) {
        return { questions: aiParsed, method: "ai" };
      }
    } catch (err) {
      console.error("AI parsing failed:", err.message);
    }
  }

  return { questions: [], method: "none" };
}
