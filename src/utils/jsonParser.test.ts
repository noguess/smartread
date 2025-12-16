import { parseIncrementalJson } from './jsonParser';
import { describe, it, expect } from 'vitest';

describe('parseIncrementalJson', () => {
    it('should parse complete valid JSON', () => {
        const input = '{"title": "Hello", "content": "World"}';
        const result = parseIncrementalJson(input);
        expect(result).toEqual({ title: 'Hello', content: 'World' });
    });

    it('should parse partial JSON object with incomplete value', () => {
        // "content": "Worl... (cut off)
        const input = '{"title": "Hello", "content": "Worl';
        const result = parseIncrementalJson(input);
        // best-effort-json-parser typically closes strings
        expect(result).toEqual({ title: 'Hello', content: 'Worl' });
    });

    it('should parse partial JSON with nested objects', () => {
        const input = '{"data": { "id": 1, "name": "Te';
        const result = parseIncrementalJson(input);
        expect(result).toEqual({ data: { id: 1, name: 'Te' } });
    });

    it('should parse partial JSON array', () => {
        const input = '{"items": ["apple", "ban';
        const result = parseIncrementalJson(input);
        expect(result).toEqual({ items: ['apple', 'ban'] });
    });

    it('should handle completely empty input', () => {
        expect(parseIncrementalJson('')).toEqual(null);
    });

    it('should handle markdown code blocks if present (common LLM behavior)', () => {
        const input = '```json\n{"title": "Test"}\n```';
        const result = parseIncrementalJson(input);
        expect(result).toEqual({ title: 'Test' });
    });

    it('should handle partial markdown code blocks', () => {
        const input = '```json\n{"title": "Te';
        const result = parseIncrementalJson(input);
        expect(result).toEqual({ title: 'Te' });
    });
});
