/**
 * Update Assessment Week 2 marks in quiz_results.
 * Matches learner names case-insensitively with title/punctuation normalization.
 */
import { readFileSync } from "fs";
import { createPool } from "@vercel/postgres";

const MAX_MARKS = 20;

const MARKS_DATA = [
  { name: "Arathi Vemareddy", set: "A", marks: 19 },
  { name: "Avinash Gadhave", set: "B", marks: 16 },
  { name: "Girish Kadu", set: "C", marks: 19 },
  { name: "Harishankar Pariyarath", set: "A", marks: 19 },
  { name: "Hema Pabbti", set: "C", marks: 19 },
  { name: "Lavanam Prodduturi", set: "A", marks: 13 },
  { name: "Mahesh Ashok Kudale", set: "C", marks: 19 },
  { name: "Mr. Jyotish Shekhar", set: "A", marks: 17 },
  { name: "Mr. Previn Kumar S", set: "B", marks: 18 },
  { name: "Mr. Thiyagarajan Kesavan", set: "C", marks: 17 },
  { name: "Ms. B Jayanthi", set: "A", marks: 19 },
  { name: "Ms. Dipti Deepak Gandhi", set: "B", marks: 16 },
  { name: "Ms. Jennifer Martin Sayyed", set: "C", marks: 18 },
  { name: "Ms. Snehal Goraksha Wabale", set: "A", marks: 19 },
  { name: "Ms. Subhalakshmi Senthilkumar", set: "B", marks: 19 },
  { name: "Nagarajan Venkataramanan", set: "C", marks: 15 },
  { name: "Pavan Tupkari", set: "A", marks: 19 },
  { name: "Rahul", set: "B", marks: 15 },
  { name: "Rajadurai Madasamy", set: "C", marks: 19 },
  { name: "Reshma Mangalwedhekar", set: "A", marks: 16 },
  { name: "Sarika Kale", set: "B", marks: 19 },
  { name: "Satya Yagana", set: "C", marks: 18 },
  { name: "Shailja Awasthi", set: "A", marks: 19 },
  { name: "Shweta Saxena", set: "B", marks: 15 },
  { name: "Siva Kishore", set: "C", marks: 16 },
  { name: "Veeramanikandan R", set: "A", marks: 16 },
  { name: "Venkatesh. R", set: "B", marks: 18 },
  { name: "Vikas Sharma", set: "C", marks: 17 },
];

// Known spelling differences between sheet and DB registration names
const NAME_ALIASES = {
  "harishankar pariyarath": "harisankar pariyarath",
  "hema pabbti": "hema pabbathi",
};

function loadEnv() {
  try {
    const raw = readFileSync(".env.local", "utf8");
    for (const line of raw.split("\n")) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?/i);
      if (m) process.env[m[1]] = m[2];
    }
  } catch {
    /* use existing env */
  }
}

/** Lowercase, strip titles, collapse whitespace, remove periods */
export function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/^(mr\.?|ms\.?|mrs\.?)\s+/i, "")
    .replace(/\./g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function words(name) {
  return normalizeName(name).split(" ").filter(Boolean);
}

/** Case-insensitive exact match, with token-subset fallback for partial DB names */
export function namesMatch(dbName, sheetName) {
  let a = normalizeName(dbName);
  let b = normalizeName(sheetName);
  a = NAME_ALIASES[a] || a;
  b = NAME_ALIASES[b] || b;

  if (a === b) return true;

  const aWords = words(a);
  const bWords = words(b);
  const [shorter, longer] =
    aWords.length <= bWords.length ? [aWords, bWords] : [bWords, aWords];

  if (shorter.length === 0) return false;

  return shorter.every((sw) =>
    longer.some((lw) => lw === sw || lw.startsWith(sw) || sw.startsWith(lw))
  );
}

function setToExamId(set) {
  return `wexam-${set.toLowerCase()}`;
}

async function main() {
  loadEnv();
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL;
  if (!connectionString) {
    throw new Error("POSTGRES_URL not configured");
  }

  const pool = createPool({ connectionString });

  try {
    const { rows } = await pool.query(
      `SELECT id, name, exam_id, score, total FROM quiz_results ORDER BY id`
    );

    const updated = [];
    const skipped = [];
    const unmatchedSheet = [];
    const matchedDbIds = new Set();

    for (const entry of MARKS_DATA) {
      const match = rows.find(
        (r) =>
          !matchedDbIds.has(r.id) &&
          namesMatch(r.name, entry.name) &&
          r.exam_id === setToExamId(entry.set)
      );

      if (!match) {
        // Retry without set constraint (DB set may differ from sheet)
        const loose = rows.find(
          (r) => !matchedDbIds.has(r.id) && namesMatch(r.name, entry.name)
        );
        if (!loose) {
          unmatchedSheet.push(entry);
          continue;
        }
        if (loose.score > 0 && loose.total > 0) {
          skipped.push({
            name: entry.name,
            dbName: loose.name,
            reason: `already has score ${loose.score}/${loose.total}`,
          });
          matchedDbIds.add(loose.id);
          continue;
        }
        await pool.query(
          `UPDATE quiz_results
           SET score = $1, total = $2, percentage = ROUND(($1::numeric / $2) * 100, 2)
           WHERE id = $3`,
          [entry.marks, MAX_MARKS, loose.id]
        );
        updated.push({
          sheet: entry.name,
          db: loose.name,
          set: entry.set,
          marks: entry.marks,
          id: loose.id,
          note: loose.exam_id !== setToExamId(entry.set) ? "set mismatch" : null,
        });
        matchedDbIds.add(loose.id);
        continue;
      }

      if (match.score > 0 && match.total > 0) {
        skipped.push({
          name: entry.name,
          dbName: match.name,
          reason: `already has score ${match.score}/${match.total}`,
        });
        matchedDbIds.add(match.id);
        continue;
      }

      await pool.query(
        `UPDATE quiz_results
         SET score = $1, total = $2, percentage = ROUND(($1::numeric / $2) * 100, 2)
         WHERE id = $3`,
        [entry.marks, MAX_MARKS, match.id]
      );
      updated.push({
        sheet: entry.name,
        db: match.name,
        set: entry.set,
        marks: entry.marks,
        id: match.id,
      });
      matchedDbIds.add(match.id);
    }

    const unmatchedDb = rows.filter(
      (r) => !matchedDbIds.has(r.id) && (r.score === 0 || r.total === 0)
    );

    console.log(JSON.stringify({ updated, skipped, unmatchedSheet, unmatchedDb }, null, 2));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
