-- Enable pgvector (idempotent)
create extension if not exists vector;

-- Semantic deduplication column
alter table entries add column if not exists embedding vector(1536);

-- HNSW index for cosine similarity search
create index if not exists entries_embedding_hnsw_idx
  on entries using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);
