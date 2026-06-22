"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { isWexamGroupId } from "@/lib/wexam-groups";
import ExamSetSelection from "@/components/ExamSetSelection";
import DynamicSetSelection from "@/components/DynamicSetSelection";
import TakeExamPage from "@/components/TakeExamPage";
import { Loader2 } from "lucide-react";

export default function ExamPage() {
  const { examId } = useParams();
  const isWexam = isWexamGroupId(examId);

  // null = not yet resolved — requires an API check
  const [resolvedType, setResolvedType] = useState(() => {
    if (isWexam) return "wexam-group";
    return null; // always resolve via API for all other IDs
  });

  // Check the DB: if this exam ID exists as a row it's a set → TakeExamPage;
  // if it returns 404 or no exam, it's a group parent → DynamicSetSelection.
  useEffect(() => {
    if (resolvedType !== null) return; // already resolved

    fetch(`/api/exams/${examId}`)
      .then((r) => {
        if (r.ok) {
          return r.json().then((data) => {
            if (data.exam) {
              setResolvedType("take-exam");
            } else {
              setResolvedType("dynamic-group");
            }
          });
        } else {
          setResolvedType("dynamic-group");
        }
      })
      .catch(() => {
        setResolvedType("dynamic-group");
      });
  }, [examId, resolvedType]);

  // Loading state while resolving examgrp- type
  if (resolvedType === null) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 size={36} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (resolvedType === "wexam-group") {
    return <ExamSetSelection />;
  }

  if (resolvedType === "dynamic-group") {
    return <DynamicSetSelection groupId={examId} />;
  }

  return <TakeExamPage examId={examId} />;
}
