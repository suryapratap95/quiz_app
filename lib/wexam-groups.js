/** WExam is one assessment with three sets (A, B, C) stored as separate exam rows. */

export const WEXAM_GROUP_ID = "wexam";
export const WEXAM_SET_IDS = ["wexam-a", "wexam-b", "wexam-c"];

const SET_ORDER = { "wexam-a": 0, "wexam-b": 1, "wexam-c": 2 };
const SET_LABELS = { "wexam-a": "Set A", "wexam-b": "Set B", "wexam-c": "Set C" };

export function isWexamSetId(examId) {
  return SET_ORDER[examId] !== undefined;
}

export function isWexamGroupId(examId) {
  return examId === WEXAM_GROUP_ID;
}

export function getWexamSetLabel(examId) {
  return SET_LABELS[examId] || null;
}

export function getWexamSetOrder(examId) {
  return SET_ORDER[examId] ?? 99;
}

/** SQL ORDER BY fragment: Set A → B → C, then name. */
export const WEXAM_RESULTS_ORDER_SQL = `
  CASE exam_id
    WHEN 'wexam-a' THEN 0
    WHEN 'wexam-b' THEN 1
    WHEN 'wexam-c' THEN 2
    ELSE 3
  END,
  LOWER(name) ASC
`;

export function sortResultsByWexamSet(results = []) {
  return [...results].sort((a, b) => {
    const setDiff = getWexamSetOrder(a.exam_id) - getWexamSetOrder(b.exam_id);
    if (setDiff !== 0) return setDiff;
    return (a.name || "").localeCompare(b.name || "", undefined, {
      sensitivity: "base",
    });
  });
}

export function groupResultsByWexamSet(results = []) {
  const sorted = sortResultsByWexamSet(results);
  const groups = WEXAM_SET_IDS.map((setId) => ({
    setId,
    label: SET_LABELS[setId],
    results: sorted.filter((r) => r.exam_id === setId),
  }));
  const other = sorted.filter((r) => !isWexamSetId(r.exam_id));
  return { groups, other };
}

/** Collapse wexam-a/b/c into one grouped item for list UIs. */
export function groupExamsForDisplay(exams = []) {
  const wexamSets = exams
    .filter((e) => isWexamSetId(e.id))
    .sort((a, b) => getWexamSetOrder(a.id) - getWexamSetOrder(b.id));

  const otherExams = exams.filter((e) => !isWexamSetId(e.id));
  const display = [];

  if (wexamSets.length > 0) {
    display.push({
      type: "group",
      id: WEXAM_GROUP_ID,
      title: "WExam Assessment",
      description: "Assessment Week 2 · Sets A, B, C",
      duration: wexamSets[0]?.duration || "~25 min",
      color: "#0891B2",
      is_active: wexamSets.some((e) => e.is_active),
      question_count: wexamSets.reduce(
        (sum, e) => sum + (e.question_count || 0),
        0
      ),
      sets: wexamSets,
    });
  }

  for (const exam of otherExams) {
    display.push({ type: "exam", ...exam });
  }

  return display;
}
