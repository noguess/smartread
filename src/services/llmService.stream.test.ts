import { describe, it, expect, vi, beforeEach } from 'vitest';
import { llmService } from './llmService';
import { Word } from './db';


// Mock _callDeepSeekStream
vi.mock('./llmService', async () => {
    const actual = await vi.importActual<any>('./llmService');
    return {
        ...actual,
        llmService: {
            ...actual.llmService,
            _callDeepSeekStream: vi.fn(),
        }
    };
});

describe('llmService.generateArticleStream', () => {
    const mockWords: Word[] = [
        { id: 1, spelling: 'apple', meaning: 'fruit', status: 'New', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 }
    ];
    const mockSettings = { apiKey: 'test-key', difficultyLevel: 'L2' } as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should incrementally update partial data via callback', async () => {
        // Mock stream output chunks
        // Chunks simulate a JSON structure being built: { "title": "My Article", "content": "..." }
        const chunks = [
            '{ "title": "My',
            ' Article",',
            ' "content": "Once upon',
            ' a time..." }'
        ];


        // Mock _callDeepSeekStream to simulate streaming
        (llmService._callDeepSeekStream as any).mockImplementation(async (
            _key: string, _url: string, _sys: string, _user: string,
            onToken: (token: string) => void
        ) => {

            // Simulate async stream
            for (const chunk of chunks) {
                await new Promise(r => setTimeout(r, 10)); // tiny delay
                onToken(chunk);
            }
            return chunks.join('');
        });

        const onPartialData = vi.fn();

        await llmService.generateArticleStream(
            mockWords,
            mockSettings,
            onPartialData
        );

        // Expect callback to be called multiple times
        expect(onPartialData).toHaveBeenCalled();

        // Check if final call has complete data
        const lastCall = onPartialData.mock.calls[onPartialData.mock.calls.length - 1][0];
        expect(lastCall.title).toBe('My Article');
        expect(lastCall.content).toBe('Once upon a time...');
    });

    it('should handle JSON parsing errors gracefully during stream', async () => {
        // This case tests if it crashes when JSON is invalid
        // logic relies on jsonParser which we tested, but we verify service integration here

        const chunks = [
            'Invalid Start',
            '{ "title": "Now Valid" }'
        ];

        (llmService._callDeepSeekStream as any).mockImplementation(async (
            _key: string, _url: string, _sys: string, _user: string,
            onToken: (token: string) => void
        ) => {
            for (const chunk of chunks) {
                onToken(chunk);
            }
            return chunks.join('');
        });

        const onPartialData = vi.fn();
        await llmService.generateArticleStream(mockWords, mockSettings, onPartialData);

        // Should eventually get the valid part if parser is robust, or at least not crash
        expect(llmService._callDeepSeekStream).toHaveBeenCalled();
    });
});
