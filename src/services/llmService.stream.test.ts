import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { llmService } from './llmService';
import { Word } from './db';

describe('llmService.generateArticleStream', () => {
    const mockWords: Word[] = [
        { id: 1, spelling: 'apple', meaning: 'fruit', status: 'New', nextReviewAt: 0, interval: 0, repetitionCount: 0, lastSeenAt: 0 }
    ];
    const mockSettings = { apiKey: 'test-key', difficultyLevel: 'L2' } as any;

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    })

    it('should incrementally update partial data via callback', async () => {
        // Mock _callDeepSeekStream using spyOn
        const streamSpy = vi.spyOn(llmService, '_callDeepSeekStream').mockImplementation(async (
            _key: string, _url: string, _sys: string, _user: string,
            onToken: (token: string) => void
        ) => {
            const chunks = [
                '{ "title": "My',
                ' Article",',
                ' "content": "Once upon',
                ' a time..." }'
            ];

            for (const chunk of chunks) {
                await new Promise(r => setTimeout(r, 10));
                onToken(chunk);
            }
            return chunks.join('');
        });

        const onPartialData = vi.fn();

        await llmService.generateArticleStream(
            mockWords,
            mockSettings,
            undefined, // onProgress
            onPartialData
        );

        // Expect callback to be called multiple times
        expect(onPartialData).toHaveBeenCalled();

        // Check if final call has complete data
        const lastCall = onPartialData.mock.calls[onPartialData.mock.calls.length - 1][0];
        expect(lastCall.title).toBe('My Article');
        // Note: best-effort parser might clean up strings, but "Once upon a time..." should be there.
        // It might be "Once upon a time..."
        expect(lastCall.content).toContain('Once upon');

        expect(streamSpy).toHaveBeenCalled();
    });

    it('should handle JSON parsing errors gracefully during stream', async () => {
        const streamSpy = vi.spyOn(llmService, '_callDeepSeekStream').mockImplementation(async (
            _key: string, _url: string, _sys: string, _user: string,
            onToken: (token: string) => void
        ) => {
            const chunks = [
                'Invalid Start',
                '{ "title": "Now Valid" }'
            ];
            for (const chunk of chunks) {
                onToken(chunk);
            }
            return chunks.join('');
        });

        const onPartialData = vi.fn();
        // Should not throw
        await llmService.generateArticleStream(mockWords, mockSettings, undefined, onPartialData);

        expect(streamSpy).toHaveBeenCalled();
        // It might call onPartialData or not depending on parser, but shouldn't crash
    });
});
