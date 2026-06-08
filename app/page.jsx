import QuizApp from "@/components/QuizApp";

export const metadata = {
  title: "WExam | AI & ML Quiz Platform",
  description:
    "WExam — 20 questions on Generative AI, Prompt Engineering, Guardrails & LLM-Assisted EDA · Sets A, B, C",
};

export default function HomePage() {
  return <QuizApp examId="wexam" homePath="/" />;
}
