import { parse } from 'best-effort-json-parser';

/**
 * Wraps best-effort-json-parser to safely parse incremental JSON strings.
 * It also handles common LLM artifacts like markdown code blocks.
 * 
 * @param jsonStr The potentially incomplete JSON string
 * @returns The parsed object or null if parsing fails completely
 */
export function parseIncrementalJson(jsonStr: string): any {
    if (!jsonStr || typeof jsonStr !== 'string') {
        return null;
    }

    let cleanStr = jsonStr.trim();

    // Remove markdown code block markers if present
    // We handle:
    // 1. ```json ... ```
    // 2. ``` ... ```
    // 3. ```json ... (incomplete ending)
    if (cleanStr.startsWith('```')) {
        const firstLineBreak = cleanStr.indexOf('\n');
        if (firstLineBreak !== -1) {
            // Remove the first line (```json or ```)
            cleanStr = cleanStr.slice(firstLineBreak + 1);
        }
    }

    // If it ends with ``` (and maybe whitespace), remove it
    // Note: Since we are streaming, we might not have the closing ``` yet, 
    // but if we do, we strip it.
    if (cleanStr.endsWith('```')) {
        cleanStr = cleanStr.slice(0, -3);
    } else if (cleanStr.slice(-4).trim() === '```') {
        // handle case like "```\n"
        const lastBackticks = cleanStr.lastIndexOf('```');
        if (lastBackticks !== -1 && lastBackticks > cleanStr.length - 10) {
            cleanStr = cleanStr.slice(0, lastBackticks);
        }
    }

    try {
        return parse(cleanStr);
    } catch {
        // Fallback or silently fail for very early stages where it's not even valid start
        // console.warn('JSON Incremental Parse Error:', e);
        return null;
    }
}
