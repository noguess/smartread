
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { videoIndexService } from './videoIndexService'

// Mock fetch globally
global.fetch = vi.fn()

describe('VideoIndexService', () => {
    beforeEach(() => {
        vi.resetAllMocks()
        videoIndexService.clearCache()
    })

    it('should load bilibili video map by default or when specified', async () => {
        const mockMap = {
            "0": { bvid: "BV123", page: 1, title: "Test Video", filename: "test.mp4", platform: "bilibili" }
        }


        // But since loadVideoMap is private or protected, we test via searchWord side effects or we can export it/make public.
        // Let's assume searchWord triggers it.

        const mockIndex = { "test": [{ "v": "0", "t": 10, "c": "context" }] }

            // We need to allow mocking sequence: index load -> map load
            // Actually searchWord loads index first, then map.

            // Mock chain
            ; (global.fetch as any)
                .mockResolvedValueOnce({ // Index
                    ok: true,
                    json: async () => mockIndex
                })
                .mockResolvedValueOnce({ // Map
                    ok: true,
                    json: async () => mockMap
                })

        const results = await videoIndexService.searchWord('test', 'bilibili')
        expect(results).toHaveLength(1)
        expect(results[0].bvid).toBe('BV123')
        expect(global.fetch).toHaveBeenCalledWith('/data/index_bilibili_t.json')
        expect(global.fetch).toHaveBeenCalledWith('/data/video_map_bilibili.json')
    })

    it('should load youtube video map when platform is youtube', async () => {
        const mockMapYT = {
            "yt_0": { bvid: "YT123", page: 1, title: "YouTube Video", filename: "yt.mp4", platform: "youtube" }
        }
        const mockIndexYT = { "test": [{ "v": "yt_0", "t": 20, "c": "yt context" }] }

            ; (global.fetch as any)
                .mockResolvedValueOnce({ // Index
                    ok: true,
                    json: async () => mockIndexYT
                })
                .mockResolvedValueOnce({ // Map
                    ok: true,
                    json: async () => mockMapYT
                })

        const results = await videoIndexService.searchWord('test', 'youtube')
        expect(results).toHaveLength(1)
        expect(results[0].bvid).toBe('YT123')
        expect(global.fetch).toHaveBeenCalledWith('/data/index_youtube_t.json')
        expect(global.fetch).toHaveBeenCalledWith('/data/video_map_youtube.json')
    })
})
