# HypeX_V1 — National Material Master ML Service

AI-Driven Standardization of Material Codes Across CPSEs (Smart India Hackathon IH26099).
Ministry of Petroleum & Natural Gas.

## Project Purpose

Different government-owned petroleum companies (CPSEs) maintain their own inventory/material master records. The same physical or functionally equivalent material can be described differently across organizations.

**Examples:**
- "SS Pipe 25mm"
- "Stainless Steel Pipe, 25 MM dia."
- "25MM SS PIPE"
- "Stainless Steel Seamless Pipe 25 MM OD"

The system identifies whether descriptions refer to:
1. **EXACT DUPLICATE** — Semantically identical, all technical dimensions aligned
2. **EQUIVALENT** — Same physical material, key features match
3. **NEAR DUPLICATE** — Highly comparable with slight naming variations
4. **POSSIBLE MATCH** — Potential equivalence, minor parameter gaps, human review recommended
5. **DIFFERENT** — Genuinely different materials
6. **INSUFFICIENT INFORMATION** — Cannot safely assess equivalence

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│  Backend    │────▶│  ML Service │
│  (React)    │     │ (Node/Expr) │     │  (FastAPI)  │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               ▼
                                    ┌─────────────────────┐
                                    │ Qwen3-Embedding-4B  │
                                    │ (llama.cpp, GGUF)   │
                                    │ http://127.0.0.1:8080│
                                    └─────────────────────┘
```

### ML Service Folder Structure

```
ml-service/
├── app/
│   ├── main.py                 # FastAPI app, route registration
│   ├── config.py               # Centralized settings (Pydantic Settings)
│   │
│   ├── api/
│   │   ├── dependencies.py     # Shared dependencies
│   │   └── routes/
│   │       ├── health.py       # GET /health
│   │       ├── embeddings.py   # POST /embeddings, /similarity
│   │       ├── matching.py     # POST /materials/match
│   │       └── pipeline.py     # POST /pipeline/run, /pipeline/cluster
│   │
│   ├── core/
│   │   ├── exceptions.py       # Custom exception classes
│   │   └── logging.py          # JSON/structured logging
│   │
│   ├── models/
│   │   └── schemas.py          # API Pydantic models (request/response)
│   │
│   ├── services/
│   │   ├── embedding_service.py     # Qwen + feature-hash fallback
│   │   ├── normalization_service.py # Text cleanup, abbreviation expansion
│   │   ├── extraction_service.py    # Technical attribute regex extraction
│   │   ├── matching_service.py      # Dual-check matching pipeline
│   │   ├── pipeline_service.py      # Batch processing orchestration
│   │   └── clustering_service.py    # Union-Find transitive clustering
│   │
│   └── utils/
│       ├── text.py             # Shared text utilities
│       └── units.py            # Unit conversion, dimension equivalence
│
├── tests/
│   ├── test_normalization.py
│   ├── test_extraction.py
│   ├── test_embeddings.py
│   ├── test_matching.py
│   └── test_pipeline.py
│
├── scripts/
│   └── test_qwen.py            # Manual Qwen connectivity verification
│
├── requirements.txt
└── README.md
```

## Setup Instructions

### Prerequisites
- Python 3.13+
- llama.cpp with Qwen3-Embedding-4B-GGUF:Q4_K_M model
- 6 GB VRAM (RTX 3050 or better)

### 1. Start Qwen Embedding Server

```bash
# Download model (one-time)
llama-server -hf Qwen/Qwen3-Embedding-4B-GGUF:Q4_K_M --embeddings

# Or if already downloaded:
llama-server -m path/to/Qwen3-Embedding-4B-Q4_K_M.gguf --embeddings --port 8080
```

Server runs at `http://127.0.0.1:8080` with embedding endpoint at `/v1/embeddings`.

### 2. Install ML Service Dependencies

```bash
cd ml-service
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Configure Environment (Optional)

Create `.env` in `ml-service/`:

```env
LLAMA_SERVER_URL=http://127.0.0.1:8080
LLAMA_MODEL_NAME=Qwen3-Embedding-4B
CANDIDATE_SIMILARITY_THRESHOLD=0.70
EXACT_DUPLICATE_THRESHOLD=0.96
EQUIVALENT_THRESHOLD=0.85
NEAR_DUPLICATE_THRESHOLD=0.75
POSSIBLE_MATCH_THRESHOLD=0.65
LOG_LEVEL=INFO
```

### 4. Run ML Service

```bash
cd ml-service
.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Service available at `http://localhost:8000`, docs at `http://localhost:8000/docs`.

### 5. Run Tests

```bash
cd ml-service
.venv\Scripts\Activate.ps1
pytest tests/ -v
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLAMA_SERVER_URL` | `http://127.0.0.1:8080` | llama.cpp server base URL |
| `LLAMA_EMBEDDING_ENDPOINT` | `/v1/embeddings` | Embeddings endpoint path |
| `LLAMA_MODEL_NAME` | `Qwen3-Embedding-4B` | Model name for API calls |
| `LLAMA_TIMEOUT_SECONDS` | `120` | Request timeout |
| `LLAMA_MAX_BATCH_SIZE` | `32` | Batch embedding batch size |
| `FALLBACK_EMBEDDING_DIM` | `384` | Feature-hash fallback dimension |
| `CANDIDATE_SIMILARITY_THRESHOLD` | `0.70` | Min similarity for candidate retrieval |
| `EXACT_DUPLICATE_THRESHOLD` | `0.96` | Threshold for EXACT DUPLICATE |
| `EXACT_DUPLICATE_SEMANTIC_MIN` | `0.90` | Min semantic similarity for EXACT |
| `EQUIVALENT_THRESHOLD` | `0.85` | Threshold for EQUIVALENT |
| `NEAR_DUPLICATE_THRESHOLD` | `0.75` | Threshold for NEAR DUPLICATE |
| `POSSIBLE_MATCH_THRESHOLD` | `0.65` | Threshold for POSSIBLE MATCH |
| `WEIGHT_SEMANTIC` | `0.40` | Semantic similarity weight |
| `WEIGHT_TECHNICAL` | `0.60` | Technical score weight |
| `MAX_PAIRWISE_COMPARISONS` | `10000` | Pipeline comparison limit |
| `LOG_LEVEL` | `INFO` | Logging level |
| `LOG_FORMAT` | `json` | Log format (json/text) |

