import {
    Search,
    BarChart3,
    Shield,
    FileText,
    CheckCircle2,
    AlertTriangle,
    FileCheck,
    Users,
    Scale,
    Briefcase,
    ClipboardCheck,
    Github,
    Linkedin,
    Info
} from 'lucide-react';

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Section */}
            <div className="bg-gradient-to-b from-sky-50 to-white py-16">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">About This Tool</h1>
                    <p className="text-xl text-gray-600">
                        Automated AI compliance analysis against UK regulatory frameworks
                    </p>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

                {/* The Challenge */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">The Challenge</h2>
                    <p className="text-gray-700 mb-4">
                        Organisations deploying AI systems face significant compliance burdens across multiple overlapping frameworks. This creates challenges including:
                    </p>
                    <ul className="space-y-3 text-gray-700">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Understanding which regulations apply to specific AI systems</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Identifying gaps between current documentation and compliance requirements</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Producing evidence for audits, DPIAs, and regulatory submissions</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Keeping pace with evolving UK and EU AI governance expectations</span>
                        </li>
                    </ul>
                </div>

                {/* The Solution */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">The Solution</h2>
                    <p className="text-gray-700 mb-4">
                        This tool analyses your AI procurement documents, DPIAs, and system specifications against major compliance frameworks:
                    </p>
                    <ul className="space-y-3 text-gray-700 mb-6">
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Automated gap analysis across ICO, DPA/GDPR, EU AI Act, and ISO 42001</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Evidence extraction with specific quotes from your documents</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>UK Alignment Score providing a weighted compliance metric</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-gray-400 mt-1.5">•</span>
                            <span>Priority remediation actions ranked by criticality</span>
                        </li>
                    </ul>

                    {/* Key Features Box */}
                    <div className="bg-sky-50 rounded-lg p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Key Features:</h3>
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="flex items-start gap-3">
                                <Search className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-gray-900">Framework Analysis</h4>
                                    <p className="text-sm text-gray-600">Check compliance against ICO, GDPR, EU AI Act, and ISO 42001</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <BarChart3 className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-gray-900">UK Alignment Score</h4>
                                    <p className="text-sm text-gray-600">Weighted metric prioritising UK regulatory requirements</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-gray-900">Gap Detection</h4>
                                    <p className="text-sm text-gray-600">Identify missing evidence and documentation requirements</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <FileText className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                                <div>
                                    <h4 className="font-semibold text-gray-900">Report Generation</h4>
                                    <p className="text-sm text-gray-600">Export professional PDF reports for audits and boards</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* How It Works */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">How It Works</h2>
                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { step: 1, title: 'Upload Document', desc: 'Upload your AI system specification, DPIA, procurement document, or vendor assessment.' },
                            { step: 2, title: 'Select Frameworks', desc: 'Choose which compliance frameworks to analyse against.' },
                            { step: 3, title: 'AI Analysis', desc: 'Specialised modules examine your document against each framework\'s requirements.' },
                            { step: 4, title: 'Review Results', desc: 'View scores, cross-framework issues, and download a comprehensive PDF report.' },
                        ].map((item) => (
                            <div key={item.step} className="text-center">
                                <div className="w-10 h-10 bg-sky-500 text-white rounded-full flex items-center justify-center font-bold mx-auto mb-3">
                                    {item.step}
                                </div>
                                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                                <p className="text-sm text-gray-600">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Who This Helps */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Who This Helps</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-2">Compliance Officers</h3>
                            <p className="text-gray-600 text-sm">
                                Streamline AI governance assessments and produce audit-ready documentation with clear evidence trails.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-2">Procurement Teams</h3>
                            <p className="text-gray-600 text-sm">
                                Evaluate AI vendor submissions against regulatory requirements before contract award.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-2">DPOs & IG Leads</h3>
                            <p className="text-gray-600 text-sm">
                                Ensure AI systems meet data protection requirements with structured DPIA analysis.
                            </p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-6 border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-2">Consultants & Auditors</h3>
                            <p className="text-gray-600 text-sm">
                                Deliver consistent, framework-based AI compliance assessments for clients.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Frameworks Covered */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Frameworks Covered</h2>

                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">UK ICO AI Principles</h3>
                            <p className="text-gray-600 text-sm">
                                The ICO&apos;s five principles for responsible AI: safety & robustness, fairness & transparency, accountability & governance, contestability & redress, and data protection by design.
                                {' '}
                                <a
                                    href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sky-700 hover:text-sky-900 text-xs font-medium ml-1"
                                >
                                    Learn more →
                                </a>
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">UK DPA / GDPR</h3>
                            <p className="text-gray-600 text-sm">
                                Data protection requirements for AI including Article 22 (automated decisions), Article 5 (data principles), Articles 13/14 (transparency), and Article 35 (DPIAs).
                                {' '}
                                <a
                                    href="https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sky-700 hover:text-sky-900 text-xs font-medium ml-1"
                                >
                                    Learn more →
                                </a>
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">EU AI Act</h3>
                            <p className="text-gray-600 text-sm">
                                Risk classification (prohibited, high-risk, limited, minimal) and provider obligations for high-risk AI systems.
                                {' '}
                                <a
                                    href="https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sky-700 hover:text-sky-900 text-xs font-medium ml-1"
                                >
                                    Learn more →
                                </a>
                            </p>
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900 mb-1">ISO/IEC 42001:2023</h3>
                            <p className="text-gray-600 text-sm">
                                AI management system requirements covering governance, risk management, data lifecycle, and monitoring.
                                {' '}
                                <a
                                    href="https://www.iso.org/standard/42001"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sky-700 hover:text-sky-900 text-xs font-medium ml-1"
                                >
                                    Learn more →
                                </a>
                            </p>
                        </div>
                    </div>
                </div>

                {/* UK Alignment Score */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">UK Alignment Score</h2>
                    <p className="text-gray-700 mb-6">
                        The UK Alignment Score is a weighted composite metric that prioritises UK-specific frameworks:
                    </p>

                    <div className="bg-gray-50 rounded-lg p-6 space-y-3">
                        {[
                            { name: 'ICO AI Principles', weight: '40%' },
                            { name: 'UK DPA / GDPR', weight: '30%' },
                            { name: 'ISO 42001', weight: '20%' },
                            { name: 'EU AI Act', weight: '10%' },
                        ].map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                                <span className="text-gray-700">{item.name}</span>
                                <span className="font-semibold text-gray-900">{item.weight}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-gray-600 text-sm mt-4">
                        This weighting reflects the regulatory priorities for UK-based organisations while maintaining visibility of international standards.
                    </p>
                </div>

                {/* About the Developer */}
                <div className="bg-white rounded-xl border border-gray-200 p-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Developer</h2>

                    <h3 className="text-xl font-bold text-gray-900">Paul K.</h3>
                    <p className="text-gray-500 mb-4">Data & AI Solutions</p>

                    <p className="text-gray-700 mb-4">
                        Paul is a Data and AI Solutions specialist focused on building data-driven applications that solve real business problems. His recent work includes enterprise AI systems for financial services, automation tools for business intelligence, and several portfolio projects demonstrating end-to-end product development.
                    </p>

                    <p className="text-gray-700 mb-6">
                        With a BSc in Politics from the London School of Economics and experience spanning financial services, consulting, and technical implementation, Paul brings a unique blend of business acumen and technical expertise to every project. He specialises in taking complex datasets and regulatory landscapes and transforming them into actionable platforms and practical business intelligence tools.
                    </p>

                    <div className="flex gap-3">
                        <a
                            href="https://github.com/Boakye-20"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Github className="w-5 h-5" />
                            GitHub
                        </a>
                        <a
                            href="https://www.linkedin.com/in/paul-kwarteng-22a71b196/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 bg-sky-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-sky-700 transition-colors"
                        >
                            <Linkedin className="w-5 h-5" />
                            LinkedIn
                        </a>
                    </div>
                </div>

                {/* Portfolio Notice */}
                <div className="border-l-4 border-sky-500 bg-sky-50 rounded-r-lg p-4 flex items-start gap-3">
                    <Info className="w-5 h-5 text-sky-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sky-800 text-sm">
                        This is a portfolio project built with Python, LangGraph, and Next.js. The application demonstrates AI-powered document analysis and multi-framework compliance assessment using Perplexity Sonar models (sonar for extraction and sonar-pro for detailed compliance analysis).
                    </p>
                </div>

            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-12 py-8">
                <div className="max-w-4xl mx-auto px-4 text-center text-gray-500 text-xs">
                    <p>AI Governance Hub • Built by Paul Kwarteng</p>
                    <p className="mt-1">This tool is for informational purposes only and does not constitute legal advice.</p>
                </div>
            </footer>
        </div>
    );
}
