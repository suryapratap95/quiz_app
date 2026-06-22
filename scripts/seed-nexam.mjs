/**
 * Seed NExam (next exam) into the database.
 * Creates 3 exam sets (A/B/C) and inserts all 20 questions shuffled per set.
 *
 * Usage:
 *   node scripts/seed-nexam.mjs
 *
 * Requires POSTGRES_URL or POSTGRES_URL_NON_POOLING in environment.
 */
import { createPool } from "@vercel/postgres";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Manually load .env.local
const envPath = resolve(__dirname, "../.env.local");
try {
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
} catch {}

const pool = createPool({
  connectionString:
    process.env.POSTGRES_URL_NON_POOLING || process.env.POSTGRES_URL,
});

// ── Question pool ────────────────────────────────────────────────────────────
const NEXAM_POOL = [
  // Topic 1: Word2Vec, Doc2Vec & Embedding Visualization
  {
    id: "n-1",
    topic: "Word2Vec, Doc2Vec & Embeddings",
    q: `In Word2Vec's Skip-Gram architecture, the model is trained to:`,
    opts: [
      "Predict a target word from a fixed context window of surrounding words",
      "Predict surrounding context words given a single target word",
      "Cluster documents into semantic groups using K-Means",
      "Generate sentence-level embeddings by averaging all token vectors",
    ],
    ans: 1,
  },
  {
    id: "n-2",
    topic: "Word2Vec, Doc2Vec & Embeddings",
    q: `Doc2Vec extends Word2Vec by introducing a "paragraph vector." What is the primary role of this paragraph vector during training?`,
    opts: [
      "It replaces all word vectors once training is complete",
      "It acts as an additional memory vector that captures document-level context alongside word vectors",
      "It stores the document's metadata such as author and timestamp",
      "It computes the TF-IDF score for each word in the document",
    ],
    ans: 1,
  },
  // Topic 2: Transformer Embeddings – BERT & Sentence-BERT
  {
    id: "n-3",
    topic: "Transformer Embeddings – BERT & SBERT",
    q: `BERT generates contextual embeddings primarily because it uses:`,
    opts: [
      "A unidirectional LSTM that reads text left to right",
      "Bidirectional self-attention that considers the full sentence context for every token",
      "A bag-of-words representation with positional encoding added afterward",
      "A convolutional filter applied over sliding windows of tokens",
    ],
    ans: 1,
  },
  {
    id: "n-4",
    topic: "Transformer Embeddings – BERT & SBERT",
    q: `Sentence-BERT (SBERT) modifies the original BERT architecture mainly to:`,
    opts: [
      "Increase BERT's vocabulary size to handle domain-specific terminology",
      "Produce fixed-size sentence embeddings that allow efficient semantic similarity comparison via cosine distance",
      "Enable BERT to process images alongside text in a multi-modal pipeline",
      "Reduce BERT's parameter count by removing the NSP (Next Sentence Prediction) head",
    ],
    ans: 1,
  },
  // Topic 3: Document Clustering, FAISS & Ethical AI
  {
    id: "n-5",
    topic: "Document Clustering, FAISS & Ethical AI",
    q: `FAISS (Facebook AI Similarity Search) is best described as:`,
    opts: [
      "A fine-tuning framework that adapts BERT to downstream classification tasks",
      "A library for efficient similarity search and clustering of dense vectors, optimized for large-scale retrieval",
      "A tokenizer that converts raw text into subword units for transformer models",
      "A bias-detection tool that audits NLP models for fairness violations",
    ],
    ans: 1,
  },
  {
    id: "n-6",
    topic: "Document Clustering, FAISS & Ethical AI",
    q: `When deploying an NLP-based hiring tool, which Ethical AI concern is MOST directly raised if the training data predominantly reflects historical hiring patterns from one demographic group?`,
    opts: [
      "Latency — the model will respond slower for underrepresented groups",
      "Algorithmic bias — the model may systematically disadvantage candidates from underrepresented groups",
      "Hallucination — the model will fabricate credentials for underrepresented applicants",
      "Over-fitting — the model will memorize all training resumes verbatim",
    ],
    ans: 1,
  },
  // Topic 4: LangChain Foundations – Chat Models, Chains & Runnables
  {
    id: "n-7",
    topic: "LangChain Foundations",
    q: `In LangChain's LCEL (LangChain Expression Language), the pipe operator "|" is used to:`,
    opts: [
      "Perform a bitwise OR on the token IDs produced by the language model",
      "Chain components together so the output of one component becomes the input of the next",
      "Merge two separate vector stores into a single unified index",
      "Compress a long conversation history by discarding older messages",
    ],
    ans: 1,
  },
  {
    id: "n-8",
    topic: "LangChain Foundations",
    q: `A LangChain ChatModel differs from a standard LLM in that it:`,
    opts: [
      "Only accepts plain strings and returns plain strings with no role information",
      "Takes a list of structured messages (system, human, AI) as input and returns a structured AI message",
      "Is limited to summarization tasks and cannot generate open-ended responses",
      "Requires a fine-tuned model and cannot use off-the-shelf APIs like OpenAI",
    ],
    ans: 1,
  },
  // Topic 5: LangChain – Caching, Token Tracking & Framework Comparison
  {
    id: "n-9",
    topic: "LangChain Caching & Token Tracking",
    q: `LangChain's exact-match LLM cache helps reduce costs by:`,
    opts: [
      "Compressing the prompt before sending it to the API to use fewer tokens",
      "Returning a stored response for an identical prompt without making a new API call",
      "Batching multiple different prompts into a single API request",
      "Automatically truncating responses that exceed the model's context window",
    ],
    ans: 1,
  },
  {
    id: "n-10",
    topic: "LangChain Caching & Token Tracking",
    q: `When comparing LangChain to a direct OpenAI SDK call for a simple single-turn Q&A task, the MAIN trade-off of using LangChain is:`,
    opts: [
      "LangChain always produces more accurate answers because it uses RAG internally",
      "LangChain adds abstraction and composability at the cost of added complexity and overhead for trivial tasks",
      "LangChain eliminates the need for an API key because it uses local models exclusively",
      "Direct SDK calls are always slower because they lack LangChain's built-in async support",
    ],
    ans: 1,
  },
  // Topic 6: Banking FAQ Chatbot Mini-Project
  {
    id: "n-11",
    topic: "Banking FAQ Chatbot Mini-Project",
    q: `In a Banking FAQ Chatbot built with LangChain and a vector store, the retrieval step is responsible for:`,
    opts: [
      "Fine-tuning the language model on banking-domain data to improve factual accuracy",
      "Converting the user's query into an embedding and fetching the most semantically similar FAQ chunks from the vector store",
      "Logging every user message to a relational database for compliance auditing",
      "Generating a structured JSON response that the front end parses into UI components",
    ],
    ans: 1,
  },
  {
    id: "n-12",
    topic: "Banking FAQ Chatbot Mini-Project",
    q: `A customer asks the banking chatbot a question that has no matching FAQ entry. The BEST design response is to:`,
    opts: [
      "Return the highest-scoring FAQ chunk even if its similarity score is very low, without any caveat",
      "Apply a similarity threshold and, if no chunk passes it, respond with a graceful fallback message such as escalating to a human agent",
      "Terminate the session immediately to prevent the model from hallucinating",
      "Randomly select any FAQ entry to ensure the user always receives a response",
    ],
    ans: 1,
  },
  // Topic 7: LangChain Advanced – PipelinePrompt & FewShotPromptTemplate
  {
    id: "n-13",
    topic: "LangChain Advanced Prompts",
    q: `A FewShotPromptTemplate in LangChain is used to:`,
    opts: [
      "Automatically select the best base model from a registry based on the task",
      "Inject a set of input-output examples into the prompt to guide the model's response style or format",
      "Cache the top-5 most common prompts to reduce API latency",
      "Split a long document into chunks that fit within the model's context window",
    ],
    ans: 1,
  },
  {
    id: "n-14",
    topic: "LangChain Advanced Prompts",
    q: `PipelinePromptTemplate in LangChain is primarily useful when you want to:`,
    opts: [
      "Execute multiple LLM calls in parallel and merge their outputs",
      "Compose a final prompt from several named sub-prompts, each filling a distinct section of the overall template",
      "Stream tokens from the model to the user interface in real time",
      "Convert a chat-format prompt into a completion-format prompt automatically",
    ],
    ans: 1,
  },
  // Topic 8: LangChain – Conversational Memory & Multi-Turn Chains
  {
    id: "n-15",
    topic: "Conversational Memory & Multi-Turn Chains",
    q: `LangChain's ConversationBufferWindowMemory differs from ConversationBufferMemory in that it:`,
    opts: [
      "Stores the entire conversation history from the very first message without limit",
      "Retains only the last K turns of conversation, discarding older messages to manage token usage",
      "Summarizes the conversation after every turn using a second LLM call",
      "Writes conversation history to a persistent SQL database instead of memory",
    ],
    ans: 1,
  },
  {
    id: "n-16",
    topic: "Conversational Memory & Multi-Turn Chains",
    q: `In a multi-turn LangChain chain, the memory object is injected into the prompt by:`,
    opts: [
      "Appending raw Python objects directly to the prompt string at runtime",
      "Loading prior messages into a designated placeholder variable in the PromptTemplate, which is populated before each LLM call",
      "Re-training the model on conversation history between each turn",
      "Storing messages as image-encoded tokens so they bypass the context window limit",
    ],
    ans: 1,
  },
  // Topic 9: LangChain – Custom Tools & Function Calling
  {
    id: "n-17",
    topic: "Custom Tools & Function Calling",
    q: `When defining a custom LangChain Tool, the description field is critical because:`,
    opts: [
      "It sets the tool's execution timeout in milliseconds",
      "The agent (LLM) reads the description to decide whether and when to invoke the tool for a given user query",
      "It specifies the Python type hints for the tool's input arguments",
      "It controls how many times the tool can be called within a single agent run",
    ],
    ans: 1,
  },
  {
    id: "n-18",
    topic: "Custom Tools & Function Calling",
    q: `OpenAI Function Calling (used under the hood by LangChain's tool binding) allows the model to:`,
    opts: [
      "Execute arbitrary Python code inside the model's sandboxed environment",
      "Output a structured JSON object specifying which function to call and with what arguments, rather than free-form text",
      "Call external REST APIs directly without any client-side code handling the response",
      "Bypass the model's safety filters when the function is marked as trusted",
    ],
    ans: 1,
  },
  // Topic 10: LangChain Agents – Multi-Tool Routing & Intelligent Reasoning
  {
    id: "n-19",
    topic: "LangChain Agents & Multi-Tool Routing",
    q: `In a ReAct (Reasoning + Acting) agent, the agent loop proceeds by:`,
    opts: [
      "Running all available tools simultaneously and choosing the result with the highest confidence score",
      "Alternating between a Thought step (reasoning about what to do) and an Action step (calling a tool), then observing the result, until a final answer is reached",
      "Fine-tuning the underlying LLM on the current task before executing any tool calls",
      "Randomly sampling tool calls and retrying until the output matches a predefined template",
    ],
    ans: 1,
  },
  {
    id: "n-20",
    topic: "LangChain Agents & Multi-Tool Routing",
    q: `When a LangChain agent is given multiple tools (e.g., a calculator, a web search, and a database lookup), the routing decision — which tool to call — is made by:`,
    opts: [
      "A hard-coded if-else rule tree written by the developer",
      "The LLM itself, which reads the tool descriptions and the current query to select the most appropriate tool",
      "A separate fine-tuned classifier model trained specifically for tool selection",
      "The FAISS vector store, which retrieves the tool whose description is closest to the query",
    ],
    ans: 1,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
function seededShuffle(arr, seed) {
  const a = [...arr];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function shuffleOptions(question, seed) {
  const correctText = question.opts[question.ans];
  let s = seed;
  const opts = [...question.opts];
  for (let i = opts.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  return { opts, ans: opts.indexOf(correctText) };
}

// ── Seed ─────────────────────────────────────────────────────────────────────
const SETS = [
  { id: "nexam-a", label: "Set A", title: "NExam — Set A", seed: 301, color: "#7C3AED" },
  { id: "nexam-b", label: "Set B", title: "NExam — Set B", seed: 302, color: "#DB2777" },
  { id: "nexam-c", label: "Set C", title: "NExam — Set C", seed: 303, color: "#D97706" },
];

const PARENT_ID = "nexam";
const DESC = "Embeddings, LangChain Foundations, Agents & Tools";

async function run() {
  const client = await pool.connect();
  try {
    // Ensure schema (minimal)
    await client.query(`
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        duration TEXT DEFAULT '30 min',
        color TEXT DEFAULT '#6366f1',
        created_by TEXT DEFAULT 'trainer',
        is_active BOOLEAN DEFAULT true,
        allow_multiple_attempts BOOLEAN DEFAULT false,
        show_results BOOLEAN DEFAULT false,
        parent_exam_id TEXT DEFAULT NULL,
        set_label TEXT DEFAULT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id TEXT PRIMARY KEY,
        exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        question_text TEXT NOT NULL,
        options JSONB NOT NULL,
        correct_option INT NOT NULL,
        order_index INT DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    for (const set of SETS) {
      // Upsert exam row
      await client.query(
        `INSERT INTO exams (id, title, description, duration, color, show_results, allow_multiple_attempts, parent_exam_id, set_label)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           description = EXCLUDED.description,
           color = EXCLUDED.color,
           parent_exam_id = EXCLUDED.parent_exam_id,
           set_label = EXCLUDED.set_label,
           updated_at = NOW()`,
        [set.id, set.title, DESC, "~25 min", set.color, true, false, PARENT_ID, set.label]
      );

      // Delete existing questions for idempotency
      await client.query(`DELETE FROM questions WHERE exam_id = $1`, [set.id]);

      // Shuffle question order for this set, then shuffle options within each question
      const shuffled = seededShuffle(NEXAM_POOL, set.seed);
      for (let i = 0; i < shuffled.length; i++) {
        const q = shuffled[i];
        const { opts, ans } = shuffleOptions(q, set.seed + i);
        const qid = `${set.id}-q${i + 1}`;
        await client.query(
          `INSERT INTO questions (id, exam_id, question_text, options, correct_option, order_index)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [qid, set.id, q.q, JSON.stringify(opts), ans, i]
        );
      }
      console.log(`✓ Seeded ${shuffled.length} questions into ${set.id}`);
    }
    console.log("Done! NExam sets A/B/C are ready.");
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch((e) => { console.error(e); process.exit(1); });
