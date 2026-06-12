"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  groupExamsForDisplay,
  groupResultsByWexamSet,
  groupResultsByExam,
  getWexamSetLabel,
  isWexamSetId,
  sortResultsByWexamSet,
} from "@/lib/wexam-groups";
import {
  Sparkles,
  Plus,
  Upload,
  FileText,
  Users,
  BarChart3,
  Trash2,
  Eye,
  EyeOff,
  BookOpen,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  LogOut,
  Palette,
  AlertCircle,
  Download,
  Settings,
  Shuffle,
  Layers,
  Copy,
} from "lucide-react";

export default function TrainerDashboard() {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [adminPass, setAdminPass] = useState("");
  const [activeTab, setActiveTab] = useState("exams"); // exams | results | create
  const [exams, setExams] = useState([]);
  const [allResults, setAllResults] = useState([]);
  const [allExams, setAllExams] = useState([]); // for grouping results
  const [loading, setLoading] = useState(true);
  const [expandedExam, setExpandedExam] = useState(null);
  const [examResults, setExamResults] = useState({});

  // Create exam form
  const [newExam, setNewExam] = useState({
    title: "",
    description: "",
    duration: "30 min",
    color: "#6366f1",
    show_results: false,
    allow_multiple_attempts: false,
    create_sets: false,
    set_mode: "shuffle", // "shuffle" | "custom"
  });
  const [creating, setCreating] = useState(false);

  // Upload
  const [uploadingFor, setUploadingFor] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [savingQuestions, setSavingQuestions] = useState(false);

  // Manual question add
  const [addingQuestion, setAddingQuestion] = useState(null);
  const [manualQ, setManualQ] = useState({
    question_text: "",
    options: ["", "", "", ""],
    correct_answer: 0,
    topic: "General",
  });

  // Shuffle state
  const [shuffling, setShuffling] = useState(null);

  const headers = () => ({ "x-admin-password": adminPass });

  useEffect(() => {
    const pass = sessionStorage.getItem("trainer_pass");
    if (!pass) {
      router.push("/trainer");
      return;
    }
    setAdminPass(pass);
  }, []);

  useEffect(() => {
    if (!adminPass) return;
    loadExams();
  }, [adminPass]);

  const loadExams = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/exams", { headers: headers() });
      if (r.status === 401) {
        sessionStorage.removeItem("trainer_pass");
        router.push("/trainer");
        return;
      }
      const d = await r.json();
      setExams(d.exams || []);
    } catch {}
    setLoading(false);
  };

  const loadAllResults = async () => {
    try {
      const r = await fetch("/api/results", { headers: headers() });
      const d = await r.json();
      setAllResults(d.results || []);
      setAllExams(d.exams || []);
    } catch {}
  };

  const loadExamResults = async (examId) => {
    try {
      const r = await fetch(`/api/exams/${examId}/results`, {
        headers: headers(),
      });
      const d = await r.json();
      setExamResults((p) => ({
        ...p,
        [examId]: sortResultsByWexamSet(d.results || []),
      }));
    } catch {}
  };

  const displayExams = useMemo(() => groupExamsForDisplay(exams), [exams]);

  // Group all results by exam
  const groupedResults = useMemo(
    () => groupResultsByExam(allResults, allExams),
    [allResults, allExams]
  );

  const createExam = async () => {
    if (!newExam.title.trim()) return;
    setCreating(true);
    try {
      const r = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify(newExam),
      });
      if (r.ok) {
        setNewExam({
          title: "",
          description: "",
          duration: "30 min",
          color: "#6366f1",
          show_results: false,
          allow_multiple_attempts: false,
          create_sets: false,
          set_mode: "shuffle",
        });
        await loadExams();
        setActiveTab("exams");
      }
    } catch {}
    setCreating(false);
  };

  const deleteExam = async (examId, title) => {
    if (!confirm(`Delete "${title}" and all its questions & results? This cannot be undone.`))
      return;
    await fetch(`/api/exams/${examId}`, {
      method: "DELETE",
      headers: headers(),
    });
    await loadExams();
  };

  const toggleExamActive = async (examId, currentState) => {
    await fetch(`/api/exams/${examId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers() },
      body: JSON.stringify({ is_active: !currentState }),
    });
    await loadExams();
  };

  const toggleGroupActive = async (group) => {
    const newState = !group.is_active;
    for (const set of group.sets) {
      await fetch(`/api/exams/${set.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ is_active: newState }),
      });
    }
    await loadExams();
  };

  const handleFileUpload = async (examId) => {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const r = await fetch("/api/exams/upload", {
        method: "POST",
        headers: headers(),
        body: formData,
      });
      const d = await r.json();
      setUploadResult({ ...d, examId });
    } catch (err) {
      setUploadResult({ error: "Failed to upload file" });
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveUploadedQuestions = async () => {
    if (!uploadResult?.questions?.length || !uploadResult.examId) return;
    setSavingQuestions(true);
    try {
      await fetch(`/api/exams/${uploadResult.examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ questions: uploadResult.questions }),
      });
      setUploadResult(null);
      setUploadingFor(null);
      await loadExams();
    } catch {}
    setSavingQuestions(false);
  };

  const addManualQuestion = async (examId) => {
    if (!manualQ.question_text.trim()) return;
    const validOpts = manualQ.options.filter((o) => o.trim());
    if (validOpts.length < 2) return;

    try {
      await fetch(`/api/exams/${examId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({
          questions: [
            {
              ...manualQ,
              options: validOpts,
              correct_answer: Math.min(manualQ.correct_answer, validOpts.length - 1),
            },
          ],
        }),
      });
      setManualQ({
        question_text: "",
        options: ["", "", "", ""],
        correct_answer: 0,
        topic: "General",
      });
      setAddingQuestion(null);
      await loadExams();
    } catch {}
  };

  const shuffleSets = async (sourceExamId, groupId) => {
    setShuffling(groupId);
    try {
      const r = await fetch(`/api/exams/${groupId}/shuffle-sets`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers() },
        body: JSON.stringify({ sourceExamId }),
      });
      const d = await r.json();
      if (r.ok) {
        alert(d.message || "Questions shuffled successfully!");
        await loadExams();
      } else {
        alert(d.error || "Failed to shuffle questions");
      }
    } catch {
      alert("Failed to shuffle questions");
    }
    setShuffling(null);
  };

  const clearExamResults = async (examId) => {
    if (!confirm("Clear all results for this exam? This cannot be undone.")) return;
    await fetch(`/api/exams/${examId}/results`, {
      method: "DELETE",
      headers: headers(),
    });
    setExamResults((p) => ({ ...p, [examId]: [] }));
  };

  const logout = () => {
    sessionStorage.removeItem("trainer_pass");
    router.push("/trainer");
  };

  const colors = [
    "#6366f1",
    "#8b5cf6",
    "#ec4899",
    "#ef4444",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#3b82f6",
  ];

  if (!adminPass) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/20">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-white/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Sparkles size={14} />
            </div>
            <span className="text-sm font-bold text-gray-900">QuizPlatform</span>
            <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
              Trainer
            </span>
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 transition hover:text-red-500"
          >
            <LogOut size={13} />
            Logout
          </button>
        </div>
      </nav>

      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-gray-900">
            Trainer Dashboard
          </h1>
          <p className="text-sm text-gray-500">
            Manage exams, upload questions, and view student results
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex items-center gap-1 rounded-xl bg-gray-100/80 p-1">
          {[
            { id: "exams", label: "Exams", icon: BookOpen },
            { id: "results", label: "All Results", icon: BarChart3 },
            { id: "create", label: "Create Exam", icon: Plus },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id);
                if (id === "results") loadAllResults();
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === id
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && activeTab === "exams" && (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={28} className="animate-spin text-indigo-400" />
          </div>
        )}

        {/* ── EXAMS TAB ── */}
        {activeTab === "exams" && !loading && (
          <div className="space-y-4">
            {exams.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 text-center">
                <FileText size={40} className="mx-auto mb-3 text-gray-300" />
                <h3 className="mb-1 text-base font-semibold text-gray-700">
                  No exams yet
                </h3>
                <p className="mb-4 text-sm text-gray-400">
                  Create your first exam to get started
                </p>
                <button
                  onClick={() => setActiveTab("create")}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md"
                >
                  <Plus size={16} />
                  Create Exam
                </button>
              </div>
            )}

            {displayExams.map((item) => {
              const isGroup = item.type === "group";
              const exam = isGroup ? null : item;
              const group = isGroup ? item : null;
              const cardId = isGroup ? group.id : exam.id;
              const isExpanded = expandedExam === cardId;
              const results = examResults[cardId];

              const renderSubmissionRow = (sub) => {
                const pct =
                  sub.total > 0
                    ? Math.round((sub.score / sub.total) * 100)
                    : 0;
                return (
                  <div
                    key={sub.id}
                    className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm"
                  >
                    <div>
                      <div className="text-sm font-semibold text-gray-900">
                        {sub.name}
                      </div>
                      <div className="text-xs text-gray-400">{sub.email}</div>
                      <div className="mt-0.5 text-xs text-gray-300">
                        {new Date(sub.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div
                        className={`text-xl font-extrabold ${
                          pct >= 80
                            ? "text-emerald-500"
                            : pct >= 50
                            ? "text-amber-500"
                            : "text-red-500"
                        }`}
                      >
                        {sub.score}/{sub.total}
                      </div>
                      <div className="text-xs text-gray-400">({pct}%)</div>
                    </div>
                  </div>
                );
              };

              const renderResults = () => {
                if (!results) {
                  return (
                    <div className="py-4 text-center">
                      <Loader2
                        size={20}
                        className="mx-auto animate-spin text-gray-300"
                      />
                    </div>
                  );
                }

                if (results.length === 0) {
                  return (
                    <p className="py-4 text-center text-sm text-gray-400">
                      No submissions yet
                    </p>
                  );
                }

                if (isGroup) {
                  // Group results by set
                  const setIds = group.sets.map((s) => s.id);
                  const setMap = {};
                  for (const s of group.sets) {
                    setMap[s.id] = s.set_label || getWexamSetLabel(s.id) || s.title;
                  }

                  const grouped = {};
                  for (const r of results) {
                    if (!grouped[r.exam_id]) grouped[r.exam_id] = [];
                    grouped[r.exam_id].push(r);
                  }

                  return (
                    <div className="space-y-5">
                      {setIds.map((setId) => {
                        const setResults = grouped[setId] || [];
                        if (setResults.length === 0) return null;
                        return (
                          <div key={setId}>
                            <h5 className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
                              {setMap[setId] || setId} ({setResults.length})
                            </h5>
                            <div className="space-y-2">
                              {setResults.map(renderSubmissionRow)}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {results.map(renderSubmissionRow)}
                  </div>
                );
              };

              if (isGroup) {
                const isDynamic = group.isDynamic;
                return (
                  <div
                    key={cardId}
                    className="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div
                          className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                          style={{ background: group.color || "#0891B2" }}
                        >
                          <Layers size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-bold text-gray-900">
                              {group.title}
                            </h3>
                            <span
                              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                                group.is_active
                                  ? "bg-emerald-50 text-emerald-600"
                                  : "bg-gray-100 text-gray-400"
                              }`}
                            >
                              {group.is_active ? "Active" : "Inactive"}
                            </span>
                            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                              3 Sets
                            </span>
                          </div>
                          <div className="mt-0.5 flex items-center gap-4 text-xs text-gray-400">
                            <span>{group.description}</span>
                            <span>{group.question_count || 0} questions</span>
                            <span>{group.duration}</span>
                          </div>
                          {/* Show individual sets */}
                          {isDynamic && group.sets && (
                            <div className="mt-2 flex flex-wrap gap-2">
                              {group.sets.map((s) => (
                                <span
                                  key={s.id}
                                  className="inline-flex items-center gap-1 rounded-lg border border-gray-100 bg-gray-50 px-2 py-1 text-xs"
                                >
                                  <span
                                    className="inline-block h-2 w-2 rounded-full"
                                    style={{ background: s.color || "#6366f1" }}
                                  />
                                  <span className="font-medium text-gray-600">
                                    {s.set_label}
                                  </span>
                                  <span className="text-gray-400">
                                    {s.question_count || 0}q
                                  </span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Toggle active for group */}
                        {isDynamic && (
                          <button
                            onClick={() => toggleGroupActive(group)}
                            className={`rounded-lg p-2 transition ${
                              group.is_active
                                ? "text-emerald-500 hover:bg-emerald-50"
                                : "text-gray-400 hover:bg-gray-50"
                            }`}
                            title={group.is_active ? "Deactivate all sets" : "Activate all sets"}
                          >
                            {group.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                        )}

                        {/* Shuffle button for dynamic groups */}
                        {isDynamic && group.sets.length > 0 && (
                          <button
                            onClick={() => {
                              const sourceSet = group.sets.find(
                                (s) => (s.question_count || 0) > 0
                              );
                              if (!sourceSet) {
                                alert("Add questions to at least one set before shuffling.");
                                return;
                              }
                              if (
                                confirm(
                                  `Shuffle questions from "${sourceSet.set_label}" (${sourceSet.question_count} questions) to all other sets?\n\nThis will overwrite existing questions in other sets.`
                                )
                              ) {
                                shuffleSets(sourceSet.id, cardId);
                              }
                            }}
                            disabled={shuffling === cardId}
                            className="rounded-lg p-2 text-amber-500 transition hover:bg-amber-50 disabled:opacity-50"
                            title="Shuffle questions across sets"
                          >
                            {shuffling === cardId ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : (
                              <Shuffle size={16} />
                            )}
                          </button>
                        )}

                        {/* Upload for first set */}
                        {isDynamic && group.sets[0] && (
                          <button
                            onClick={() => {
                              setUploadingFor(
                                uploadingFor === group.sets[0].id
                                  ? null
                                  : group.sets[0].id
                              );
                              setUploadResult(null);
                            }}
                            className="rounded-lg p-2 text-indigo-500 transition hover:bg-indigo-50"
                            title={`Upload questions to ${group.sets[0].set_label}`}
                          >
                            <Upload size={16} />
                          </button>
                        )}

                        {/* Add question to first set */}
                        {isDynamic && group.sets[0] && (
                          <button
                            onClick={() =>
                              setAddingQuestion(
                                addingQuestion === group.sets[0].id
                                  ? null
                                  : group.sets[0].id
                              )
                            }
                            className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                            title={`Add question to ${group.sets[0].set_label}`}
                          >
                            <Plus size={16} />
                          </button>
                        )}

                        <button
                          onClick={() => {
                            if (isExpanded) {
                              setExpandedExam(null);
                            } else {
                              setExpandedExam(cardId);
                              loadExamResults(cardId);
                            }
                          }}
                          className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50"
                          title="View results"
                        >
                          {isExpanded ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </button>

                        {/* Delete group */}
                        {isDynamic && (
                          <button
                            onClick={() => deleteExam(cardId, group.title)}
                            className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-500"
                            title="Delete exam group"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Upload section for dynamic group's first set */}
                    {isDynamic &&
                      group.sets[0] &&
                      uploadingFor === group.sets[0].id && (
                        <div className="border-t border-gray-50 bg-indigo-50/30 p-5">
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">
                            Upload Questions to {group.sets[0].set_label}
                          </h4>
                          <p className="mb-2 text-xs text-gray-500">
                            Upload a PDF, Word (.docx), or TXT file. Questions will be
                            auto-extracted to {group.sets[0].set_label}.
                          </p>
                          <p className="mb-4 text-xs text-indigo-600 font-medium">
                            💡 After uploading, use the Shuffle button to distribute questions to other sets.
                          </p>

                          <div className="flex items-center gap-3">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.docx,.doc,.txt"
                              onChange={() =>
                                handleFileUpload(group.sets[0].id)
                              }
                              className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                            />
                            {uploading && (
                              <Loader2
                                size={18}
                                className="animate-spin text-indigo-500"
                              />
                            )}
                          </div>

                          {/* Upload result */}
                          {uploadResult &&
                            uploadResult.examId === group.sets[0].id && (
                              <div className="mt-4">
                                {uploadResult.error ? (
                                  <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                                    <XCircle size={16} />
                                    {uploadResult.error}
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                      <CheckCircle2 size={16} />
                                      {uploadResult.message}
                                    </div>
                                    {uploadResult.questions?.length > 0 && (
                                      <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-white p-3">
                                        {uploadResult.questions.map((q, i) => (
                                          <div
                                            key={i}
                                            className="rounded-lg bg-gray-50 p-3 text-sm"
                                          >
                                            <div className="mb-1 font-medium text-gray-800">
                                              Q{i + 1}.{" "}
                                              {q.question_text.substring(0, 100)}
                                              {q.question_text.length > 100
                                                ? "..."
                                                : ""}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                              {q.options.length} options ·
                                              Answer:{" "}
                                              {String.fromCharCode(
                                                65 + q.correct_answer
                                              )}
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                    <div className="flex gap-3">
                                      <button
                                        onClick={saveUploadedQuestions}
                                        disabled={savingQuestions}
                                        className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
                                      >
                                        {savingQuestions ? (
                                          <Loader2
                                            size={14}
                                            className="animate-spin"
                                          />
                                        ) : (
                                          <CheckCircle2 size={14} />
                                        )}
                                        Save{" "}
                                        {uploadResult.questions?.length || 0}{" "}
                                        Questions
                                      </button>
                                      <button
                                        onClick={() => setUploadResult(null)}
                                        className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                      >
                                        Discard
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      )}

                    {/* Manual question add for dynamic group's first set */}
                    {isDynamic &&
                      group.sets[0] &&
                      addingQuestion === group.sets[0].id && (
                        <div className="border-t border-gray-50 bg-blue-50/30 p-5">
                          <h4 className="mb-3 text-sm font-semibold text-gray-700">
                            Add Question to {group.sets[0].set_label}
                          </h4>
                          <div className="space-y-3">
                            <textarea
                              placeholder="Question text..."
                              value={manualQ.question_text}
                              onChange={(e) =>
                                setManualQ((p) => ({
                                  ...p,
                                  question_text: e.target.value,
                                }))
                              }
                              rows={3}
                              className="w-full rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm transition focus:border-indigo-400"
                            />
                            <div className="grid grid-cols-2 gap-2">
                              {manualQ.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      setManualQ((p) => ({
                                        ...p,
                                        correct_answer: i,
                                      }))
                                    }
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                      manualQ.correct_answer === i
                                        ? "border-emerald-500 bg-emerald-500 text-white"
                                        : "border-gray-300 text-gray-400"
                                    }`}
                                  >
                                    {String.fromCharCode(65 + i)}
                                  </button>
                                  <input
                                    placeholder={`Option ${String.fromCharCode(
                                      65 + i
                                    )}`}
                                    value={opt}
                                    onChange={(e) => {
                                      const opts = [...manualQ.options];
                                      opts[i] = e.target.value;
                                      setManualQ((p) => ({ ...p, options: opts }));
                                    }}
                                    className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex items-center gap-3">
                              <input
                                placeholder="Topic (optional)"
                                value={manualQ.topic}
                                onChange={(e) =>
                                  setManualQ((p) => ({
                                    ...p,
                                    topic: e.target.value,
                                  }))
                                }
                                className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                              <div className="flex-1" />
                              <button
                                onClick={() =>
                                  addManualQuestion(group.sets[0].id)
                                }
                                className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md"
                              >
                                Add Question
                              </button>
                              <button
                                onClick={() => setAddingQuestion(null)}
                                className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                    {isExpanded && (
                      <div className="border-t border-gray-50 bg-gray-50/50 p-5">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                            <Users size={15} />
                            Submissions ({results?.length || 0})
                          </h4>
                        </div>
                        {renderResults()}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={cardId}
                  className="animate-fade-up overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                >
                  {/* Exam header */}
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <div
                        className="flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm"
                        style={{ background: exam.color || "#6366f1" }}
                      >
                        <BookOpen size={18} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-gray-900">
                            {exam.title}
                          </h3>
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              exam.is_active
                                ? "bg-emerald-50 text-emerald-600"
                                : "bg-gray-100 text-gray-400"
                            }`}
                          >
                            {exam.is_active ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="mt-0.5 flex items-center gap-4 text-xs text-gray-400">
                          <span>{exam.question_count || 0} questions</span>
                          <span>{exam.duration}</span>
                          {exam.description && (
                            <span className="max-w-[200px] truncate">
                              {exam.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Toggle active */}
                      <button
                        onClick={() => toggleExamActive(exam.id, exam.is_active)}
                        className={`rounded-lg p-2 transition ${
                          exam.is_active
                            ? "text-emerald-500 hover:bg-emerald-50"
                            : "text-gray-400 hover:bg-gray-50"
                        }`}
                        title={exam.is_active ? "Deactivate" : "Activate"}
                      >
                        {exam.is_active ? <Eye size={16} /> : <EyeOff size={16} />}
                      </button>

                      {/* Upload questions */}
                      <button
                        onClick={() => {
                          setUploadingFor(uploadingFor === exam.id ? null : exam.id);
                          setUploadResult(null);
                        }}
                        className="rounded-lg p-2 text-indigo-500 transition hover:bg-indigo-50"
                        title="Upload questions"
                      >
                        <Upload size={16} />
                      </button>

                      {/* Add question */}
                      <button
                        onClick={() =>
                          setAddingQuestion(addingQuestion === exam.id ? null : exam.id)
                        }
                        className="rounded-lg p-2 text-blue-500 transition hover:bg-blue-50"
                        title="Add question manually"
                      >
                        <Plus size={16} />
                      </button>

                      {/* View results */}
                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedExam(null);
                          } else {
                            setExpandedExam(exam.id);
                            loadExamResults(exam.id);
                          }
                        }}
                        className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-50"
                        title="View results"
                      >
                        {isExpanded ? (
                          <ChevronUp size={16} />
                        ) : (
                          <ChevronDown size={16} />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => deleteExam(exam.id, exam.title)}
                        className="rounded-lg p-2 text-red-400 transition hover:bg-red-50 hover:text-red-500"
                        title="Delete exam"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Upload section */}
                  {uploadingFor === exam.id && (
                    <div className="border-t border-gray-50 bg-indigo-50/30 p-5">
                      <h4 className="mb-3 text-sm font-semibold text-gray-700">
                        Upload Question Paper
                      </h4>
                      <p className="mb-4 text-xs text-gray-500">
                        Upload a PDF, Word (.docx), or TXT file. Questions will be
                        auto-extracted.
                      </p>

                      <div className="flex items-center gap-3">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.doc,.txt"
                          onChange={() => handleFileUpload(exam.id)}
                          className="text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-500 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white file:cursor-pointer"
                        />
                        {uploading && (
                          <Loader2
                            size={18}
                            className="animate-spin text-indigo-500"
                          />
                        )}
                      </div>

                      {/* Upload result */}
                      {uploadResult && uploadResult.examId === exam.id && (
                        <div className="mt-4">
                          {uploadResult.error ? (
                            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                              <XCircle size={16} />
                              {uploadResult.error}
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                                <CheckCircle2 size={16} />
                                {uploadResult.message}
                                <span className="ml-auto text-xs text-emerald-500">
                                  via {uploadResult.method} parsing
                                </span>
                              </div>

                              {/* Preview extracted questions */}
                              {uploadResult.questions?.length > 0 && (
                                <div className="max-h-60 space-y-2 overflow-y-auto rounded-xl border border-gray-100 bg-white p-3">
                                  {uploadResult.questions.map((q, i) => (
                                    <div
                                      key={i}
                                      className="rounded-lg bg-gray-50 p-3 text-sm"
                                    >
                                      <div className="mb-1 font-medium text-gray-800">
                                        Q{i + 1}. {q.question_text.substring(0, 100)}
                                        {q.question_text.length > 100 ? "..." : ""}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {q.options.length} options · Answer:{" "}
                                        {String.fromCharCode(65 + q.correct_answer)}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="flex gap-3">
                                <button
                                  onClick={saveUploadedQuestions}
                                  disabled={savingQuestions}
                                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-md transition hover:bg-emerald-600 disabled:opacity-60"
                                >
                                  {savingQuestions ? (
                                    <Loader2 size={14} className="animate-spin" />
                                  ) : (
                                    <CheckCircle2 size={14} />
                                  )}
                                  Save {uploadResult.questions?.length || 0} Questions
                                </button>
                                <button
                                  onClick={() => setUploadResult(null)}
                                  className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
                                >
                                  Discard
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Manual question add */}
                  {addingQuestion === exam.id && (
                    <div className="border-t border-gray-50 bg-blue-50/30 p-5">
                      <h4 className="mb-3 text-sm font-semibold text-gray-700">
                        Add Question Manually
                      </h4>
                      <div className="space-y-3">
                        <textarea
                          placeholder="Question text..."
                          value={manualQ.question_text}
                          onChange={(e) =>
                            setManualQ((p) => ({
                              ...p,
                              question_text: e.target.value,
                            }))
                          }
                          rows={3}
                          className="w-full rounded-xl border-2 border-gray-100 bg-white px-4 py-3 text-sm transition focus:border-indigo-400"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          {manualQ.options.map((opt, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  setManualQ((p) => ({
                                    ...p,
                                    correct_answer: i,
                                  }))
                                }
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold ${
                                  manualQ.correct_answer === i
                                    ? "border-emerald-500 bg-emerald-500 text-white"
                                    : "border-gray-300 text-gray-400"
                                }`}
                              >
                                {String.fromCharCode(65 + i)}
                              </button>
                              <input
                                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                                value={opt}
                                onChange={(e) => {
                                  const opts = [...manualQ.options];
                                  opts[i] = e.target.value;
                                  setManualQ((p) => ({ ...p, options: opts }));
                                }}
                                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center gap-3">
                          <input
                            placeholder="Topic (optional)"
                            value={manualQ.topic}
                            onChange={(e) =>
                              setManualQ((p) => ({ ...p, topic: e.target.value }))
                            }
                            className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
                          />
                          <div className="flex-1" />
                          <button
                            onClick={() => addManualQuestion(exam.id)}
                            className="rounded-xl bg-blue-500 px-5 py-2 text-sm font-semibold text-white shadow-md"
                          >
                            Add Question
                          </button>
                          <button
                            onClick={() => setAddingQuestion(null)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Results section */}
                  {isExpanded && (
                    <div className="border-t border-gray-50 bg-gray-50/50 p-5">
                      <div className="mb-3 flex items-center justify-between">
                        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                          <Users size={15} />
                          Submissions ({results?.length || 0})
                        </h4>
                        {results?.length > 0 && (
                          <button
                            onClick={() => clearExamResults(exam.id)}
                            className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={12} />
                            Clear Results
                          </button>
                        )}
                      </div>

                      {renderResults()}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── ALL RESULTS TAB ── */}
        {activeTab === "results" && (
          <div className="animate-fade-up">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">
                All Submissions ({allResults.length})
              </h2>
            </div>

            {allResults.length === 0 && (
              <div className="rounded-2xl border border-dashed border-gray-200 bg-white/50 py-16 text-center">
                <BarChart3 size={40} className="mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-400">No submissions yet</p>
              </div>
            )}

            {allResults.length > 0 && groupedResults.length > 0 && (
              <div className="space-y-6">
                {groupedResults.map((group) => (
                  <div
                    key={group.groupId}
                    className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
                  >
                    {/* Group header */}
                    <div
                      className="flex items-center gap-3 border-b border-gray-50 px-5 py-4"
                      style={{
                        background: `linear-gradient(135deg, ${group.color}10, ${group.color}05)`,
                      }}
                    >
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-white"
                        style={{ background: group.color }}
                      >
                        {group.isGroup ? (
                          <Layers size={16} />
                        ) : (
                          <BookOpen size={16} />
                        )}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-gray-900">
                          {group.title}
                        </h3>
                        <p className="text-xs text-gray-400">
                          {group.totalResults} submission
                          {group.totalResults !== 1 ? "s" : ""}
                          {group.isGroup &&
                            ` · ${group.setGroups.length} set${
                              group.setGroups.length !== 1 ? "s" : ""
                            }`}
                        </p>
                      </div>
                    </div>

                    {/* Results table */}
                    <div className="overflow-x-auto">
                      {group.isGroup ? (
                        // Multi-set: show results grouped by set
                        <div className="divide-y divide-gray-50">
                          {group.setGroups.map((setGroup) => (
                            <div key={setGroup.setId}>
                              {setGroup.label && (
                                <div className="bg-gray-50/50 px-5 py-2">
                                  <span className="text-xs font-bold uppercase tracking-wide text-gray-500">
                                    {setGroup.label} ({setGroup.results.length})
                                  </span>
                                </div>
                              )}
                              <table className="w-full text-sm">
                                <tbody>
                                  {setGroup.results.map((r) => {
                                    const pct =
                                      r.total > 0
                                        ? Math.round(
                                            (r.score / r.total) * 100
                                          )
                                        : r.percentage || 0;
                                    return (
                                      <tr
                                        key={r.id}
                                        className="border-b border-gray-50 transition hover:bg-gray-50/50"
                                      >
                                        <td className="px-5 py-3">
                                          <div className="font-medium text-gray-900">
                                            {r.name}
                                          </div>
                                          <div className="text-xs text-gray-400">
                                            {r.email}
                                          </div>
                                        </td>
                                        <td className="px-5 py-3 text-center font-bold text-gray-900">
                                          {r.score}/{r.total}
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                          <span
                                            className={`font-bold ${
                                              pct >= 80
                                                ? "text-emerald-500"
                                                : pct >= 50
                                                ? "text-amber-500"
                                                : "text-red-500"
                                            }`}
                                          >
                                            {pct}%
                                          </span>
                                        </td>
                                        <td className="px-5 py-3 text-right text-xs text-gray-400">
                                          {new Date(
                                            r.timestamp
                                          ).toLocaleDateString()}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ))}
                        </div>
                      ) : (
                        // Single exam: flat table
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-50 bg-gray-50/80">
                              <th className="px-5 py-3 text-left font-semibold text-gray-600">
                                Student
                              </th>
                              <th className="px-5 py-3 text-center font-semibold text-gray-600">
                                Score
                              </th>
                              <th className="px-5 py-3 text-center font-semibold text-gray-600">
                                %
                              </th>
                              <th className="px-5 py-3 text-right font-semibold text-gray-600">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.setGroups.flatMap((sg) =>
                              sg.results.map((r) => {
                                const pct =
                                  r.total > 0
                                    ? Math.round((r.score / r.total) * 100)
                                    : r.percentage || 0;
                                return (
                                  <tr
                                    key={r.id}
                                    className="border-b border-gray-50 transition hover:bg-gray-50/50"
                                  >
                                    <td className="px-5 py-3">
                                      <div className="font-medium text-gray-900">
                                        {r.name}
                                      </div>
                                      <div className="text-xs text-gray-400">
                                        {r.email}
                                      </div>
                                    </td>
                                    <td className="px-5 py-3 text-center font-bold text-gray-900">
                                      {r.score}/{r.total}
                                    </td>
                                    <td className="px-5 py-3 text-center">
                                      <span
                                        className={`font-bold ${
                                          pct >= 80
                                            ? "text-emerald-500"
                                            : pct >= 50
                                            ? "text-amber-500"
                                            : "text-red-500"
                                        }`}
                                      >
                                        {pct}%
                                      </span>
                                    </td>
                                    <td className="px-5 py-3 text-right text-xs text-gray-400">
                                      {new Date(
                                        r.timestamp
                                      ).toLocaleDateString()}
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── CREATE EXAM TAB ── */}
        {activeTab === "create" && (
          <div className="animate-fade-up">
            <div className="mx-auto max-w-2xl rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
              <h2 className="mb-1 text-xl font-extrabold text-gray-900">
                Create New Exam
              </h2>
              <p className="mb-8 text-sm text-gray-400">
                Set up the exam details. You can add questions after creating it.
              </p>

              <div className="space-y-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Exam Title *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., AI Fundamentals Quiz"
                    value={newExam.title}
                    onChange={(e) =>
                      setNewExam((p) => ({ ...p, title: e.target.value }))
                    }
                    className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">
                    Description
                  </label>
                  <textarea
                    placeholder="Brief description of the exam..."
                    value={newExam.description}
                    onChange={(e) =>
                      setNewExam((p) => ({ ...p, description: e.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm transition focus:border-indigo-400 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700">
                      Duration
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., 30 min"
                      value={newExam.duration}
                      onChange={(e) =>
                        setNewExam((p) => ({ ...p, duration: e.target.value }))
                      }
                      className="w-full rounded-xl border-2 border-gray-100 bg-gray-50/50 px-4 py-3 text-sm transition focus:border-indigo-400 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                      <Palette size={14} />
                      Color
                    </label>
                    <div className="flex items-center gap-2">
                      {colors.map((c) => (
                        <button
                          key={c}
                          onClick={() =>
                            setNewExam((p) => ({ ...p, color: c }))
                          }
                          className={`h-8 w-8 rounded-lg transition ${
                            newExam.color === c
                              ? "ring-2 ring-offset-2 ring-indigo-400"
                              : ""
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newExam.show_results}
                      onChange={(e) =>
                        setNewExam((p) => ({
                          ...p,
                          show_results: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    Show results to students after submission
                  </label>

                  <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newExam.allow_multiple_attempts}
                      onChange={(e) =>
                        setNewExam((p) => ({
                          ...p,
                          allow_multiple_attempts: e.target.checked,
                        }))
                      }
                      className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    Allow multiple attempts
                  </label>
                </div>

                {/* ── Create 3 Sets Option ── */}
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-5">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={newExam.create_sets}
                      onChange={(e) =>
                        setNewExam((p) => ({
                          ...p,
                          create_sets: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 rounded border-gray-300 text-indigo-500 focus:ring-indigo-400"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-800">
                        Create 3 Sets (A, B, C)
                      </span>
                      <p className="mt-0.5 text-xs text-gray-500">
                        Create a grouped exam with 3 separate sets. You can add questions to
                        one set and shuffle them to the others, or add different questions to each set.
                      </p>
                    </div>
                  </label>

                  {newExam.create_sets && (
                    <div className="mt-4 space-y-3">
                      <p className="text-xs font-medium text-gray-600">
                        How would you like to manage questions?
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() =>
                            setNewExam((p) => ({ ...p, set_mode: "shuffle" }))
                          }
                          className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
                            newExam.set_mode === "shuffle"
                              ? "border-indigo-400 bg-indigo-50/60"
                              : "border-gray-200 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <Shuffle
                            size={20}
                            className={
                              newExam.set_mode === "shuffle"
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }
                          />
                          <span className="text-sm font-semibold text-gray-800">
                            Shuffle
                          </span>
                          <span className="text-xs text-gray-500">
                            Add questions to Set A, then auto-shuffle to B & C
                            with randomized question & option order
                          </span>
                        </button>

                        <button
                          onClick={() =>
                            setNewExam((p) => ({ ...p, set_mode: "custom" }))
                          }
                          className={`flex flex-1 flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition ${
                            newExam.set_mode === "custom"
                              ? "border-indigo-400 bg-indigo-50/60"
                              : "border-gray-200 bg-white hover:border-indigo-200"
                          }`}
                        >
                          <FileText
                            size={20}
                            className={
                              newExam.set_mode === "custom"
                                ? "text-indigo-500"
                                : "text-gray-400"
                            }
                          />
                          <span className="text-sm font-semibold text-gray-800">
                            Custom
                          </span>
                          <span className="text-xs text-gray-500">
                            Add different questions to each set independently
                          </span>
                        </button>
                      </div>

                      {/* Preview sets */}
                      <div className="mt-3 flex gap-2">
                        {["Set A", "Set B", "Set C"].map((label, i) => (
                          <div
                            key={label}
                            className="flex-1 rounded-lg border border-gray-100 bg-white p-3 text-center"
                          >
                            <div
                              className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-lg text-white text-xs font-bold"
                              style={{
                                background:
                                  i === 0
                                    ? newExam.color || "#0891B2"
                                    : i === 1
                                    ? "#4F46E5"
                                    : "#0D9488",
                              }}
                            >
                              {String.fromCharCode(65 + i)}
                            </div>
                            <div className="text-xs font-semibold text-gray-700">
                              {label}
                            </div>
                            <div className="text-xs text-gray-400">
                              {newExam.set_mode === "shuffle" && i > 0
                                ? "Auto-shuffled"
                                : "Add questions"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={createExam}
                  disabled={creating || !newExam.title.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-3.5 text-sm font-bold text-white shadow-lg transition hover:shadow-xl disabled:opacity-60"
                >
                  {creating ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : newExam.create_sets ? (
                    <Layers size={16} />
                  ) : (
                    <Plus size={16} />
                  )}
                  {newExam.create_sets
                    ? "Create Exam with 3 Sets"
                    : "Create Exam"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
