import { ensureNoAdjacentSameTopic, buildSetQuestions } from "@/lib/quiz-utils";
import { WEXAM_POOL } from "@/data/wexam-questions";
import { NEXAM_POOL } from "@/data/nexam-questions";

const WEXAM_BASE = ensureNoAdjacentSameTopic(WEXAM_POOL);
const NEXAM_BASE = ensureNoAdjacentSameTopic(NEXAM_POOL);

const EXAMS = [
  {
    id: "nexam",
    label: "Mid Session Exam Assessment",
    subtitle: "Embeddings, LangChain & AI Agents · Sets A, B, C",
    sets: [
      {
        id: "nexam-a",
        examId: "nexam",
        title: "Set A",
        desc: "Word2Vec, BERT, FAISS, LangChain Foundations, Agents & Tools",
        questions: buildSetQuestions(NEXAM_BASE, 301),
        color: "#7C3AED",
        duration: "~25 min",
        theme: {
          headerBg: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
          headerBorder: "#c4b5fd",
          questionBg: "#faf9ff",
          optionSelectedBg: "#ede9fe",
          optionSelectedText: "#2e1065",
          nextButtonBg: "#7C3AED",
        },
      },
      {
        id: "nexam-b",
        examId: "nexam",
        title: "Set B",
        desc: "Word2Vec, BERT, FAISS, LangChain Foundations, Agents & Tools",
        questions: buildSetQuestions(NEXAM_BASE, 302),
        color: "#DB2777",
        duration: "~25 min",
        theme: {
          headerBg: "#fff",
          headerBorder: "#e2e8f0",
          questionBg: "#fff",
          optionSelectedBg: "#fce7f3",
          optionSelectedText: "#500724",
          nextButtonBg: "#DB2777",
        },
      },
      {
        id: "nexam-c",
        examId: "nexam",
        title: "Set C",
        desc: "Word2Vec, BERT, FAISS, LangChain Foundations, Agents & Tools",
        questions: buildSetQuestions(NEXAM_BASE, 303),
        color: "#D97706",
        duration: "~25 min",
        theme: {
          headerBg: "#fff",
          headerBorder: "#e2e8f0",
          questionBg: "#fff",
          optionSelectedBg: "#fef3c7",
          optionSelectedText: "#451a03",
          nextButtonBg: "#D97706",
        },
      },
    ],
  },
  {
    id: "wexam",
    label: "WExam Assessment",
    subtitle: "Generative AI, Prompting & LLM-Assisted EDA · Sets A, B, C",
    sets: [
      {
        id: "wexam-a",
        examId: "wexam",
        title: "Set A",
        desc: "AI/ML/DL, Multi-Modal & Local LLMs, Prompt Engineering, Guardrails & EDA",
        questions: buildSetQuestions(WEXAM_BASE, 201),
        color: "#0891B2",
        duration: "~25 min",
        theme: {
          headerBg: "linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)",
          headerBorder: "#67e8f9",
          questionBg: "#f8feff",
          optionSelectedBg: "#cffafe",
          optionSelectedText: "#083344",
          nextButtonBg: "#0891B2",
        },
      },
      {
        id: "wexam-b",
        examId: "wexam",
        title: "Set B",
        desc: "AI/ML/DL, Multi-Modal & Local LLMs, Prompt Engineering, Guardrails & EDA",
        questions: buildSetQuestions(WEXAM_BASE, 202),
        color: "#4F46E5",
        duration: "~25 min",
        theme: {
          headerBg: "#fff",
          headerBorder: "#e2e8f0",
          questionBg: "#fff",
          optionSelectedBg: "#e0e7ff",
          optionSelectedText: "#1e1b4b",
          nextButtonBg: "#4F46E5",
        },
      },
      {
        id: "wexam-c",
        examId: "wexam",
        title: "Set C",
        desc: "AI/ML/DL, Multi-Modal & Local LLMs, Prompt Engineering, Guardrails & EDA",
        questions: buildSetQuestions(WEXAM_BASE, 203),
        color: "#0D9488",
        duration: "~25 min",
        theme: {
          headerBg: "#fff",
          headerBorder: "#e2e8f0",
          questionBg: "#fff",
          optionSelectedBg: "#ccfbf1",
          optionSelectedText: "#042f2e",
          nextButtonBg: "#0D9488",
        },
      },
    ],
  },
];

const ALL_SETS = EXAMS.flatMap((exam) => exam.sets);

export { EXAMS, ALL_SETS };

export function getExam(examId) {
  return EXAMS.find((e) => e.id === examId) ?? null;
}

export function getSetById(setId) {
  return ALL_SETS.find((s) => s.id === setId) ?? null;
}

export const WEXAM = EXAMS.find((e) => e.id === "wexam");
export const NEXAM = EXAMS.find((e) => e.id === "nexam");
