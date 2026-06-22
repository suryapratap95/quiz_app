/**
 * NExam pool — 20 questions across 10 curriculum topics.
 * Covers: Word2Vec/Doc2Vec, Transformer Embeddings, Document Clustering/FAISS/Ethical AI,
 * LangChain Foundations, LangChain Caching/Token Tracking, Banking FAQ Mini-Project,
 * LangChain Advanced Prompts, Conversational Memory, Custom Tools & Function Calling,
 * LangChain Agents & Multi-Tool Routing.
 * Sets (A/B/C) built at runtime via buildSetQuestions in lib/exams.js.
 */
export const NEXAM_POOL = [
  // ── Topic 1: Word2Vec, Doc2Vec & Embedding Visualization (2) ──
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

  // ── Topic 2: Transformer Embeddings – BERT & Sentence-BERT (2) ──
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

  // ── Topic 3: Document Clustering, FAISS & Ethical AI (2) ──
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

  // ── Topic 4: LangChain Foundations – Chat Models, Chains & Runnables (2) ──
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

  // ── Topic 5: LangChain – Caching, Token Tracking & Framework Comparison (2) ──
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

  // ── Topic 6: Week 1-3 Review & Mini-Project: Banking FAQ Chatbot (2) ──
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

  // ── Topic 7: LangChain Advanced – PipelinePrompt & FewShotPromptTemplate (2) ──
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

  // ── Topic 8: LangChain – Conversational Memory & Multi-Turn Chains (2) ──
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

  // ── Topic 9: LangChain – Custom Tools & Function Calling (2) ──
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

  // ── Topic 10: LangChain Agents – Multi-Tool Routing & Intelligent Reasoning (2) ──
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
