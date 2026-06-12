"use client";

import { useParams } from "next/navigation";
import { isWexamGroupId } from "@/lib/wexam-groups";
import ExamSetSelection from "@/components/ExamSetSelection";
import DynamicSetSelection from "@/components/DynamicSetSelection";
import TakeExamPage from "@/components/TakeExamPage";

export default function ExamPage() {
  const { examId } = useParams();

  // Legacy wexam group
  if (isWexamGroupId(examId)) {
    return <ExamSetSelection />;
  }

  // Dynamic exam group (examgrp-xxx)
  if (examId?.startsWith("examgrp-")) {
    return <DynamicSetSelection groupId={examId} />;
  }

  return <TakeExamPage examId={examId} />;
}
