# AI Compliance Tool

Upload an AI system's procurement document and get a gap report showing where it
falls short of UK and EU AI rules.

A set of agents reads the document, each checks it against one framework, and a
final agent combines their findings into a single score and a priority action
list. You can watch the agents work as they go, and download the result as a PDF.

Module 2 of the AI Governance Hub. Module 1 is the
[UK AI Policy Tracker](https://uk-ai-policy-tracker-next.vercel.app/). Together they cover
policy discovery, then compliance evaluation.

## Frameworks checked

| Framework | Focus | Key checks |
| --- | --- | --- |
| UK ICO | Data protection and AI principles | Safety, fairness, accountability, contestability, data minimisation |
| EU AI Act | Risk-based AI regulation | Risk tier, and the provider obligations in Articles 8–17 if high-risk |
| UK DPA / GDPR | Personal data in AI | Automated decisions (Art 22), transparency (Art 13/14), DPIA (Art 35) |
| ISO/IEC 42001 | AI management systems | Governance, risk management, data lifecycle, monitoring |

## Running it

You need Python 3.10+ and a Perplexity API key.

```bash
git clone https://github.com/Boakye-20/ai-compliance-tool.git
cd ai-compliance-tool

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env              # add your PPLX_API_KEY
streamlit run app.py
```

Then: pick your frameworks (defaults to UK ICO + DPA), upload a PDF, click
**Run Compliance Agents**, and download the report when it finishes.

## How it works

```
Upload PDF
    ↓
Extractor      parses the PDF and pulls out use case, data types,
               oversight mechanisms and risk indicators
    ↓
Router         decides which framework agents to run
    ↓
ICO · EU Act · DPA · ISO        each checks its own framework
    ↓
Synthesiser    scores the result, finds issues that break more than one
               framework, and ranks what to fix first
    ↓
Reporter       generates the PDF
```

Built with LangGraph for the agent workflow, Perplexity Sonar as the model,
Streamlit for the interface, and pdfplumber + reportlab for reading and writing PDFs.

## The UK Alignment Score

```
Score = (ICO × 0.4) + (DPA × 0.3) + (ISO × 0.2) + (EU AI Act × 0.1)
```

The UK has no dedicated AI Act yet (the first Bill is delayed to H2 2026), so
UK governance currently rests on ICO principles, the DPA and GDPR for data, and
ISO standards. The weighting reflects that, which is why the EU AI Act counts for
least here despite being the most detailed instrument.

Read the score as: 80–100% strong, 60–79% moderate, 40–59% weak, below 40%
critical gaps.

## Who it's for

Procurement teams auditing a vendor's AI before buying, compliance officers
checking systems already deployed, consultancies producing client reports, and
startups self-assessing before they talk to the FCA or ICO.

## Project layout

```
app.py              Streamlit app
graph.py            LangGraph workflow
agents/             One module per agent (extractor, router, the four
                    framework agents, synthesiser, reporter)
prompts/            The prompt for each framework agent
styles/custom.css   Styling
```

## Deploying

On [Streamlit Cloud](https://streamlit.io/cloud): connect the repo, set the main
file to `app.py`, add `PPLX_API_KEY` as a secret, deploy.

## Roadmap

- NIST AI RMF module
- Sector-specific rules (FCA, MHRA)
- Batch document processing
- API access

## Licence

MIT. Author: Paul Kwarteng ([@Boakye-20](https://github.com/Boakye-20)).