## API Examples

### Health Check
```bash
curl http://localhost:8000/health
```

### Generate Embedding
```bash
curl -X POST http://localhost:8000/embeddings \
  -H "Content-Type: application/json" \
  -d '{"text": "SS Pipe 25mm"}'
```

### Batch Embeddings
```bash
curl -X POST http://localhost:8000/embeddings/batch \
  -H "Content-Type: application/json" \
  -d '{"texts": ["SS Pipe 25mm", "Stainless Steel Pipe 25mm"]}'
```

### Calculate Similarity
```bash
curl -X POST http://localhost:8000/embeddings/similarity \
  -H "Content-Type: application/json" \
  -d '{"embedding_a": [...], "embedding_b": [...]}'
```

### Match Two Materials
```bash
curl -X POST http://localhost:8000/materials/match \
  -H "Content-Type: application/json" \
  -d '{
    "material_a": {"description": "SS Pipe 25mm", "cpse_name": "CPSE A", "original_code": "A101"},
    "material_b": {"description": "Stainless Steel Pipe 25 MM", "cpse_name": "CPSE B", "original_code": "B205"}
  }'
```

Response:
```json
{
  "result": "EQUIVALENT",
  "confidence": 0.92,
  "semantic_similarity": 0.95,
  "technical_score": 0.90,
  "reason": "Descriptions represent the same physical material. Key features (type, grade, size) match successfully.",
  "comparison": {
    "product_type": "MATCH",
    "material": "MATCH",
    "grade": "MATCH",
    "dimension": "MATCH",
    "dimension_unit": "MATCH",
    "length": "MISSING",
    "standard": "MISSING",
    "pressure": "MISSING"
  }
}
```

### Run Full Pipeline (Batch)
```bash
curl -X POST http://localhost:8000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '[
    {"id": 1, "description": "SS Pipe 25mm", "cpse_name": "CPSE A", "original_code": "A101"},
    {"id": 2, "description": "Stainless Steel Pipe 25 MM", "cpse_name": "CPSE B", "original_code": "B205"}
  ]'
```

### Clustering
```bash
curl -X POST http://localhost:8000/pipeline/cluster \
  -H "Content-Type: application/json" \
  -d '{"materials": [1,2,3,4], "approved_matches": [[1,2], [3,4]]}'
```

## How Matching Works

### Pipeline Stages

1. **Normalization** — Lowercase, expand abbreviations (SS→stainless steel), spacing around units (25mm→25 mm), punctuation cleanup

2. **Attribute Extraction** — Regex-based extraction of:
   - Product type (pipe, valve, gasket, flange, bolt, etc.)
   - Material (stainless steel, carbon steel, mild steel, etc.)
   - Grade (304, 316, SS304, A106, etc.)
   - Dimension + unit (25 mm, 2 inch, 50 NB, 150 DN)
   - Length + unit (6 m, 6000 mm)
   - Pressure rating (Class 150, PN16, 3000 LBS)
   - Standard reference (ASME B16.9, API 6D)

3. **Embedding Generation** — Qwen3-Embedding-4B via llama.cpp (primary), deterministic feature-hash fallback

4. **Candidate Retrieval** — Cosine similarity ≥ 0.70 (configurable)

5. **Dual-Check Verification** — Weighted scoring:
   - Semantic similarity: 40%
   - Technical attributes: 60% (product type 15%, material 10%, grade 10%, dimension 10%, dimension unit 5%, length 5%, standard 5%, pressure 10%)

6. **Decision Thresholds** — Applied to final weighted score

### Critical Design Principle

**Semantic similarity alone is NOT the final decision.** Two materials with high semantic similarity but conflicting technical attributes (e.g., Class 150 vs Class 300 valves) are correctly classified as DIFFERENT.

## Known Limitations

1. **M16x50 bolt specifications** — Thread specs like "M16x50" are not parsed as dimension/length; extraction expects units (mm, inch, NB, DN)

2. **Qwen server required for production quality** — Feature-hash fallback produces lower similarity scores; Qwen embeddings recommended for production

3. **O(n²) pairwise comparison** — Pipeline has `MAX_PAIRWISE_COMPARISONS` limit (default 10,000); for 1M+ materials, integrate vector DB (Qdrant, Milvus, pgvector)

4. **MySQL backend only** — Current backend uses MySQL; SQLite schema exists but not actively maintained

5. **English-only normalization** — Abbreviation dictionary covers common petroleum/material terms; extend for other domains

6. **No authentication on ML service** — Add API keys / JWT if exposed beyond internal network

## Next Recommended Implementation Steps

1. **Add vector database** (Qdrant/pgvector) for scalable candidate retrieval
2. **Implement caching layer** for embeddings (Redis or SQLite)
3. **Extend attribute extraction** for thread specs (M16x50), flange ratings, electrical ratings
4. **Add category-aware matching** — Different attribute weights per product type
5. **Integrate with backend** — Replace root-level ml-service files with `app/` module imports
6. **Add API authentication** and rate limiting
7. **Implement batch embedding cache** with persistent storage

## License

Internal project for Smart India Hackathon 2026.