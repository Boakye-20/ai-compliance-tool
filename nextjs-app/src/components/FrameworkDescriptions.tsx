"use client";

const frameworks = [
    {
        emoji: "🇬🇧",
        name: "UK ICO",
        description: "5 AI principles for responsible AI development from the Information Commissioner's Office",
        href: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/",
    },
    {
        emoji: "🔒",
        name: "UK DPA/GDPR",
        description: "Data protection requirements for AI systems under UK Data Protection Act 2018",
        href: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/artificial-intelligence/guidance-on-ai-and-data-protection/",
    },
    {
        emoji: "🇪🇺",
        name: "EU AI Act",
        description: "Risk-based AI regulation framework from the European Union",
        href: "https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai",
    },
    {
        emoji: "📋",
        name: "ISO 42001",
        description: "AI management system certification standard (ISO/IEC 42001)",
        href: "https://www.iso.org/standard/42001",
    },
];

export function FrameworkDescriptions() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {frameworks.map(framework => (
                <div key={framework.name} className="framework-card">
                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                        <span className="text-lg">{framework.emoji}</span>
                        {framework.name}
                    </div>
                    <div className="text-gray-600 text-xs leading-relaxed">
                        {framework.description}
                        {framework.href && (
                            <div className="mt-1">
                                <a
                                    href={framework.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center text-sky-700 hover:text-sky-900 font-medium"
                                >
                                    Learn more →
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
}
