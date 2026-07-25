#!/usr/bin/env python3
"""
AI Compliance — Local Extraction Client (true data residency)

Runs the full compliance pipeline (extraction + framework agents + synthesis)
LOCALLY using your own Perplexity key, then transmits ONLY the structured
results to the compliance API. The raw document text never leaves this machine.

Typical use in CI/CD:

    python cli/compliance_extract.py docs/dpia/system-dpia.pdf \
        --api-url "$COMPLIANCE_API_URL" \
        --api-key "$COMPLIANCE_API_KEY" \
        --output score.json

Local preview (no transmission, no scoring call):

    python cli/compliance_extract.py sample.pdf --dry-run
"""
import argparse
import json
import os
import sys

# Make the repo root importable so `graph` / `agents` resolve when run from anywhere.
REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if REPO_ROOT not in sys.path:
    sys.path.insert(0, REPO_ROOT)

ALL_FRAMEWORKS = ["ICO", "DPA", "EU_AI_ACT", "ISO_42001"]


def build_payload(state: dict, frameworks: list, strip_evidence: bool, source: str = 'ingest') -> dict:
    """Assemble the residency-safe payload: structured results only, no raw text."""
    extracted = dict(state.get("extracted_data") or {})
    extracted.pop("full_text", None)  # never transmit the raw document dump

    def clean_result(result):
        if not result:
            return None
        result = dict(result)
        result.pop("full_text", None)
        result.pop("raw_response", None)  # may echo document text
        if strip_evidence:
            # Strict metadata-only: remove quoted excerpts from every clause.
            for key, value in list(result.items()):
                if isinstance(value, dict) and "evidence_found" in value:
                    value = dict(value)
                    value["evidence_found"] = []
                    result[key] = value
            for holder in ("obligations_if_high_risk",):
                if isinstance(result.get(holder), dict):
                    obligations = {}
                    for k, v in result[holder].items():
                        v = dict(v)
                        v["evidence_found"] = []
                        obligations[k] = v
                    result[holder] = obligations
        return result

    return {
        "source": source,
        "extracted_data": extracted,
        "ico_result": clean_result(state.get("ico_result")),
        "dpa_result": clean_result(state.get("dpa_result")),
        "eu_act_result": clean_result(state.get("eu_act_result")),
        "iso_result": clean_result(state.get("iso_result")),
        "frameworks": frameworks,
        "status_messages": state.get("status_messages", []),
    }


def run_pipeline(pdf_path: str, frameworks: list) -> dict:
    """Run the local LangGraph compliance pipeline and return the final state."""
    from graph import compliance_graph  # imported lazily so --help works without deps

    initial_state = {
        "pdf_path": pdf_path,
        "extracted_data": {},
        "selected_frameworks": frameworks,
        "ico_result": None,
        "eu_act_result": None,
        "dpa_result": None,
        "iso_result": None,
        "synthesis": {},
        "report_bytes": b"",
        "status_messages": [],
    }
    return compliance_graph.invoke(initial_state)


def transmit(payload: dict, api_url: str, api_key: str) -> dict:
    import requests

    url = api_url.rstrip("/") + "/api/ingest"
    headers = {"Content-Type": "application/json"}
    if api_key:
        headers["Authorization"] = f"Bearer {api_key}"
    resp = requests.post(url, json=payload, headers=headers, timeout=60)
    resp.raise_for_status()
    return resp.json()


def main():
    parser = argparse.ArgumentParser(description="Local AI compliance extraction client (data residency).")
    parser.add_argument("pdf", help="Path to the PDF document (DPIA, system spec, etc.)")
    parser.add_argument("--frameworks", default=",".join(ALL_FRAMEWORKS),
                        help="Comma-separated frameworks (default: all). One or more of: " + ", ".join(ALL_FRAMEWORKS))
    parser.add_argument("--api-url", default=os.environ.get("COMPLIANCE_API_URL", ""),
                        help="Base URL of the compliance app (e.g. https://your-app.vercel.app)")
    parser.add_argument("--api-key", default=os.environ.get("COMPLIANCE_API_KEY", ""),
                        help="API key for the /api/ingest endpoint")
    parser.add_argument("--output", help="Write the API response (or payload in --dry-run) to this file")
    parser.add_argument("--dry-run", action="store_true",
                        help="Run extraction locally and print the payload WITHOUT transmitting it")
    parser.add_argument("--strip-evidence", action="store_true",
                        help="Strict mode: remove all quoted document excerpts before transmission")
    parser.add_argument("--source", choices=["ingest", "ci"], default="ingest",
                        help="Source tag for the audit log entry (default: ingest)")
    args = parser.parse_args()

    if not os.path.isfile(args.pdf):
        parser.error(f"File not found: {args.pdf}")

    frameworks = [f.strip().upper() for f in args.frameworks.split(",") if f.strip()]
    invalid = [f for f in frameworks if f not in ALL_FRAMEWORKS]
    if invalid:
        parser.error(f"Unknown framework(s): {', '.join(invalid)}")

    print(f"Running local compliance pipeline on {args.pdf} ...", file=sys.stderr)
    state = run_pipeline(args.pdf, frameworks)
    payload = build_payload(state, frameworks, args.strip_evidence, args.source)

    if args.dry_run:
        out = json.dumps(payload, indent=2, default=str)
        if args.output:
            with open(args.output, "w", encoding="utf-8") as fh:
                fh.write(out)
            print(f"Payload written to {args.output}", file=sys.stderr)
        else:
            print(out)
        return

    if not args.api_url:
        parser.error("--api-url (or COMPLIANCE_API_URL) is required unless --dry-run is set")

    print(f"Transmitting structured results to {args.api_url} (raw text stays local) ...", file=sys.stderr)
    result = transmit(payload, args.api_url, args.api_key)

    score = (result.get("analysis", {}).get("synthesis", {}) or {}).get("uk_alignment_score")
    print(f"UK Alignment Score: {score}", file=sys.stderr)

    out = json.dumps(result, indent=2, default=str)
    if args.output:
        with open(args.output, "w", encoding="utf-8") as fh:
            fh.write(out)
        print(f"Response written to {args.output}", file=sys.stderr)
    else:
        print(out)


if __name__ == "__main__":
    main()
