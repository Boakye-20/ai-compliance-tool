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

    // Extract JSON object
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
        cleaned = cleaned.slice(start, end + 1);
    }

    // Remove common LLM artifacts that break JSON parsing
    // 1. Remove "..." placeholders (with or without quotes)
    cleaned = cleaned.replace(/"\.\.\."/g, '""');
    cleaned = cleaned.replace(/\.\.\.\s*/g, '');
    // 2. Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');
    // 3. Remove any remaining non-JSON text after the closing brace
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
        cleaned = cleaned.slice(0, lastBrace + 1);
    }

    try {
        return JSON.parse(cleaned);
    } catch (e) {
        console.error('JSON parse error. Cleaned content (first 500 chars):', cleaned.slice(0, 500));
        throw new Error(`Could not parse JSON from response: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
}
