// Video metadata from video_map.json
interface VideoMapItem {
    bvid: string
    page: number  // ✅ 修复：匹配 video_map.json    page: number
    title: string
    filename: string
    platform?: 'bilibili' | 'youtube'
}

// Video occurrence in index
export interface VideoOccurrence {
    bvid: string
    page: number
    title: string
    startTime: number
    context: string
    score?: number
}

class VideoIndexService {
    // Cache by platform
    private videoMaps: Record<string, Record<string, VideoMapItem>> = {}
    private indexCache: Record<string, any> = {}

    private getVideoMapPath(platform: 'bilibili' | 'youtube') {
        return platform === 'youtube' ? '/data/video_map_youtube.json' : '/data/video_map_bilibili.json'
    }

    private getIndexShardPath(shardKey: string, platform: 'bilibili' | 'youtube') {
        const prefix = platform === 'youtube' ? 'index_youtube' : 'index_bilibili'
        return `/data/${prefix}_${shardKey}.json`
    }

    async loadVideoMap(platform: 'bilibili' | 'youtube' = 'bilibili'): Promise<Record<string, VideoMapItem>> {
        if (this.videoMaps[platform]) return this.videoMaps[platform]

        try {
            const path = this.getVideoMapPath(platform)
            const response = await fetch(path)
            if (!response.ok) {
                // Compatibility Fallback for Bilibili: try old video_map.json only if platform is bilibili
                if (platform === 'bilibili') {
                    const fallbackResponse = await fetch('/data/video_map.json')
                    if (fallbackResponse.ok) {
                        const data = await fallbackResponse.json()
                        this.videoMaps[platform] = data
                        return data
                    }
                }
                throw new Error(`Video map for ${platform} not found at ${path}`)
            }
            const data = await response.json()
            this.videoMaps[platform] = data as Record<string, VideoMapItem>
            return this.videoMaps[platform]
        } catch (error) {
            console.warn(`Failed to load video map (${platform}):`, error)
            return {}
        }
    }

    async searchWord(word: string, platform: 'bilibili' | 'youtube' = 'bilibili'): Promise<VideoOccurrence[]> {
        const lemma = word.toLowerCase().trim()
        if (!lemma) return []

        // Get first letter for shard lookup
        const firstChar = lemma[0]
        const shardKey = /[a-z]/.test(firstChar) ? firstChar : 'others'
        // const indexFile = `/data/index_${shardKey}.json` // Old Logic

        try {
            const cacheKey = `${platform}_${shardKey}`

            // Load index shard (with caching)
            if (!this.indexCache[cacheKey]) {
                const path = this.getIndexShardPath(shardKey, platform)
                const response = await fetch(path)

                if (!response.ok) {
                    // Compatibility Fallback: try old index path only if bilibili
                    if (platform === 'bilibili') {
                        const fallbackPath = `/data/index_${shardKey}.json`
                        const fallbackRes = await fetch(fallbackPath)
                        if (fallbackRes.ok) {
                            this.indexCache[cacheKey] = await fallbackRes.json()
                        } else {
                            throw new Error(`Index shard ${shardKey} not found`)
                        }
                    } else {
                        throw new Error(`Index shard ${shardKey} not found`)
                    }
                } else {
                    this.indexCache[cacheKey] = await response.json()
                }
            }

            const index = this.indexCache[cacheKey]
            const entries = index[lemma]

            if (!entries || entries.length === 0) {
                return []
            }

            // Load video map
            const videoMap = await this.loadVideoMap(platform)

            // Transform entries to VideoOccurrence format
            const occurrences: VideoOccurrence[] = []

            for (const entry of entries) {
                const videoInfo = videoMap[entry.v]
                if (videoInfo) {
                    occurrences.push({
                        bvid: videoInfo.bvid,
                        page: videoInfo.page,  // ✅ 修复：使用正确的字段名 "page"
                        title: videoInfo.title,
                        startTime: entry.t, // V2.0: t is a single number (seconds)
                        context: entry.c,
                        score: entry.s // Map score from index
                    })
                }
            }

            return occurrences
        } catch (error) {
            console.warn(`Failed to search word "${word}":`, error)
            return []
        }
    }

    clearCache() {
        this.indexCache = {}
        this.videoMaps = {}
    }
}

export const videoIndexService = new VideoIndexService()
