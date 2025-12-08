from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from typing import List, Dict, Any
from uuid import uuid4
from datetime import datetime
from io import BytesIO
import tempfile
import os
import base64

from graph import compliance_graph, ComplianceState  # type: ignore

app = FastAPI(title="AI Compliance Tool API")

# Allow cross-origin requests so Next.js frontend can call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory store for analysis results and reports
analysis_store: Dict[str, Dict[str, Any]] = {}


@app.get("/health")
def health() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "ok"}


@app.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    frameworks: List[str] = Form(...),
) -> Dict[str, Any]:
    """Run the full compliance analysis pipeline on an uploaded PDF.

    This wraps the existing LangGraph `compliance_graph` and returns the
    same state structure that the Streamlit app uses, plus a job_id.
    """

    if not frameworks:
        raise HTTPException(status_code=400, detail="At least one framework must be selected.")

    # Persist uploaded PDF to a temp file for the extractor
    suffix = os.path.splitext(file.filename or "")[1] or ".pdf"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        tmp_path = tmp.name
        content = await file.read()
        tmp.write(content)

    try:
        # Initial graph state mirrors the Streamlit app's `initial_state`
        initial_state: ComplianceState = {
            "pdf_path": tmp_path,
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

        final_state: Dict[str, Any] | None = None

        # Stream through the LangGraph workflow and capture the last state
        for event in compliance_graph.stream(initial_state):
            for _, node_state in event.items():
                if isinstance(node_state, dict):
                    final_state = node_state

        if final_state is None:
            raise HTTPException(status_code=500, detail="Analysis did not produce a result.")

        # Create a job id and store the result + PDF report bytes
        job_id = str(uuid4())
        report_bytes = final_state.get("report_bytes") or b""

        state_copy = dict(final_state)
        # Do not ship raw bytes in the JSON analysis object
        state_copy["report_bytes"] = None

        analysis_store[job_id] = {
            "state": state_copy,
            "report_bytes": report_bytes,
            "created_at": datetime.utcnow().isoformat(),
        }

        # Optional: include base64-encoded report in the response
        report_b64 = base64.b64encode(report_bytes).decode("ascii") if report_bytes else None

        return {
            "job_id": job_id,
            "analysis": state_copy,
            "report_base64": report_b64,
        }
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass


@app.get("/report/{job_id}")
def get_report(job_id: str):
    """Download the generated PDF report for a completed analysis."""
    item = analysis_store.get(job_id)
    if not item or not item.get("report_bytes"):
        raise HTTPException(status_code=404, detail="Report not found")

    pdf_bytes: bytes = item["report_bytes"]

    return StreamingResponse(
        BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="compliance_report_{job_id}.pdf"',
        },
    )
