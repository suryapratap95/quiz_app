"use client";

import { useParams } from "next/navigation";
import { isWexamGroupId } from "@/lib/wexam-groups";
import ExamSetSelection from "@/components/ExamSetSelection";
import TakeExamPage from "@/components/TakeExamPage";

export default function ExamPage() {
  const { examId } = useParams();

  if (isWexamGroupId(examId)) {
    return <ExamSetSelection />;
  }

  return <TakeExamPage examId={examId} />;
}
