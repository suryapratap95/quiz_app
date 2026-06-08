import QuizApp from "@/components/QuizApp";

export const metadata = {
  title: "Final Exam | AI & ML Quiz Platform",
  description: "Final exam — 30 questions covering the full AI & ML curriculum",
};

export default function FinalExamPage() {
  return (
    <QuizApp
      examId="final"
      homePath="/finalexam"
      otherExamLink={{ href: "/wexam", label: "← WExam" }}
    />
  );
}
