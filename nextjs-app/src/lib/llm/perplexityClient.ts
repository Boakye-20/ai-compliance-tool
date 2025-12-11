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

export type ModelType = 'sonar' | 'sonar-pro' | 'sonar-reasoning';

export async function callPerplexity(prompt: string, model: ModelType = 'sonar-reasoning'): Promise<string> {
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
            max_tokens: 6000,
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

    // Remove <think>...</think> blocks from sonar-reasoning model
    // Handle both closed tags and unclosed/malformed tags
    cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, '');

    // If response still starts with <think> (unclosed tag), skip to JSON
    if (cleaned.startsWith('<think>') || cleaned.startsWith('<think ')) {
        const jsonStart = cleaned.indexOf('{');
        if (jsonStart !== -1) {
            cleaned = cleaned.slice(jsonStart);
        }
    }

    // Also handle case where </think> appears without opening tag being removed
    if (cleaned.includes('</think>')) {
        const thinkEnd = cleaned.lastIndexOf('</think>');
        cleaned = cleaned.slice(thinkEnd + 8);
    }

    // If there's still any <think> tag anywhere, just find the JSON
    if (cleaned.includes('<think')) {
        const jsonStart = cleaned.indexOf('{');
        if (jsonStart !== -1) {
            cleaned = cleaned.slice(jsonStart);
        }
    }
    cleaned = cleaned.trim();

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

    // Extract JSON object - find the first { and last }
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

    // Try to parse, with fallback repair attempts
    try {
        return JSON.parse(cleaned);
    } catch (firstError) {
        console.error('JSON parse error (first attempt). Trying repairs...');

        // Attempt repairs for common LLM JSON errors
        let repaired = cleaned;

        // Fix unterminated strings by finding unbalanced quotes and closing them
        // Count quotes and try to balance
        const quoteCount = (repaired.match(/"/g) || []).length;
        if (quoteCount % 2 !== 0) {
            // Odd number of quotes - find last unclosed string and close it
            // Look for pattern like "text without closing quote followed by , or }
            repaired = repaired.replace(/"([^"]*?)([,}\]])(?=[^"]*$)/g, '"$1"$2');
        }

        // Fix missing commas between properties: }{ or ][ or ""  patterns
        repaired = repaired.replace(/"\s*\n\s*"/g, '",\n"');
        repaired = repaired.replace(/}\s*\n\s*"/g, '},\n"');
        repaired = repaired.replace(/]\s*\n\s*"/g, '],\n"');

        // Fix truncated arrays/objects by ensuring proper closing
        let openBraces = 0;
        let openBrackets = 0;
        let inString = false;
        for (let i = 0; i < repaired.length; i++) {
            const char = repaired[i];
            const prevChar = i > 0 ? repaired[i - 1] : '';
            if (char === '"' && prevChar !== '\\') inString = !inString;
            if (!inString) {
                if (char === '{') openBraces++;
                if (char === '}') openBraces--;
                if (char === '[') openBrackets++;
                if (char === ']') openBrackets--;
            }
        }

        // Close any unclosed structures
        // First close any unclosed string
        if (inString) repaired += '"';
        // Then close brackets and braces
        while (openBrackets > 0) {
            repaired += ']';
            openBrackets--;
        }
        while (openBraces > 0) {
            repaired += '}';
            openBraces--;
        }

        // Remove trailing commas again after repairs
        repaired = repaired.replace(/,\s*([}\]])/g, '$1');

        try {
            return JSON.parse(repaired);
        } catch (secondError) {
            console.error('JSON parse error after repair. Content (first 500 chars):', cleaned.slice(0, 500));
            throw new Error(`Could not parse JSON from response: ${firstError instanceof Error ? firstError.message : 'Unknown error'}`);
        }
    }
}
