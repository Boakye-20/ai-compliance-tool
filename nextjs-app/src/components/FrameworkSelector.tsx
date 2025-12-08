"use client";

import { FrameworkKey } from '@/app/page';

interface FrameworkSelectorProps {
    selected: FrameworkKey[];
    onChange: (frameworks: FrameworkKey[]) => void;
}

const frameworks: { key: FrameworkKey; label: string; emoji: string }[] = [
    { key: "ICO", label: "UK ICO", emoji: "🇬🇧" },
    { key: "DPA", label: "UK DPA/GDPR", emoji: "🔒" },
    { key: "EU_AI_ACT", label: "EU AI Act", emoji: "🇪🇺" },
    { key: "ISO_42001", label: "ISO 42001", emoji: "📋" },
];

export function FrameworkSelector({ selected, onChange }: FrameworkSelectorProps) {
    const handleToggle = (framework: FrameworkKey) => {
        if (selected.includes(framework)) {
            onChange(selected.filter(f => f !== framework));
        } else {
            onChange([...selected, framework]);
        }
    };

    return (
        <div className="space-y-2">
            {frameworks.map(framework => (
                <label key={framework.key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                    <input
                        type="checkbox"
                        checked={selected.includes(framework.key)}
                        onChange={() => handleToggle(framework.key)}
                        className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                    />
                    <span className="text-lg">{framework.emoji}</span>
                    <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{framework.label}</span>
                    </div>
                </label>
            ))}
        </div>
    );
}
