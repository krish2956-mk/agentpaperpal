# Agent Paperpal

> Autonomous manuscript formatting system built for HackaMined 2026 — Cactus Communications (Paperpal by Editage) track.

Agent Paperpal is a full-stack AI application that accepts a research paper (PDF or DOCX) and a target journal style, then autonomously detects every formatting violation, applies corrections, generates a formatted DOCX output, and produces a scored compliance report — all powered by a 5-agent CrewAI pipeline backed by Google Gemini.

---

## Table of Contents

- [Project Overview](#project-overview)
- [High-Level Architecture](#high-level-architecture)
- [System Architecture](#system-architecture)
- [Technology Stack](#technology-stack)
- [Directory Structure](#directory-structure)
- [Application Workflow](#application-workflow)
- [UML Diagrams](#uml-diagrams)
- [API Documentation](#api-documentation)
- [Quick Start](#quick-start)
- [Environment Variables](#environment-variables)
- [Running the Project](#running-the-project)
- [Security Considerations](#security-considerations)
- [Performance Optimizations](#performance-optimizations)
- [Future Roadmap](#future-roadmap)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

### Problem Statement

Researchers spend significant time manually reformatting manuscripts for journal submission — adjusting citation styles, heading hierarchies, abstract word counts, figure numbering, and reference formatting. A single journal style can have 50+ distinct rules. Missing even a few causes desk rejection.

### Solution

Agent Paperpal eliminates manual formatting effort through a multi-agent AI pipeline:

1. **Ingests** raw PDF/DOCX content and labels every structural element
2. **Parses** the paper into a structured JSON schema
3. **Interprets** the target journal's formatting rules from a curated rules library
4. **Transforms** the paper by applying all required fixes
5. **Validates** compliance across 7 dimensions and scores from 0-100

### Key Features

| Feature | Description |
|---------|-------------|
| Multi-format input | Upload PDF or DOCX (up to 10 MB) |
| 5 journal styles | APA 7th Edition, IEEE, Vancouver, Springer, Chicago 17th |
| 5-agent AI pipeline | Sequential CrewAI agents, each with a single responsibility |
| Compliance scoring | 7-section breakdown (Document Format, Abstract, Headings, Citations, References, Figures, Tables) |
| IMRAD detection | Checks for Introduction, Methods, Results, Discussion presence |
| DOCX output | Formatted manuscript ready for download |
| Pipeline caching | SHA-256 keyed in-memory cache — identical submissions return instantly |
| No timeout | Pipeline runs until complete, regardless of paper size |

### Target Users

- Academic researchers submitting papers to journals
- Graduate students formatting theses/dissertations
- Research editors and peer-review coordinators

---

## High-Level Architecture

```mermaid
graph TB
    subgraph User["User Browser"]
        UI["React 18 SPA\nAgent Paperpal UI"]
    end

    subgraph Frontend["Frontend Layer (Vite + TailwindCSS)"]
        Proxy["Vite Dev Proxy\n/health /format /download"]
    end

    subgraph Backend["Backend Layer (FastAPI)"]
        API["FastAPI Server\nport 8000"]
        Validator["Input Validator\nExt + Size + Text Quality"]
        Pipeline["run_pipeline()"]
    end

    subgraph CrewAI["CrewAI 5-Agent Pipeline (Sequential)"]
        A1["Agent 1: INGEST\nLabel content blocks"]
        A2["Agent 2: PARSE\nExtract paper_structure JSON"]
        A3["Agent 3: INTERPRET\nLoad journal rules"]
        A4["Agent 4: TRANSFORM\nApply formatting fixes"]
        A5["Agent 5: VALIDATE\n7 compliance checks + score"]
    end

    subgraph Storage["Storage"]
        Rules["rules/*.json\nJournal Rules Library"]
        Outputs["outputs/\nFormatted DOCX files"]
        Uploads["uploads/\nTemp upload files"]
    end

    subgraph LLM["AI Backend"]
        Gemini["Google Gemini\ngemini-2.5-flash\ntemperature=0"]
    end

    UI -->|"POST /format\nmultipart file + journal"| Proxy
    UI -->|"GET /health"| Proxy
    Proxy --> API
    API --> Validator
    Validator --> Pipeline
    Pipeline --> A1
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A1 <-->|"LLM calls"| Gemini
    A2 <-->|"LLM calls"| Gemini
    A3 <-->|"LLM calls"| Gemini
    A4 <-->|"LLM calls"| Gemini
    A5 <-->|"LLM calls"| Gemini
    A3 -->|"load rules"| Rules
    A5 -->|"write DOCX"| Outputs
    API -->|"temp file"| Uploads
    API -->|"GET /download/:file"| Outputs
    Outputs -->|"FileResponse"| UI

    style User fill:#1e3a5f,color:#93c5fd
    style Frontend fill:#1a2e1a,color:#86efac
    style Backend fill:#2d1b1b,color:#fca5a5
    style CrewAI fill:#1e1b4b,color:#a5b4fc
    style Storage fill:#292524,color:#d6d3d1
    style LLM fill:#292524,color:#fde68a
```

---

## System Architecture

Agent Paperpal uses a **layered architecture** with a clear separation between:

- **Presentation layer** — React SPA with a 4-state machine (`idle → loading → success → error`)
- **API layer** — FastAPI with input validation, error mapping, and file lifecycle management
- **Orchestration layer** — CrewAI `Crew` with `Process.sequential` ensuring strict agent ordering
- **Agent layer** — 5 single-responsibility agents, each producing validated JSON output
- **Tool layer** — PDF reader, DOCX reader, DOCX writer, rule loader, structured logger
- **Storage layer** — Local filesystem (`rules/`, `uploads/`, `outputs/`)

### Component Responsibilities

| Component | Responsibility |
|-----------|---------------|
| `main.py` | HTTP routing, input validation (5 guards), error mapping, file cleanup |
| `crew.py` | Pipeline orchestration, caching, truncation, task output validation |
| `agents/ingest_agent.py` | Label raw text blocks with structural type markers |
| `agents/parse_agent.py` | Extract structured `paper_structure` JSON from labelled content |
| `agents/interpret_agent.py` | Load and return journal rules JSON |
| `agents/transform_agent.py` | Compare paper vs rules, produce `docx_instructions` |
| `agents/validate_agent.py` | Run 7 compliance checks, score 0-100, return `compliance_report` |
| `tools/docx_writer.py` | Write formatted DOCX from `docx_instructions` |
| `tools/rule_loader.py` | Load and cache `rules/*.json` files |
| `tools/pdf_reader.py` | Extract text from PDF via PyMuPDF |
| `tools/docx_reader.py` | Extract text from DOCX via python-docx |

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Frontend | React | 18.3.1 | UI component library |
| Frontend | Vite | 7.3.1 | Dev server + build tool + proxy |
| Frontend | TailwindCSS | 3.4.3 | Utility-first dark-theme styling |
| Frontend | Axios | 1.7.2 | HTTP client with proxy support |
| Frontend | Lucide React | 0.378.0 | Icon library |
| Backend | Python | 3.11+ | Primary backend language |
| Backend | FastAPI | 0.111.0 | Async HTTP API framework |
| Backend | Uvicorn | 0.29.0 | ASGI server |
| AI Orchestration | CrewAI | >=0.36.0 | Multi-agent pipeline framework |
| AI Model | Google Gemini | 2.5-flash | LLM for all 5 agents |
| Document Processing | PyMuPDF (fitz) | 1.24.0 | PDF text extraction |
| Document Processing | python-docx | 1.1.0 | DOCX read and write |
| Validation | jsonschema | >=4.0.0 | JSON schema validation |
| Config | python-dotenv | >=1.0.0 | Environment variable management |

---

## Directory Structure

```
HACKa-MINed/
│
├── backend/                        # FastAPI + CrewAI backend
│   ├── agents/                     # 5 CrewAI agent definitions
│   │   ├── __init__.py             # Exports all 5 create_*_agent() factories
│   │   ├── ingest_agent.py         # Agent 1: Content labelling
│   │   ├── parse_agent.py          # Agent 2: Structure extraction
│   │   ├── interpret_agent.py      # Agent 3: Rule loading
│   │   ├── transform_agent.py      # Agent 4: Formatting application
│   │   └── validate_agent.py       # Agent 5: Compliance scoring
│   │
│   ├── engine/                     # Formatting engine utilities
│   │   └── format_engine.py        # Document formatting helpers
│   │
│   ├── tools/                      # Shared utility tools
│   │   ├── pdf_reader.py           # PDF text extraction (PyMuPDF)
│   │   ├── docx_reader.py          # DOCX text extraction (python-docx)
│   │   ├── docx_writer.py          # Formatted DOCX generation
│   │   ├── rule_loader.py          # Journal rules JSON loader + JOURNAL_MAP
│   │   ├── logger.py               # Structured logger factory (get_logger)
│   │   └── tool_errors.py          # Custom exception hierarchy
│   │
│   ├── rules/                      # Journal formatting rules (JSON)
│   │   ├── apa7.json               # APA 7th Edition rules
│   │   ├── ieee.json               # IEEE rules
│   │   ├── vancouver.json          # Vancouver rules
│   │   ├── springer.json           # Springer rules
│   │   └── chicago.json            # Chicago 17th Edition rules
│   │
│   ├── outputs/                    # Generated DOCX files (auto-cleaned after 6h)
│   ├── uploads/                    # Temp upload files (deleted after processing)
│   ├── crew.py                     # Pipeline orchestration + caching
│   ├── main.py                     # FastAPI app, endpoints, validation
│   ├── requirements.txt            # Python dependencies
│   ├── .env                        # Runtime secrets (not committed)
│   └── .env.example                # Template for environment setup
│
├── frontend/                       # React 18 + Vite frontend
│   ├── src/
│   │   ├── components/             # UI components
│   │   │   ├── Upload.jsx          # File + journal selector form
│   │   │   ├── ProcessingLoader.jsx # 5-step pipeline progress UI
│   │   │   ├── ComplianceScore.jsx  # Score dashboard with animated bars
│   │   │   ├── ChangesList.jsx      # Applied changes with expand/collapse
│   │   │   └── IMRADCheck.jsx       # IMRAD structure status pills
│   │   ├── App.jsx                  # Root: 4-state machine + layout
│   │   ├── index.css               # Tailwind base + keyframes + utilities
│   │   └── main.jsx                # React DOM entry point
│   │
│   ├── public/                     # Static assets
│   ├── package.json                # Node dependencies
│   ├── vite.config.js              # Vite + proxy configuration
│   ├── tailwind.config.js          # Tailwind theme config
│   └── postcss.config.js           # PostCSS config
│
├── .github/
│   └── agents/                     # Claude Code agent instruction files
│       ├── UNIVERSAL_AGENT.md
│       ├── PROJECT_ARCHITECTURE.md
│       ├── AI_AGENT.md
│       └── Full-Stack Agents/
│           ├── api-agent.md
│           ├── ui-ux-agent.md
│           ├── test-agent.md
│           └── docs-agent.md
│
├── Prompts/                        # Step-by-step build prompts (hackathon docs)
├── tasks/                          # Claude Code task tracking
├── .claude/CLAUDE.md               # Claude Code behavioral config
└── README.md                       # This file
```

---

## Application Workflow

### End-to-End Flow

```mermaid
sequenceDiagram
    actor User
    participant UI as React SPA
    participant Proxy as Vite Proxy
    participant API as FastAPI /format
    participant Crew as crew.run_pipeline()
    participant A1 as Ingest Agent
    participant A2 as Parse Agent
    participant A3 as Interpret Agent
    participant A4 as Transform Agent
    participant A5 as Validate Agent
    participant Gemini as Google Gemini
    participant FS as Filesystem

    User->>UI: Upload PDF/DOCX + select journal
    UI->>Proxy: POST /format (multipart)
    Proxy->>API: Forward request

    Note over API: Validate: ext, journal, size, text length, alpha ratio

    API->>FS: Save temp upload file
    API->>API: Extract text (PDF/DOCX)
    API->>Crew: run_pipeline(text, journal)

    Note over Crew: Check pipeline cache (SHA-256)

    Crew->>A1: INGEST task
    A1->>Gemini: Label content blocks
    Gemini-->>A1: Labelled content
    A1-->>Crew: Task output

    Crew->>A2: PARSE task (context: ingest)
    A2->>Gemini: Extract paper_structure JSON
    Gemini-->>A2: paper_structure
    A2-->>Crew: Task output

    Crew->>A3: INTERPRET task
    A3->>Gemini: Return journal rules
    Gemini-->>A3: rules JSON
    A3-->>Crew: Task output

    Crew->>A4: TRANSFORM task (context: parse + interpret)
    A4->>Gemini: Compare + produce docx_instructions
    Gemini-->>A4: docx_instructions JSON
    A4-->>Crew: Task output

    Crew->>A5: VALIDATE task (context: transform + interpret)
    A5->>Gemini: 7 compliance checks + score
    Gemini-->>A5: compliance_report JSON
    A5-->>Crew: Task output

    Crew->>FS: Write formatted DOCX
    Crew-->>API: {compliance_report, docx_filename, metrics}

    API->>FS: Delete temp upload
    API-->>Proxy: 200 JSON response
    Proxy-->>UI: Response data

    UI->>User: Show compliance score + download button
    User->>UI: Click Download
    UI->>Proxy: GET /download/:filename
    Proxy->>API: Forward
    API->>FS: Read DOCX file
    API-->>UI: FileResponse (DOCX)
    UI->>User: Browser downloads file
```

---

## UML Diagrams

### Use Case Diagram

```mermaid
graph TB
    subgraph Actors
        R["Researcher / User"]
        Admin["System Admin"]
    end

    subgraph "Agent Paperpal System"
        UC1["Upload Research Paper"]
        UC2["Select Journal Style"]
        UC3["Monitor Processing Progress"]
        UC4["Download Formatted DOCX"]
        UC5["View Compliance Score"]
        UC6["View IMRAD Structure Check"]
        UC7["View Applied Changes"]
        UC8["View Recommendations"]
        UC9["Retry on Error"]
        UC10["Format Another Paper"]
        UC11["Check System Health"]
        UC12["Manage Output Files"]
    end

    R --> UC1
    R --> UC2
    R --> UC3
    R --> UC4
    R --> UC5
    R --> UC6
    R --> UC7
    R --> UC8
    R --> UC9
    R --> UC10
    Admin --> UC11
    Admin --> UC12
```

### Class Diagram

```mermaid
classDiagram
    class FastAPIApp {
        +health() dict
        +format_document(file, journal) JSONResponse
        +download_file(filename) FileResponse
        -_cleanup_old_outputs(hours)
        -_sanitize_filename(filename)
        -_get_extension(filename)
    }

    class Pipeline {
        +run_pipeline(paper_content, journal_style) dict
        -_truncate_paper(content) str
        -_hash_content(paper_text, journal) str
        -_validate_task_outputs(crew)
        -_parse_compliance_report(raw) dict
        -_write_docx_from_transform(raw, rules) str
        -PIPELINE_CACHE dict
    }

    class IngestAgent {
        +role: str
        +goal: str
        +backstory: str
        +llm: str
        +_validate_ingest_output(output)
        +_safe_context()
    }

    class ParseAgent {
        +role: str
        +goal: str
        +backstory: str
        +_validate_parse_output(output)
        +_safe_context()
    }

    class InterpretAgent {
        +role: str
        +_RULE_ENGINE_CACHE dict
        +_validate_interpret_output(output)
        +_safe_context()
    }

    class TransformAgent {
        +CANONICAL_SECTION_ORDER list
        +_normalize_citation(citation) str
        +_sort_sections_by_canonical_order(sections) list
        +_validate_transform_output(output)
        +_safe_context()
    }

    class ValidateAgent {
        +SECTION_WEIGHTS dict
        +_clamp_score(score) int
        +_recompute_overall_score(breakdown) int
        +_validate_validate_output(output)
        +_safe_context()
    }

    class ComplianceReport {
        +overall_score: int
        +submission_ready: bool
        +breakdown: dict
        +changes_made: list
        +imrad_check: dict
        +citation_consistency: dict
        +warnings: list
        +recommendations: list
    }

    class JournalRules {
        +document: dict
        +abstract: dict
        +headings: dict
        +citations: dict
        +references: dict
        +figures: dict
        +tables: dict
    }

    FastAPIApp --> Pipeline : calls
    Pipeline --> IngestAgent : creates
    Pipeline --> ParseAgent : creates
    Pipeline --> InterpretAgent : creates
    Pipeline --> TransformAgent : creates
    Pipeline --> ValidateAgent : creates
    Pipeline --> ComplianceReport : produces
    InterpretAgent --> JournalRules : loads
    TransformAgent --> JournalRules : applies
    ValidateAgent --> ComplianceReport : fills
```

### Sequence Diagram — Error Path

```mermaid
sequenceDiagram
    actor User
    participant UI as React SPA
    participant API as FastAPI

    User->>UI: Upload scanned PDF
    UI->>API: POST /format
    API->>API: Extract text → 45 chars
    Note over API: len(text) < 100 → reject
    API-->>UI: HTTP 422 {error, step: "extraction"}
    UI->>UI: setAppState("error")
    UI->>User: Show ErrorDisplay with message + "Try Again"
    User->>UI: Click "Try Again"
    UI->>UI: handleReset() → idle state
```

### Activity Diagram — Pipeline

```mermaid
flowchart TD
    Start([User Submits File]) --> V1{Valid extension?}
    V1 -->|No| E1[Return 422 — bad extension]
    V1 -->|Yes| V2{Valid journal?}
    V2 -->|No| E2[Return 422 — unknown journal]
    V2 -->|Yes| V3{File <= 10 MB?}
    V3 -->|No| E3[Return 413 — file too large]
    V3 -->|Yes| Extract[Extract text from PDF/DOCX]
    Extract --> V4{Text >= 100 chars?}
    V4 -->|No| E4[Return 422 — no readable text]
    V4 -->|Yes| V5{Alpha ratio >= 0.3?}
    V5 -->|No| E5[Return 422 — garbled text]
    V5 -->|Yes| Cache{Cache hit?}
    Cache -->|Yes| CacheHit[Return cached result]
    Cache -->|No| Truncate[Truncate if > 32K chars]
    Truncate --> A1[INGEST: Label content blocks]
    A1 --> A2[PARSE: Extract paper_structure]
    A2 --> A3[INTERPRET: Load journal rules]
    A3 --> A4[TRANSFORM: Apply formatting]
    A4 --> A5[VALIDATE: Score compliance]
    A5 --> DOCX[Write formatted DOCX]
    DOCX --> Cache2[Store in pipeline cache]
    Cache2 --> Response[Return JSON + download URL]
    CacheHit --> Response
    Response --> End([User Downloads DOCX])

    style E1 fill:#7f1d1d,color:#fca5a5
    style E2 fill:#7f1d1d,color:#fca5a5
    style E3 fill:#7f1d1d,color:#fca5a5
    style E4 fill:#7f1d1d,color:#fca5a5
    style E5 fill:#7f1d1d,color:#fca5a5
    style CacheHit fill:#14532d,color:#86efac
```

### Component Diagram

```mermaid
graph TB
    subgraph "Frontend (React + Vite)"
        App["App.jsx\n4-state machine"]
        Upload["Upload.jsx\nFile + journal selector"]
        Loader["ProcessingLoader.jsx\n5-step progress"]
        Score["ComplianceScore.jsx\n7-section dashboard"]
        Changes["ChangesList.jsx\nApplied fixes list"]
        IMRAD["IMRADCheck.jsx\nStructure pills"]
    end

    subgraph "Backend (FastAPI)"
        Main["main.py\nAPI endpoints"]
        Crew["crew.py\nPipeline orchestration"]
        Agents["agents/\n5 CrewAI agents"]
        Tools["tools/\npdf_reader, docx_writer..."]
        Rules["rules/\n*.json rule files"]
    end

    App --> Upload
    App --> Loader
    App --> Score
    App --> Changes
    App --> IMRAD
    App -->|"HTTP via Vite proxy"| Main
    Main --> Crew
    Crew --> Agents
    Agents --> Tools
    Agents -->|"LLM calls"| Gemini["Google Gemini API"]
    Tools --> Rules
```

---

## API Documentation

### GET /health

Health check — returns system status and supported journals.

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `/health` |
| Auth | None |

**Response 200:**
```json
{
  "status": "ok",
  "version": "1.0.0",
  "service": "Agent Paperpal",
  "supported_journals": ["APA 7th Edition", "IEEE", "Vancouver", "Springer", "Chicago 17th Edition"],
  "max_file_size_mb": 10,
  "system_info": {
    "python_version": "3.11.0",
    "crewai_version": "0.36.0",
    "api_uptime_seconds": 142.3
  },
  "diagnostics": {
    "rules_folder_exists": true,
    "outputs_folder_writable": true
  }
}
```

---

### POST /format

Upload a research paper and format it.

| Field | Value |
|-------|-------|
| Method | `POST` |
| URL | `/format` |
| Content-Type | `multipart/form-data` |
| Auth | None |

**Request Body (multipart):**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | Yes | PDF or DOCX, max 10 MB |
| `journal` | String | Yes | One of the supported journal names |

**Response 200:**
```json
{
  "success": true,
  "request_id": "3193503d",
  "download_url": "/download/formatted_3193503d.docx",
  "compliance_report": {
    "overall_score": 84,
    "submission_ready": true,
    "breakdown": {
      "document_format": { "score": 90, "issues": [] },
      "abstract":        { "score": 75, "issues": ["Word count 312 exceeds 250 limit"] },
      "headings":        { "score": 95, "issues": [] },
      "citations":       { "score": 80, "issues": ["2 in-text citations use wrong format"] },
      "references":      { "score": 85, "issues": [] },
      "figures":         { "score": 100, "issues": [] },
      "tables":          { "score": 70, "issues": ["Table 2 missing title"] }
    },
    "changes_made": ["Reformatted 14 in-text citations to APA style", "..."],
    "imrad_check": {
      "introduction": true,
      "methods": true,
      "results": true,
      "discussion": false
    },
    "citation_consistency": {
      "orphan_citations": [],
      "uncited_references": ["Smith et al. 2019"]
    },
    "warnings": ["3 references older than 10 years"],
    "recommendations": ["Add a Discussion section to complete IMRAD structure"]
  },
  "changes_made": ["Reformatted 14 in-text citations to APA style"],
  "processing_time_seconds": 47.3,
  "output_metadata": { "filename": "formatted_3193503d.docx", "size_bytes": 24576, "size_kb": 24.0 },
  "pipeline_metrics": {
    "stage_times": { "ingest": 9.2, "parse": 11.4, "interpret": 1.8, "transform": 14.6, "validate": 10.1 },
    "total_runtime": 47.3
  }
}
```

**Error Responses:**

| Status | Code | When |
|--------|------|------|
| 413 | — | File > 10 MB |
| 422 | `validation` | Bad extension, unknown journal, no readable text |
| 422 | `extraction` | Extracted text too short or garbled |
| 422 | `llm` | Gemini returned unparseable response |
| 422 | `transform` | Transform agent failed to produce docx_instructions |
| 500 | — | Unexpected server error |

---

### GET /download/{filename}

Download a formatted DOCX file.

| Field | Value |
|-------|-------|
| Method | `GET` |
| URL | `/download/{filename}` |
| Auth | None |

**Path Parameters:**

| Parameter | Description |
|-----------|-------------|
| `filename` | Exact filename returned in `download_url` from `/format` |

**Response 200:** Binary DOCX file stream

**Security:** Regex validates filename (`^[a-zA-Z0-9_\-\.]+$`), only `.docx` served, path confined to `outputs/` directory.

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+ (for frontend)
- Google Gemini API key (free tier available at [Google AI Studio](https://aistudio.google.com))

### 1. Clone the Repository

```bash
git clone <repo-url>
cd HACKa-MINed
```

### 2. Set Up the Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your-key-here
```

### 3. Set Up the Frontend

```bash
cd ../frontend
npm install
```

### 4. Start Both Services

**Terminal 1 — Backend:**
```bash
cd backend
source venv/bin/activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Visit **http://localhost:5173** in your browser.

---

## Environment Variables

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `GEMINI_API_KEY` | Yes | Google Gemini API key | `AIzaSy...` |
| `GOOGLE_API_KEY` | Yes | Same as above (LiteLLM alias) | `AIzaSy...` |
| `GEMINI_MODEL` | No | Gemini model name | `gemini-2.5-flash` |
| `CORS_ORIGINS` | No | Comma-separated allowed origins | `http://localhost:5173` |
| `BACKEND_HOST` | No | Uvicorn bind host | `0.0.0.0` |
| `BACKEND_PORT` | No | Uvicorn bind port | `8000` |
| `LLM_TIMEOUT` | No | LLM call timeout seconds | `60` |
| `LLM_MAX_RETRIES` | No | LLM retry count | `3` |

---

## Running the Project

### Development

```bash
# Backend (hot-reload)
cd backend && uvicorn main:app --reload --port 8000

# Frontend (HMR dev server)
cd frontend && npm run dev
```

### Production Build (Frontend)

```bash
cd frontend
npm run build       # outputs to frontend/dist/
npm run preview     # preview the production build locally
```

### Production Backend

```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

---

## Security Considerations

| Concern | Mitigation |
|---------|-----------|
| Path traversal in downloads | Filename regex `^[a-zA-Z0-9_\-\.]+$` + path prefix check |
| File type spoofing | Extension whitelist (`pdf`, `docx`) + content length check |
| Oversized uploads | Hard 10 MB limit enforced before text extraction |
| Garbled/scanned PDFs | Alpha-character ratio guard (>=0.3) rejects image-only PDFs |
| Unsafe filenames | `re.sub(r"[^a-zA-Z0-9._\-]", "_", filename)` before disk write |
| Stack trace leaks | Global FastAPI exception handler returns generic messages |
| API key exposure | All secrets in `.env`, never committed |
| CORS | Configurable `CORS_ORIGINS` env var, defaults to localhost only |
| Temp file cleanup | Upload files deleted in `finally` block regardless of success/failure |
| Stale output cleanup | Files older than 6 hours auto-deleted on startup |

---

## Performance Optimizations

| Optimization | Implementation |
|-------------|---------------|
| Pipeline caching | SHA-256 keyed in-memory dict — identical (paper + journal) submissions return instantly |
| Context truncation | Papers >32K chars are trimmed to first 24K + last 8K chars (preserves references) |
| Step timing | `_StepTimer` logs wall-clock per stage for performance analysis |
| No request timeout | `FORMAT_TIMEOUT_MS = 0` and Vite proxy `timeout: 0` — never kills in-flight requests |
| Stale file cleanup | Auto-cleanup on startup, not per-request |
| Rule caching | `InterpretAgent._RULE_ENGINE_CACHE` caches loaded rule files in memory |
| Animated skeleton UI | Compliance score shows skeleton rows during loading, not empty state |

---

## Future Roadmap

- [ ] Support additional journal styles (Nature, Elsevier, ACS, PLOS)
- [ ] Asynchronous processing with job queue (Celery + Redis) for concurrent users
- [ ] WebSocket progress updates from backend pipeline to frontend
- [ ] PDF output generation (in addition to DOCX)
- [ ] Persistent results storage (PostgreSQL) with 7-day retention
- [ ] User accounts and submission history
- [ ] Batch processing — format multiple papers in one session
- [ ] Side-by-side diff view — original vs formatted document
- [ ] Citation style migration (e.g., APA → IEEE conversion)
- [ ] Docker Compose deployment for one-command setup

---

## Contributing

### Branch Strategy

```
main          ← stable, production-ready
  └── develop ← integration branch
        └── feat/*, fix/*, docs/* ← feature branches
```

### Steps

1. Fork the repository
2. Create a branch from `develop`: `git checkout -b feat/your-feature`
3. Make changes following the code style in existing files
4. Commit using conventional commits: `feat(scope): description`
5. Push and open a PR targeting `develop`

### Commit Message Format

```
<type>(<scope>): <short description>

Types: feat | fix | docs | style | refactor | test | chore | security | ux
```

### Code Quality

- Backend: `mypy` for type checking, `python -m pytest` for tests
- Frontend: No TypeScript `any`, Lucide icons only (no emojis in JSX), Tailwind dark tokens only

---

## License

MIT License — see `LICENSE` file for details.

---

## Authors

Built for **HackaMined 2026** — Cactus Communications / Paperpal by Editage Track.

| Role | Contribution |
|------|-------------|
| Full-Stack Development | React SPA, FastAPI backend, CrewAI pipeline |
| AI/ML Engineering | 5-agent architecture, Gemini integration, prompt engineering |
| System Design | Layered architecture, caching strategy, error hierarchy |

---

*Agent Paperpal — Format once, submit with confidence.*
