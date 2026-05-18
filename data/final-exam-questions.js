/**
 * Final Exam pool — harder MCQs with similar distractors.
 * ~40% marked isProgramming for code/output-tracing items.
 * 30 selected per form at runtime (≥30% programming enforced).
 */
export const FINAL_EXAM_POOL = [
  // ── Prompt Engineering ──
  {
    id: "f-1a",
    topic: "Prompt Engineering",
    isProgramming: true,
    q: `You parse LLM output with PydanticOutputParser. The model returns:\n\n{"sentiment": "positive", "score": "0.87"}\n\nSchema expects score: float. What happens?`,
    opts: [
      "Parser coerces \"0.87\" to float automatically — no error",
      "Validation fails because score is a string, not a float — you need repair/retry logic",
      "Parser ignores score and returns only sentiment",
      "PydanticOutputParser only works with XML, not JSON",
    ],
    ans: 1,
  },
  {
    id: "f-1b",
    topic: "Prompt Engineering",
    q: `Few-shot examples in a production classifier drift in accuracy after a model version upgrade. Best FIRST step?`,
    opts: [
      "Remove all examples and switch to zero-shot only",
      "Re-evaluate examples on the new model; update format/instructions to match new tokenization behavior",
      "Fine-tune the model on the few-shot examples immediately",
      "Increase temperature so the model explores new patterns",
    ],
    ans: 1,
  },

  // ── Advanced Prompt Patterns ──
  {
    id: "f-2a",
    topic: "Advanced Prompt Patterns",
    isProgramming: true,
    q: `Middleware inspects user input before the LLM call:\n\ndef guard(req):\n  if re.search(r"ignore.*instruction", req.text, re.I):\n    return BlockedResponse()\n  return next_handler(req)\n\nWhich attack does this STILL miss most likely?`,
    opts: [
      "Base64-encoded instruction override in an attachment filename only",
      "Unicode homoglyph / split-token jailbreaks that don't match the regex literal",
      "Setting temperature to 0",
      "Using a system message with safety rules",
    ],
    ans: 1,
  },
  {
    id: "f-2b",
    topic: "Advanced Prompt Patterns",
    q: `Self-consistency (multiple CoT samples + majority vote) helps most when:`,
    opts: [
      "The task has a single deterministic numeric answer with no reasoning variance",
      "Reasoning paths vary but the final answer should converge on multi-step logic problems",
      "You need the lowest possible token cost per request",
      "The model must cite external documents verbatim",
    ],
    ans: 1,
  },

  // ── Data Analysis ──
  {
    id: "f-3a",
    topic: "Data Analysis",
    isProgramming: true,
    q: `Code runs on a sales DataFrame:\n\ndf.groupby("region")["revenue"].mean().sort_values().tail(1)\n\nWhat does this return?`,
    opts: [
      "The single highest revenue value across all rows",
      "A Series with one row: the region label as index and its mean revenue as value",
      "A DataFrame of all regions sorted alphabetically",
      "An error because tail(1) cannot be used after groupby",
    ],
    ans: 1,
  },
  {
    id: "f-3b",
    topic: "Data Analysis",
    q: `You have 200 columns and 8k rows. For LLM-assisted EDA, which context strategy minimizes hallucinated aggregations?`,
    opts: [
      "Send full CSV as one string",
      "Send dtypes, null %, 5-row sample, and pre-computed describe() per numeric column",
      "Send only column names and ask the model to infer distributions",
      "Send screenshots of the spreadsheet UI",
    ],
    ans: 1,
  },

  // ── Text Preprocessing ──
  {
    id: "f-4a",
    topic: "Text Preprocessing",
    isProgramming: true,
    q: `What is the shape of X after:\n\nfrom sklearn.feature_extraction.text import TfidfVectorizer\nvec = TfidfVectorizer(ngram_range=(1,2), max_features=100)\nX = vec.fit_transform(["data science is fun", "science data fun"])\n\n(Assume unique ngrams ≤ 100.)`,
    opts: [
      "(2, 2) — one feature per document",
      "(2, n_features) where n_features ≤ 100 — rows=docs, cols=terms/bigrams",
      "(100, 2) — features × documents transposed",
      "(2, 3) — only unigrams counted because bigrams disabled",
    ],
    ans: 1,
  },
  {
    id: "f-4b",
    topic: "Text Preprocessing",
    q: `BM25 is often preferred over raw TF-IDF for lexical retrieval because BM25:`,
    opts: [
      "Encodes word order with transformers",
      "Applies term-frequency saturation and document-length normalization",
      "Requires GPU embedding models",
      "Guarantees higher recall than dense vectors in all cases",
    ],
    ans: 1,
  },

  // ── Transformer Embeddings ──
  {
    id: "f-5a",
    topic: "Transformer Embeddings",
    isProgramming: true,
    q: `Code:\n\nfrom sentence_transformers import SentenceTransformer\nm = SentenceTransformer("all-MiniLM-L6-v2")\na = m.encode("bank river", normalize_embeddings=True)\nb = m.encode("bank account", normalize_embeddings=True)\nsim = (a @ b)  # dot product\n\nWith normalize_embeddings=True, sim approximates:`,
    opts: [
      "Euclidean distance between raw embeddings",
      "Cosine similarity between the two sentence vectors",
      "Jaccard similarity of tokens",
      "Always 1.0 because both contain the word 'bank'",
    ],
    ans: 1,
  },
  {
    id: "f-5b",
    topic: "Transformer Embeddings",
    q: `Mean pooling of token embeddings vs. using the [CLS] vector for sentence similarity:`,
    opts: [
      "They always produce identical rankings",
      "Mean pooling often works better for sentence-transformers fine-tuned with contrastive loss; CLS depends on pre-training objective",
      "CLS is always superior for retrieval",
      "Mean pooling cannot be used with attention models",
    ],
    ans: 1,
  },

  // ── LangChain Core ──
  {
    id: "f-6a",
    topic: "LangChain Core",
    isProgramming: true,
    q: `What does this LCEL chain return when invoked with {"topic": "AI"}?\n\nfrom langchain_core.prompts import ChatPromptTemplate\nfrom langchain_core.output_parsers import StrOutputParser\n\nprompt = ChatPromptTemplate.from_template("Define {topic} in one sentence.")\nchain = prompt | StrOutputParser()\nchain.invoke({"topic": "AI"})`,
    opts: [
      "A ChatPromptValue object — parser not connected to an LLM",
      "An error unless an LLM is piped between prompt and StrOutputParser",
      "The string template with {topic} unreplaced",
      "A JSON object with key 'topic'",
    ],
    ans: 1,
  },
  {
    id: "f-6b",
    topic: "LangChain Core",
    q: `StructuredOutputParser vs. PydanticOutputParser — key difference in production?`,
    opts: [
      "StructuredOutputParser calls external APIs; Pydantic does not",
      "PydanticOutputParser validates against a typed model schema with field constraints",
      "Only StructuredOutputParser works with OpenAI",
      "They are identical wrappers",
    ],
    ans: 1,
  },

  // ── LangChain Advanced ──
  {
    id: "f-7a",
    topic: "LangChain Advanced",
    isProgramming: true,
    q: `RunnableParallel in LCEL:\n\nchain = RunnableParallel(\n  summary=summary_chain,\n  keywords=keyword_chain,\n)\nresult = chain.invoke({"text": doc})\n\nresult is:`,
    opts: [
      "A single merged string of summary + keywords",
      "A dict with keys 'summary' and 'keywords' mapping to each branch's output",
      "The output of whichever branch finishes first",
      "An error — Parallel cannot wrap chains",
    ],
    ans: 1,
  },
  {
    id: "f-7b",
    topic: "LangChain Advanced",
    q: `Placing the same safety instruction in both SystemMessage and HumanMessage typically:`,
    opts: [
      "Doubles API cost with no effect",
      "Dilutes role separation — system should hold policy; human should hold task input",
      "Is required for GPT-4o to follow rules",
      "Prevents all jailbreaks automatically",
    ],
    ans: 1,
  },

  // ── LangChain Agents ──
  {
    id: "f-8a",
    topic: "LangChain Agents",
    isProgramming: true,
    q: `Agent log shows tool calls for: "Convert 50 USD to EUR using today's rate."\n\n1. search_web("USD EUR exchange rate today")\n2. calculator("50 * 0.92")\n\nIf step 2 used a hardcoded 0.92 while step 1 returned 0.89, the bug is:`,
    opts: [
      "Using web_search before calculator — order is wrong",
      "Agent ignored retrieved value and used a stale/hallucinated rate in calculator",
      "Calculator tool cannot multiply decimals",
      "Temperature was too low",
    ],
    ans: 1,
  },
  {
    id: "f-8b",
    topic: "LangChain Agents",
    q: `Plan-and-Execute agents differ from ReAct agents mainly because:`,
    opts: [
      "Plan-and-Execute never use tools",
      "Plan-and-Execute form a full plan first, then execute steps; ReAct interleaves thought-action each turn",
      "ReAct requires fine-tuning; Plan-and-Execute does not",
      "Only ReAct supports memory",
    ],
    ans: 1,
  },

  // ── LangChain Integration ──
  {
    id: "f-9a",
    topic: "LangChain Integration",
    isProgramming: true,
    q: `This RAG chain is wired as:\n\nchain = retriever | format_docs | prompt | llm\n\nBut answers cite wrong years. Most likely missing component?`,
    opts: [
      "A document compressor / re-ranker between retriever and prompt",
      "An OutputParser after the LLM",
      "Higher temperature only",
      "Removing the retriever entirely",
    ],
    ans: 0,
  },
  {
    id: "f-9b",
    topic: "LangChain Integration",
    q: `Loading 500 PDFs with PyPDFLoader vs. UnstructuredPDFLoader — trade-off?`,
    opts: [
      "PyPDF is always more accurate for tables",
      "Unstructured often better layout/table handling but slower/heavier; PyPDF is fast but layout-blind",
      "Both produce identical chunk quality",
      "Neither works in LangChain",
    ],
    ans: 1,
  },

  // ── RAG Foundations ──
  {
    id: "f-10a",
    topic: "RAG Foundations",
    isProgramming: true,
    q: `Pipeline order at query time:\n\nA) Generate answer\nB) Embed query\nC) Retrieve top-k chunks\nD) Build augmented prompt\n\nCorrect sequence:`,
    opts: [
      "A → B → C → D",
      "B → C → D → A",
      "C → B → A → D",
      "D → A → B → C",
    ],
    ans: 1,
  },
  {
    id: "f-10b",
    topic: "RAG Foundations",
    q: `Dense retrieval fails on queries with rare exact IDs (e.g., "error code E-4472"). Best hybrid fix?`,
    opts: [
      "Increase embedding dimension to 4096",
      "Combine dense vectors with BM25/keyword match on the ID token",
      "Set temperature to 0",
      "Remove chunking",
    ],
    ans: 1,
  },

  // ── Vector Databases ──
  {
    id: "f-11a",
    topic: "Vector Databases",
    isProgramming: true,
    q: `ChromaDB code:\n\ncollection.add(ids=["1","2"], embeddings=[[0.1,0.2],[0.3,0.4]], documents=["a","b"])\nresults = collection.query(query_embeddings=[[0.15,0.25]], n_results=1)\n\nresults["documents"] returns:`,
    opts: [
      "Both documents always",
      "A nested list: top-1 document(s) by vector similarity to the query embedding",
      "Only document \"a\" regardless of vectors",
      "An error — query requires ids not embeddings",
    ],
    ans: 1,
  },
  {
    id: "f-11b",
    topic: "Vector Databases",
    q: `FAISS IndexHNSW vs. IndexFlatL2 for 2M vectors — practical trade-off?`,
    opts: [
      "Flat is always faster at query time",
      "HNSW: approximate, faster queries, tunable recall; Flat: exact, memory-heavy, slow at scale",
      "HNSW requires retraining the LLM",
      "Flat supports metadata filtering natively; HNSW does not",
    ],
    ans: 1,
  },

  // ── Advanced RAG ──
  {
    id: "f-12a",
    topic: "Advanced RAG",
    isProgramming: true,
    q: `Hybrid score: final = 0.7 * dense_score + 0.3 * bm25_score (both normalized 0-1).\n\nA chunk ranks #1 dense (0.95) but #40 BM25 (0.10). Final score ≈`,
    opts: [
      "0.95 — dense dominates completely",
      "0.7*0.95 + 0.3*0.10 = 0.695",
      "0.10 — BM25 pulls it down to minimum",
      "0.525 — average of ranks not scores",
    ],
    ans: 1,
  },
  {
    id: "f-12b",
    topic: "Advanced RAG",
    q: `Where should a cross-encoder re-ranker sit in the pipeline for lowest latency impact?`,
    opts: [
      "Before chunking all documents at ingest",
      "After initial retrieval on top-20 candidates, before LLM context assembly",
      "After the LLM generates the final answer",
      "Instead of embedding at ingest",
    ],
    ans: 1,
  },

  // ── RAG Evaluation ──
  {
    id: "f-13a",
    topic: "RAG Evaluation",
    isProgramming: true,
    q: `RAGAS faithfulness metric flags an answer when:`,
    opts: [
      "Retrieval recall @5 is below 0.8",
      "Claims in the generated answer are not supported by the retrieved context",
      "The LLM uses more than 4000 tokens",
      "Embedding model version changes",
    ],
    ans: 1,
  },
  {
    id: "f-13b",
    topic: "RAG Evaluation",
    q: `LLM-as-judge with reference-free grading is weakest when:`,
    opts: [
      "Measuring fluency of well-formed summaries",
      "Verifying factual grounding against private docs without providing context to the judge",
      "Comparing two prompt templates on style",
      "Scoring translation quality with bilingual references",
    ],
    ans: 1,
  },

  // ── RAG Production ──
  {
    id: "f-14a",
    topic: "RAG Production",
    isProgramming: true,
    q: `RecursiveCharacterTextSplitter(chunk_size=400, chunk_overlap=0).\n\nA definition sentence spans chars 380-420. What retrieval risk occurs?`,
    opts: [
      "No risk — embeddings capture cross-chunk context automatically",
      "The definition may be split across chunks with no overlap — neither chunk is fully self-contained",
      "Overlap=0 increases storage cost only",
      "chunk_size must equal model context window",
    ],
    ans: 1,
  },
  {
    id: "f-14b",
    topic: "RAG Production",
    q: `Production RAG returns fluent but outdated policy answers after a doc update. First check?`,
    opts: [
      "Raise temperature",
      "Verify ingest pipeline re-embedded/deleted stale chunks in the vector store",
      "Switch from RAG to fine-tuning immediately",
      "Disable hybrid search",
    ],
    ans: 1,
  },

  // ── Agentic AI ──
  {
    id: "f-15a",
    topic: "Agentic AI",
    isProgramming: true,
    q: `LangGraph skeleton:\n\ngraph = StateGraph(State)\ngraph.add_node("research", research_node)\ngraph.add_node("write", write_node)\ngraph.add_edge("research", "write")\ngraph.set_entry_point("research")\n\nExecution flow:`,
    opts: [
      "write runs before research",
      "research runs, state updates, then write runs — linear edge",
      "Both run in parallel always",
      "Graph requires an LLM inside every node definition",
    ],
    ans: 1,
  },
  {
    id: "f-15b",
    topic: "Agentic AI",
    q: `Cyclic agent graphs (loops) are used primarily to:`,
    opts: [
      "Reduce token usage by skipping tools",
      "Allow iterative refine/retry until a stop condition (e.g., quality check passes)",
      "Replace vector databases",
      "Avoid human oversight",
    ],
    ans: 1,
  },

  // ── LangGraph Advanced ──
  {
    id: "f-16a",
    topic: "LangGraph Advanced",
    isProgramming: true,
    q: `HITL setup:\n\ngraph.compile(interrupt_before=["approve_send"])\n\nRun pauses when:`,
    opts: [
      "Any node completes",
      "The graph is about to enter approve_send — waiting for human resume",
      "The LLM temperature exceeds 1",
      "Memory buffer is full",
    ],
    ans: 1,
  },
  {
    id: "f-16b",
    topic: "LangGraph Advanced",
    q: `Multi-agent supervisor pattern vs. handoff pattern:`,
    opts: [
      "Supervisor routes tasks centrally; handoff passes control directly between specialist agents",
      "Handoff requires a single shared tool only",
      "Supervisor eliminates the need for tools",
      "They are identical in LangGraph",
    ],
    ans: 0,
  },

  // ── MCP & Governance ──
  {
    id: "f-17a",
    topic: "MCP & Governance",
    isProgramming: true,
    q: `MCP server exposes tool list_resources / read_resource. Client policy:\n\nallow: ["read_resource"]\ndeny: ["write_resource"]\n\nThis enforces:`,
    opts: [
      "Model weight encryption",
      "Least-privilege tool access at the integration layer",
      "Automatic PII redaction in prompts",
      "GPU quota limits",
    ],
    ans: 1,
  },
  {
    id: "f-17b",
    topic: "MCP & Governance",
    q: `Audit logging for GenAI apps should capture which combination?`,
    opts: [
      "Only final assistant text",
      "Prompt hash/version, retrieved doc IDs, model ID, user ID, and output — not raw secrets",
      "Full API keys for replay debugging",
      "Embedding vectors for every request",
    ],
    ans: 1,
  },

  // ── MLOps & Capstone ──
  {
    id: "f-18a",
    topic: "MLOps & Capstone",
    isProgramming: true,
    q: `config/v2/rag.yaml changes:\n  chunk_size: 500 → 800\n  retriever_k: 4 → 8\n\nAfter deploy, offline recall improves but latency doubles. Best action?`,
    opts: [
      "Rollback chunk_size only; measure Pareto of k vs. latency; version configs in git",
      "Delete the vector index",
      "Set temperature to 2",
      "Stop logging metrics",
    ],
    ans: 0,
  },
  {
    id: "f-18b",
    topic: "MLOps & Capstone",
    q: `Canary release for a new prompt template should compare:`,
    opts: [
      "Only developer subjective preference",
      "Faithfulness/accuracy metrics and latency on a held-out eval set before full traffic shift",
      "GPU temperature between versions",
      "Number of Git commits",
    ],
    ans: 1,
  },
];
