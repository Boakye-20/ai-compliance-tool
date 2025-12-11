export interface PerplexityMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface PerplexityResponse {
    choices: Array<{
        message: {
            content: string;
        };
    }>;
}

export type ModelType = 'sonar' | 'sonar-pro';

export async function callPerplexity(prompt: string, model: ModelType = 'sonar-pro'): Promise<string> {
    const apiKey = process.env.PPLX_API_KEY;

    if (!apiKey) {
        throw new Error('PPLX_API_KEY environment variable is not set');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model,
            messages: [
                {
                    role: 'user',
                    content: prompt,
                },
            ],
            temperature: 0,
            max_tokens: 4096,
        }),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Perplexity API error: ${response.status} - ${error}`);
    }

    const data: PerplexityResponse = await response.json();
    return data.choices[0]?.message?.content || '';
}

export function parseJsonResponse<T>(content: string): T {
    let cleaned = content.trim();

    // Remove markdown code fences
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    try {
        return JSON.parse(cleaned);
    } catch {
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            const inner = cleaned.slice(start, end + 1);
            return JSON.parse(inner);
        }
        throw new Error('Could not parse JSON from response');
    }
}
