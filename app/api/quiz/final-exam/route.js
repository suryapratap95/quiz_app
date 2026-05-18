import { FINAL_EXAM } from "@/lib/exams";

export async function GET() {
  if (!FINAL_EXAM) {
    return Response.json({ error: "Final exam not configured" }, { status: 404 });
  }

  return Response.json({
    id: FINAL_EXAM.id,
    label: FINAL_EXAM.label,
    subtitle: FINAL_EXAM.subtitle,
    questionCount: 30,
    forms: FINAL_EXAM.sets.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.desc,
      questionCount: s.questions.length,
      duration: s.duration,
    })),
    pageUrl: "/finalexam",
  });
}
