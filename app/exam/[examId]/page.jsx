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

  // null = not yet resolved, only relevant for "examgrp-" prefixed IDs
  const [resolvedType, setResolvedType] = useState(() => {
    if (isWexam) return "wexam-group";
    if (!examId?.startsWith("examgrp-")) return "take-exam";
    return null; // needs async resolution
  });

  // For IDs starting with "examgrp-", we need to check if it's a group parent
  // or an individual set (e.g. "examgrp-xxx" is the group, "examgrp-xxx-a" is a set).
  // The group parent ID is never stored as an exam row — only set IDs are.
  // So we check the DB: if this exam ID exists as a row, it's a set → TakeExamPage;
  // if it returns 404, it's a group parent → DynamicSetSelection.
  useEffect(() => {
    if (resolvedType !== null) return; // already resolved

    fetch(`/api/exams/${examId}`)
      .then((r) => {
        if (r.ok) {
          return r.json().then((data) => {
            if (data.exam) {
              // This exam ID exists as a row — it's a set, show TakeExamPage
              setResolvedType("take-exam");
            } else {
              // No exam found, treat as group
              setResolvedType("dynamic-group");
            }
          });
        } else {
          // 404 — not an exam row, it's a group parent ID
          setResolvedType("dynamic-group");
        }
      })
      .catch(() => {
        // On error, treat as group
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
