import { parseQuestions } from "@/lib/parse-questions";

function isAuthorized(request) {
  const configured = process.env.ADMIN_PASSWORD;
  if (!configured) return true;
  const provided = request.headers.get("x-admin-password");
  return provided === configured;
}

// POST /api/exams/upload — parse PDF/DOCX file into questions
export async function POST(request) {
  try {
    if (!isAuthorized(request)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      return Response.json({ error: "File is required" }, { status: 400 });
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (name.endsWith(".pdf")) {
      // Parse PDF
      const pdfParse = (await import("pdf-parse")).default;
      const pdfData = await pdfParse(buffer);
      extractedText = pdfData.text;
    } else if (name.endsWith(".docx") || name.endsWith(".doc")) {
      // Parse DOCX
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (name.endsWith(".txt")) {
      extractedText = buffer.toString("utf-8");
    } else {
      return Response.json(
        { error: "Unsupported file format. Please upload PDF, DOCX, or TXT files." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return Response.json(
        { error: "Could not extract text from the file. The file may be empty or image-based." },
        { status: 400 }
      );
    }

    const { questions, method } = await parseQuestions(extractedText);

    return Response.json({
      questions,
      method,
      extracted_text_preview: extractedText.substring(0, 500),
      message:
        questions.length > 0
          ? `Successfully extracted ${questions.length} questions using ${method} parsing.`
          : "No questions could be extracted. Please check the file format or add questions manually.",
    });
  } catch (error) {
    console.error("Upload parse error:", error);
    return Response.json(
      { error: error?.message || "Failed to parse uploaded file" },
      { status: 500 }
    );
  }
}
