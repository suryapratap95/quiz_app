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

// ── Dynamic exam group helpers ──────────────────────────────────────

/** Check if an exam belongs to a dynamic group (has parent_exam_id). */
export function isDynamicGroupSet(exam) {
  return !!exam?.parent_exam_id;
}

/** Get set label for a dynamic group exam. */
export function getDynamicSetLabel(exam) {
  return exam?.set_label || null;
}

/**
 * Group results by their parent exam group.
 * Returns { groups: [{ groupId, groupTitle, setGroups: [{ setId, label, results }] }] }
 */
export function groupResultsByExam(results = [], exams = []) {
  // Build a lookup: examId → exam info
  const examMap = new Map();
  for (const e of exams) {
    examMap.set(e.id, e);
  }

  // Group results by parent_exam_id or exam_id
  const groupMap = new Map(); // groupKey → { title, color, sets: Map<setId, {label, results}> }

  for (const r of results) {
    const exam = examMap.get(r.exam_id);
    const parentId = exam?.parent_exam_id;

    if (parentId) {
      // Dynamic set group
      if (!groupMap.has(parentId)) {
        // Find group title from any sibling
        const siblings = exams.filter((e) => e.parent_exam_id === parentId);
        const baseTitle = siblings[0]?.title?.replace(/\s*—\s*Set\s+[A-C]$/i, "") || "Exam Group";
        groupMap.set(parentId, {
          title: baseTitle,
          color: siblings[0]?.color || "#6366f1",
          isGroup: true,
          sets: new Map(),
        });
      }
      const group = groupMap.get(parentId);
      const setLabel = exam.set_label || "Unknown Set";
      if (!group.sets.has(r.exam_id)) {
        group.sets.set(r.exam_id, { label: setLabel, results: [] });
      }
      group.sets.get(r.exam_id).results.push(r);
    } else if (isWexamSetId(r.exam_id)) {
      // Legacy wexam group
      const wexamKey = WEXAM_GROUP_ID;
      if (!groupMap.has(wexamKey)) {
        groupMap.set(wexamKey, {
          title: "WExam Assessment",
          color: "#0891B2",
          isGroup: true,
          sets: new Map(),
        });
      }
      const group = groupMap.get(wexamKey);
      const setLabel = getWexamSetLabel(r.exam_id) || "Unknown Set";
      if (!group.sets.has(r.exam_id)) {
        group.sets.set(r.exam_id, { label: setLabel, results: [] });
      }
      group.sets.get(r.exam_id).results.push(r);
    } else {
      // Standalone exam
      const examKey = r.exam_id;
      if (!groupMap.has(examKey)) {
        groupMap.set(examKey, {
          title: r.exam_title || exam?.title || "Unknown Exam",
          color: exam?.color || r.exam_color || "#6366f1",
          isGroup: false,
          sets: new Map(),
        });
      }
      const group = groupMap.get(examKey);
      if (!group.sets.has(r.exam_id)) {
        group.sets.set(r.exam_id, { label: null, results: [] });
      }
      group.sets.get(r.exam_id).results.push(r);
    }
  }

  // Convert to array
  const groups = [];
  for (const [groupId, group] of groupMap) {
    const setGroups = [];
    for (const [setId, setData] of group.sets) {
      setData.results.sort((a, b) =>
        (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" })
      );
      setGroups.push({ setId, label: setData.label, results: setData.results });
    }
    // Sort sets by label
    setGroups.sort((a, b) => (a.label || "").localeCompare(b.label || ""));

    groups.push({
      groupId,
      title: group.title,
      color: group.color,
      isGroup: group.isGroup,
      setGroups,
      totalResults: setGroups.reduce((sum, s) => sum + s.results.length, 0),
    });
  }

  return groups;
}

/** Collapse wexam-a/b/c AND dynamic set groups into grouped items for list UIs. */
export function groupExamsForDisplay(exams = []) {
  const wexamSets = exams
    .filter((e) => isWexamSetId(e.id))
    .sort((a, b) => getWexamSetOrder(a.id) - getWexamSetOrder(b.id));

  // Dynamic groups: exams with parent_exam_id
  const dynamicGroupMap = new Map();
  const dynamicSetExams = new Set();

  for (const exam of exams) {
    if (exam.parent_exam_id && !isWexamSetId(exam.id)) {
      dynamicSetExams.add(exam.id);
      if (!dynamicGroupMap.has(exam.parent_exam_id)) {
        dynamicGroupMap.set(exam.parent_exam_id, []);
      }
      dynamicGroupMap.get(exam.parent_exam_id).push(exam);
    }
  }

  const otherExams = exams.filter(
    (e) => !isWexamSetId(e.id) && !dynamicSetExams.has(e.id)
  );

  const display = [];

  // Legacy wexam group
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
      groupId: WEXAM_GROUP_ID,
    });
  }

  // Dynamic set groups
  for (const [groupId, sets] of dynamicGroupMap) {
    sets.sort((a, b) => (a.set_label || "").localeCompare(b.set_label || ""));
    const baseTitle = sets[0]?.title?.replace(/\s*—\s*Set\s+[A-C]$/i, "") || "Exam Group";
    const setLabels = sets.map((s) => s.set_label || "?").join(", ");

    display.push({
      type: "group",
      id: groupId,
      title: baseTitle,
      description: `Sets: ${setLabels}`,
      duration: sets[0]?.duration || "30 min",
      color: sets[0]?.color || "#6366f1",
      is_active: sets.some((e) => e.is_active),
      question_count: sets.reduce(
        (sum, e) => sum + (e.question_count || 0),
        0
      ),
      sets,
      groupId,
      isDynamic: true,
    });
  }

  for (const exam of otherExams) {
    display.push({ type: "exam", ...exam });
  }

  return display;
}
