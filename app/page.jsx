import QuizApp from "@/components/QuizApp";

export default function MidtermPage() {
  return (
    <QuizApp
      examId="midterm"
      homePath="/"
      otherExamLink={{ href: "/wexam", label: "WExam →" }}
    />
  );
}
