// Video metadata from video_map.json
interface VideoMapItem {
    bvid: string
    page: number  // ✅ 修复：匹配 video_map.json 中的 "page" 字段
    title: string
    filename: string  // 添加 filename 字段
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
    private videoMap: Record<string, VideoMapItem> | null = null
    private indexCache: Record<string, any> = {}

    async loadVideoMap(): Promise<Record<string, VideoMapItem>> {
        if (this.videoMap) return this.videoMap

        try {
            const response = await fetch('/data/video_map.json')
            if (!response.ok) throw new Error('Video map not found')
            const data = await response.json()
            this.videoMap = data as Record<string, VideoMapItem>
            return this.videoMap
        } catch (error) {
            console.warn('Failed to load video map:', error)
            return {}
        }
    }

    async searchWord(word: string): Promise<VideoOccurrence[]> {
        const lemma = word.toLowerCase().trim()
        if (!lemma) return []

        // Get first letter for shard lookup
        const firstChar = lemma[0]
        const shardKey = /[a-z]/.test(firstChar) ? firstChar : 'others'
        const indexFile = `/data/index_${shardKey}.json`

        try {
            // Load index shard (with caching)
            if (!this.indexCache[shardKey]) {
                const response = await fetch(indexFile)
                if (!response.ok) throw new Error(`Index shard ${shardKey} not found`)
                this.indexCache[shardKey] = await response.json()
            }

            const index = this.indexCache[shardKey]
            const entries = index[lemma]

            if (!entries || entries.length === 0) {
                return []
            }

            // Load video map
            const videoMap = await this.loadVideoMap()

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
        this.videoMap = null
    }
}

export const videoIndexService = new VideoIndexService()
