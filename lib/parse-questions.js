/**
 * Parse questions from extracted text (PDF / DOCX).
 *
 * Strategy:
 *  1. Split question body from trailing answer-key section (if present)
 *  2. Structured parse for numbered MCQs with A–D options
 *  3. Apply answer key by question number
 *  4. Fall back to OpenAI when structured parse yields 0, or answers are still missing
 */

const ANS_PATTERN =
  /(?:Answer|Correct|Ans|Key)\s*[:=]\s*[(\[]?\s*([A-Da-d])\s*[)\]]?/i;

const ANSWER_KEY_HEADER =
  /(?:^|\n)\s*(?:answer\s*key|answers(?:\s*key)?|answer\s*sheet|correct\s*answers|solution\s*key|marking\s*scheme|answer\s*guide)\s*[:\-]?\s*(?:\n|$)/i;

function letterToIndex(letter) {
  return letter.toUpperCase().charCodeAt(0) - 65;
}

/** Keep head + tail so a trailing answer key survives truncation for AI. */
function truncateForAI(text, maxLen = 20000) {
  if (text.length <= maxLen) return text;
  const headLen = Math.floor(maxLen * 0.6);
  const tailLen = maxLen - headLen - 40;
  return (
    text.substring(0, headLen) +
    "\n\n...[middle truncated]...\n\n" +
    text.substring(text.length - tailLen)
  );
}

/** Split questions body from a trailing answer-key block. */
export function splitTextIntoBodyAndAnswerKey(text) {
  const headerSplit = text.split(ANSWER_KEY_HEADER);
  if (headerSplit.length >= 2) {
    return {
      body: headerSplit[0].trim(),
      answerKey: headerSplit.slice(1).join("\n").trim(),
    };
  }

  const lines = text.split("\n");
  const isAnswerLine = (line) => {
    const trimmed = line.trim();
    if (!trimmed) return false;
    return (
      /^(?:Q\.?\s*)?\d+\s*[.)::\-]\s*[(\[]?\s*[A-Da-d]\s*[)\]]?\s*$/i.test(
        trimmed
      ) ||
      /^(?:Q\.?\s*)?\d+\s*[.)::\-]\s*[A-Da-d]\s*$/i.test(trimmed)
    );
  };

  let keyStart = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (!line) {
      if (keyStart !== -1) break;
      continue;
    }
    if (isAnswerLine(line)) {
      keyStart = i;
    } else if (keyStart !== -1) {
      break;
    }
  }

  if (keyStart > 0) {
    const keyLines = lines.slice(keyStart).filter((l) => l.trim());
    const answerLikeCount = keyLines.filter((l) => isAnswerLine(l)).length;
    if (answerLikeCount >= 2 && answerLikeCount === keyLines.length) {
      return {
        body: lines.slice(0, keyStart).join("\n").trim(),
        answerKey: keyLines.join("\n").trim(),
      };
    }
  }

  return { body: text, answerKey: "" };
}

/** Parse `1. A`, `Q2: B`, `3) C`, `1-A, 2-B` style answer keys. */
export function parseAnswerKey(keyText) {
  const map = new Map();
  if (!keyText?.trim()) return map;

  const linePattern =
    /^\s*(?:Q\.?\s*)?(\d+)\s*[.)::\-]\s*[(\[]?\s*([A-Da-d])\s*[)\]]?\s*$/gim;
  for (const match of keyText.matchAll(linePattern)) {
    const num = parseInt(match[1], 10);
    const letter = match[2].toUpperCase();
    if (num > 0) map.set(num, letter);
  }

  const inlinePattern =
    /(?:^|[\n,;|])\s*(?:Q\.?\s*)?(\d+)\s*[-.)]\s*([A-Da-d])\b/gi;
  for (const match of keyText.matchAll(inlinePattern)) {
    const num = parseInt(match[1], 10);
    const letter = match[2].toUpperCase();
    if (num > 0 && !map.has(num)) map.set(num, letter);
  }

  return map;
}

export function applyAnswerKeyToQuestions(questions, keyMap) {
  if (!keyMap?.size) return questions;

  return questions.map((q, idx) => {
    const num = q._qNum ?? idx + 1;
    const letter = keyMap.get(num);
    if (!letter) return q;

    const answerIndex = letterToIndex(letter);
    return {
      ...q,
      correct_answer: Math.min(
        Math.max(0, answerIndex),
        Math.max(0, q.options.length - 1)
      ),
      _hasAnswer: true,
    };
  });
}

function stripInternal(q) {
  const { _qNum, _hasAnswer, ...rest } = q;
  return rest;
}

