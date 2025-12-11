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

    // FIRST: Extract JSON object by finding { and } - this handles ALL prefix issues
    // including <think> blocks, markdown, or any other preamble
    const jsonStart = cleaned.indexOf('{');
    const jsonEnd = cleaned.lastIndexOf('}');

    if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
        console.error('No JSON object found in response. First 300 chars:', cleaned.slice(0, 300));
        throw new Error('Could not parse JSON from response: No JSON object found');
    }

    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);

    // CRITICAL: Ensure we ONLY have the JSON object, nothing before or after
    // This is the nuclear option - strict extraction
    cleaned = cleaned.trim();

    // Remove common LLM artifacts that break JSON parsing
    // 1. Remove "..." placeholders (with or without quotes)
    cleaned = cleaned.replace(/"\.\.\."/g, '""');
    cleaned = cleaned.replace(/\.\.\.\s*/g, '');
    // 2. Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([}\]])/g, '$1');

    // Try to parse, with fallback repair attempts
    try {
        const parsed = JSON.parse(cleaned);
        return parsed;
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
