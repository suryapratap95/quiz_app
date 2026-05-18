import QuizApp from "@/components/QuizApp";

export default function MidtermPage() {
  return (
    <QuizApp
      examId="midterm"
      homePath="/"
      otherExamLink={{ href: "/finalexam", label: "Final Exam →" }}
    />
  );
}