function countUnresolvedAnswers(questions) {
  return questions.filter((q) => !q._hasAnswer).length;
}

// ── Structured parser ──────────────────────────────────────
export function parseStructured(text) {
  const qMatches = [...text.matchAll(/(?:^|\n)\s*(?:Q\.?\s*)?(\d+)[.)]\s*/g)];

  if (qMatches.length <= 1) {
    return parseLineByLine(text);
  }

  const questions = [];

  for (let i = 0; i < qMatches.length; i++) {
    const qNum = parseInt(qMatches[i][1], 10);
    const blockStart = qMatches[i].index + qMatches[i][0].length;
    const blockEnd =
      i < qMatches.length - 1 ? qMatches[i + 1].index : text.length;
    const block = text.substring(blockStart, blockEnd);

    const firstOpt = block.match(/\n\s*[(\[]?\s*[Aa]\s*[)\].:\-]/);
    if (!firstOpt) continue;

    const questionText = block.substring(0, firstOpt.index).trim();
    const optionsBlock = block.substring(firstOpt.index);

    const opts = [];
    const optMatches = [
      ...optionsBlock.matchAll(
        /[(\[]?\s*([A-Da-d])\s*[)\].:\-]\s*(.+?)(?=\n\s*[(\[]?\s*[A-Da-d]\s*[)\].:\-]|\n\s*(?:Answer|Correct|Ans|Key)\s*[:=]|$)/gs
      ),
    ];

    for (const m of optMatches) {
      opts.push(m[2].trim());
    }

    if (opts.length < 2) continue;

    const ansMatch =
      optionsBlock.match(ANS_PATTERN) || block.match(ANS_PATTERN);
    const correctAnswer = ansMatch ? letterToIndex(ansMatch[1]) : 0;

    questions.push({
      id: `q-${Date.now()}-${i}`,
      question_text: questionText,
      options: opts,
      correct_answer: Math.min(correctAnswer, opts.length - 1),
      topic: "General",
      _qNum: qNum,
      _hasAnswer: !!ansMatch,
    });
  }

  return questions;
}

function parseLineByLine(text) {
  const questions = [];
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  let current = null;

  for (const line of lines) {
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
        _qNum: parseInt(qMatch[1], 10),
        _hasAnswer: false,
      };
      continue;
    }

    const optMatch = line.match(/^[(\[]?\s*([A-Da-d])\s*[)\].:\-]\s*(.+)/);
    if (optMatch && current) {
      current.options.push(optMatch[2].trim());
      continue;
    }

    const ansMatch = line.match(ANS_PATTERN);
    if (ansMatch && current) {
      current.correct_answer = Math.min(
        letterToIndex(ansMatch[1]),
        Math.max(0, current.options.length - 1)
      );
      current._hasAnswer = true;
      continue;
    }

    if (current && current.options.length === 0) {
      current.question_text += " " + line;
    }
  }

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

  const truncated = truncateForAI(text);

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
correct_answer is the 0-based index of the correct option (A=0, B=1, C=2, D=3).
The answer key may appear AFTER all questions in a separate section (e.g. "Answer Key", "Answers") — match each numbered answer to the corresponding question.
Do not include the answer-key section itself as a question.`,
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

// ── Main parser ──────────────────────────────────────────
export async function parseQuestions(text) {
  const { body, answerKey } = splitTextIntoBodyAndAnswerKey(text);
  const keyMap = parseAnswerKey(answerKey);

  let questions = parseStructured(body);
  if (questions.length === 0 && body !== text) {
    questions = parseStructured(text);
  }

  let method = "structured";

  if (questions.length > 0 && keyMap.size > 0) {
    questions = applyAnswerKeyToQuestions(questions, keyMap);
    method = "structured+answer_key";
  }

  const unresolved = countUnresolvedAnswers(questions);
  const needsAi =
    questions.length === 0 ||
    (keyMap.size === 0 && unresolved === questions.length) ||
    (keyMap.size > 0 && unresolved > questions.length * 0.4);

  if (needsAi && process.env.OPENAI_API_KEY) {
    try {
      const aiParsed = await parseWithAI(text);
      if (aiParsed.length > 0) {
        if (questions.length === 0 || unresolved > aiParsed.length * 0.3) {
          return { questions: aiParsed, method: "ai" };
        }
      }
    } catch (err) {
      console.error("AI parsing failed:", err.message);
    }
  }

  if (questions.length > 0) {
    return {
      questions: questions.map(stripInternal),
      method,
    };
  }

  return { questions: [], method: "none" };
}
