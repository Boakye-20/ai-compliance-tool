# AI Compliance — Local Extraction Client

A lightweight command-line client that runs the **entire compliance pipeline
locally** (PDF extraction → framework agents → scoring) and transmits **only the
structured results** to your compliance API. The raw document text never leaves
the machine — the moat for public-sector and enterprise risk teams with strict
data-residency requirements.

## How it works

```
  PDF (local)
     │  pdfplumber + Perplexity (your key)   ← runs on YOUR machine
     ▼
  Structured results (scores, clauses, gaps, BOM metadata)
     │  HTTPS POST, no raw text               ← only this leaves the machine
     ▼
  /api/ingest  →  UK Alignment Score + persisted audit
```

Because the LangGraph pipeline (`graph.py` + `agents/`) runs on the runner, you
need Python and a Perplexity API key locally. Only the structured JSON payload
(see [`payload_schema.json`](./payload_schema.json)) is transmitted.

## Install

```bash
pip install -r cli/requirements.txt
export PPLX_API_KEY=pplx-...        # used locally for extraction + analysis
```

## Usage

Local preview — extract & score locally, print the payload, transmit nothing:

```bash
python cli/compliance_extract.py sample.pdf --dry-run
```

Submit for scoring & persistence:

```bash
python cli/compliance_extract.py docs/dpia/system-dpia.pdf \
    --api-url https://your-app.vercel.app \
    --api-key "$COMPLIANCE_API_KEY" \
    --output score.json
```

### Options

| Flag | Description |
|------|-------------|
| `--frameworks` | Comma-separated subset (default all): `ICO,DPA,EU_AI_ACT,ISO_42001` |
| `--api-url` | Base URL of the compliance app (or `COMPLIANCE_API_URL`) |
| `--api-key` | Key for `/api/ingest` (or `COMPLIANCE_API_KEY`) |
| `--output` | Write the response (or payload with `--dry-run`) to a file |
| `--dry-run` | Run locally and print the payload without transmitting |
| `--strip-evidence` | Strict mode — remove all quoted document excerpts before sending |

## Data residency notes

- `extracted_data.full_text` (the raw document dump) is **always** stripped before transmission.
- `raw_response` fields from the model are stripped.
- `--strip-evidence` additionally removes `evidence_found` quotes for maximum privacy
  (scores are unaffected; the UI simply won't show supporting excerpts).

## CI/CD

This client is the engine behind the `compliance-audit.yml` GitHub Actions
workflow (see the Integrations tab in the app). The workflow runs it on each
relevant change, parses `analysis.synthesis.uk_alignment_score` from the
response, and fails the build if the score drops below your threshold.
