# Retrieval-Augmented Generation (RAG) System Design Notes

RAG combines a retriever and a generator.

## Core pipeline
1. Ingest source documents.
2. Split text into chunks.
3. Convert chunks into vector embeddings.
4. Store vectors in an index (for example FAISS).
5. Retrieve top-k chunks for a user query.
6. Build a prompt with retrieved context.
7. Generate an answer with an LLM.

## Why RAG helps
- Reduces hallucinations by grounding answers in retrieved context.
- Lets models answer questions about private or recent documents.
- Improves traceability because context snippets can be surfaced.

## Common failure modes
- Poor chunking strategy causing fragmented context.
- Weak embeddings leading to irrelevant retrieval.
- Too-small top-k missing critical evidence.
- Prompt that does not force grounded answers.

## Practical tuning ideas
- Adjust chunk_size and chunk_overlap based on document structure.
- Evaluate multiple embedding models.
- Compare similarity search settings and top-k values.
- Add reranking for improved precision.
- Use evaluation metrics to detect regressions after changes.
