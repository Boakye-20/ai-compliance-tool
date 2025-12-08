# 🤖 AI Governance Hub - AI Compliance Tool

**Module 2** of the AI Governance Hub: AI compliance tool for UK and EU AI frameworks.

[![View Policy Tracker](https://img.shields.io/badge/Module_1-Policy_Tracker-0ea5e9)](https://uk-ai-policy-tracker-next.vercel.app/)
[![Streamlit](https://img.shields.io/badge/Built_with-Streamlit-FF4B4B)]()
[![LangGraph](https://img.shields.io/badge/Powered_by-LangGraph-green)]()
[![Perplexity](https://img.shields.io/badge/AI-Perplexity_Sonar-purple)]()

## 🎯 What It Does

Upload an AI system procurement document → Specialized compliance agents analyze it across multiple frameworks → Get a comprehensive gap report with UK Alignment Score.

### Key Features

- **Multi-Agent Analysis**: Specialized agents for UK ICO, EU AI Act, DPA/GDPR, and ISO 42001
- **UK Alignment Score**: Weighted composite metric prioritizing UK frameworks (ICO 40%, DPA 30%, ISO 20%, EU 10%)
- **Cross-Framework Gap Detection**: Identifies issues that violate multiple regulations
- **Live Agent Traces**: Watch agents "think" through compliance checks in real-time
- **PDF Reports**: Professional compliance reports with suite branding

## 🏗️ Architecture

```
User uploads PDF
       ↓
[Supervisor Agent]
       ↓
[Extractor Agent] → Structures document data
       ↓
[Framework Router] → Routes to relevant agents
       ↓
[ICO Agent] [EU Act Agent] [DPA Agent] [ISO Agent]
       ↓
[Gap Synthesizer] → Cross-framework analysis
       ↓
[Reporter] → PDF generation
```

### Tech Stack

- **Orchestration**: LangGraph (multi-agent workflow)
- **LLM**: Perplexity Sonar (large for analysis, small for extraction)
- **UI**: Streamlit with custom design system
- **PDF**: pdfplumber (parsing), reportlab (generation)

## 🚀 Quick Start

### Prerequisites

```bash
Python 3.10+
Perplexity API key
```

### Installation

```bash
# Clone repo
git clone https://github.com/yourusername/ai-compliance-agents.git
cd ai-compliance-agents

# Create virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set API key
cp .env.example .env
# Edit .env and add your PPLX_API_KEY

# Run app
streamlit run app.py
```

### Usage

1. Select frameworks (defaults to UK ICO + DPA)
2. Upload AI procurement PDF
3. Click "Run Compliance Agents"
4. Watch agents analyze in real-time
5. Download comprehensive PDF report

## 📊 Supported Frameworks

| Framework | Focus | Key Checks |
|-----------|-------|------------|
| **UK ICO** | Data protection + AI principles | Safety, fairness, accountability, contestability, data minimization |
| **EU AI Act** | Risk-based AI regulation | Risk tier classification, high-risk obligations (Articles 8-17) |
| **UK DPA / GDPR** | Personal data in AI | Automated decision-making (Art 22), transparency, DPIA |
| **ISO/IEC 42001** | AI management systems | Governance, risk management, lifecycle controls |

## 🧠 How Agents Work

### Extractor Agent
- Parses PDF with pdfplumber
- Extracts: use case, data types, oversight mechanisms, risk indicators
- Structures data for downstream agents

### ICO Agent
Analyzes against UK's 5 AI principles:
1. Safety, security & robustness
2. Fairness & transparency
3. Accountability & governance
4. Contestability & redress
5. Data minimization & privacy

### EU AI Act Agent
- Classifies risk tier (Prohibited / High-Risk / Limited / Minimal)
- If high-risk: checks 8 provider obligations (Articles 8-17)
- Focuses on biometric systems, critical infrastructure, etc.

### DPA Agent
Checks GDPR/DPA compliance for AI:
- Article 22 (automated decision-making)
- Article 5 (fairness, minimization)
- Article 13/14 (transparency)
- Article 35 (DPIA)

### ISO Agent
Evaluates ISO/IEC 42001 requirements:
- Governance framework
- Risk management
- Data quality & lifecycle
- Monitoring & incident response

### Gap Synthesizer
- Aggregates all agent outputs
- Calculates UK Alignment Score (weighted: ICO 40%, DPA 30%, ISO 20%, EU 10%)
- Detects cross-framework issues (e.g., missing bias testing affects both ICO + EU Act)
- Generates priority action list

## 📈 UK Alignment Score

**Why UK-focused?**

The UK lacks a dedicated AI Act (first Bill delayed to H2 2026). Current governance relies on ICO principles, DPA/GDPR for data, and ISO standards. This score reflects UK's regulatory reality.

**Calculation:**
```
Score = (ICO × 0.4) + (DPA × 0.3) + (ISO × 0.2) + (EU Act × 0.1)
```

**Interpretation:**
- 80-100%: Strong compliance
- 60-79%: Moderate compliance
- 40-59%: Weak compliance
- 0-39%: Critical gaps

## 🎨 Design System

Matches the [UK AI Policy Tracker](https://uk-ai-policy-tracker-next.vercel.app/) visual language:

- **Colors**: Sky blue primary (#0ea5e9), neutral grays
- **Typography**: Inter font family
- **Components**: Clean cards, subtle shadows
- **Icons**: Lucide React style

## 🔗 Hub Integration

This is **Module 2** of the **AI Governance Hub**:

- **Module 1**: [AI Policy Intelligence Tracker](https://uk-ai-policy-tracker-next.vercel.app/) - Monitors UK parliamentary AI activity
- **Module 2**: AI Compliance Tool (this app) - Analyzes AI systems for compliance

Together: **Policy discovery → Compliance evaluation**

## 📝 Example Use Cases

- **Procurement teams**: Audit vendor AI systems before purchase
- **Compliance officers**: Check internal AI deployments
- **Consultancies**: Generate client compliance reports
- **Startups**: Self-assess before FCA/ICO engagement

## 📁 Project Structure

```
ai-compliance-agents/
├── app.py                      # Main Streamlit app
├── graph.py                    # LangGraph workflow
├── agents/
│   ├── __init__.py
│   ├── extractor.py           # PDF extraction agent
│   ├── router.py              # Framework routing
│   ├── ico_agent.py           # UK ICO compliance
│   ├── eu_act_agent.py        # EU AI Act compliance
│   ├── dpa_agent.py           # GDPR/DPA compliance
│   ├── iso_agent.py           # ISO 42001 compliance
│   ├── synthesizer.py         # Gap synthesis
│   └── reporter.py            # Report generation
├── prompts/
│   ├── __init__.py
│   ├── ico_prompt.py
│   ├── eu_act_prompt.py
│   ├── dpa_prompt.py
│   └── iso_prompt.py
├── styles/
│   └── custom.css             # Design system
├── requirements.txt
├── .env.example
├── .streamlit/
│   └── config.toml
└── README.md
```

## 🚀 Deployment

### Streamlit Cloud

1. Push to GitHub
2. Go to [streamlit.io/cloud](https://streamlit.io/cloud)
3. Connect your repo
4. Set main file: `app.py`
5. Add secret: `PPLX_API_KEY`
6. Deploy!

### Local Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8501
CMD ["streamlit", "run", "app.py", "--server.port=8501"]
```

## 🛣️ Roadmap

- [ ] Add NIST AI RMF module
- [ ] Sector-specific rules (FCA, MHRA)
- [ ] Batch document processing
- [ ] API access for integration
- [ ] Custom framework builder

## 🤝 Contributing

This is a portfolio project, but suggestions welcome! Open an issue or PR.

## 📜 License

MIT License - see LICENSE file

## 👤 Author

**PK** - 

- BSc Politics, LSE
- [LinkedIn](https://linkedin.com) | [Portfolio](https://portfolio.com)

---

**Part of**: AI Governance Hub  
**Related**: [UK AI Policy Tracker](https://uk-ai-policy-tracker-next.vercel.app/)
# trigger rebuild Mon Dec  8 17:23:29 GMT 2025
