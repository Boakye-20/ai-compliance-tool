import { NextRequest, NextResponse } from 'next/server';
import { callPerplexity, parseJsonResponse } from '../../../lib/llm/perplexityClient';
import { matchKit, RemediationKit } from '../../../lib/remediation/templates';

export const maxDuration = 60;

// Generic fallback so the button never returns empty, even offline / on LLM failure.
function genericKit(gap: string, framework?: string): RemediationKit {
    return {
        id: 'generic',
        title: 'Remediation Starter Kit',
        clause: framework || 'General',
        description: `Baseline remediation scaffold for: ${gap.slice(0, 160)}`,
        files: [
            {
                filename: 'remediation_checklist.md',
                language: 'markdown',
                content: `# Remediation Checklist\n\n**Gap:** ${gap}\n\n- [ ] Assign an owner and target date\n- [ ] Document the control that closes this gap\n- [ ] Implement the control (code / policy / process)\n- [ ] Capture evidence (logs, records, sign-off)\n- [ ] Re-run the compliance audit to confirm closure\n`,
            },
        ],
    };
}

export async function POST(request: NextRequest) {
    try {
        const { gap, framework } = (await request.json()) as { gap?: string; framework?: string };

        if (!gap || typeof gap !== 'string') {
            return NextResponse.json({ error: 'A "gap" string is required' }, { status: 400 });
        }

        // 1. Deterministic curated match (fast, offline-safe).
        const curated = matchKit(gap);
        if (curated) {
            return NextResponse.json({ kit: curated, source: 'curated' });
        }

        // 2. No curated match — ask the LLM for a clause-specific kit, else fall back.
        if (!process.env.PPLX_API_KEY) {
            return NextResponse.json({ kit: genericKit(gap, framework), source: 'fallback' });
        }

        const prompt = `You are a compliance engineer. Produce a concrete remediation kit that an engineering team can plug into their stack to close this compliance gap.

Framework context: ${framework || 'UK / EU AI governance'}
Gap: ${gap}

Return ONLY a JSON object of this exact shape (no markdown, no prose):
{
  "id": "kebab-case-id",
  "title": "Short kit title",
  "clause": "Regulatory anchor, e.g. 'EU AI Act · Article 12'",
  "description": "1-2 sentences on what this kit does",
  "files": [
    { "filename": "name.ext", "language": "sql|json|python|yaml|markdown|typescript", "content": "actual file contents engineers can use" }
  ]
}
Prefer real, runnable artefacts (SQL schemas, JSON event templates, config snippets). 1-3 files max.`;

        try {
            const response = await callPerplexity(prompt, 'sonar-pro');
            const kit = parseJsonResponse<RemediationKit>(response);
            if (kit && Array.isArray(kit.files) && kit.files.length > 0) {
                return NextResponse.json({ kit, source: 'generated' });
            }
            return NextResponse.json({ kit: genericKit(gap, framework), source: 'fallback' });
        } catch (llmError) {
            console.error('Remediation LLM error:', llmError);
            return NextResponse.json({ kit: genericKit(gap, framework), source: 'fallback' });
        }
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Remediation failed' },
            { status: 500 },
        );
    }
}
