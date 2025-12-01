# 单词视频定位功能升级任务拆解 (Video Locator Upgrade Tasks)

根据 `video_cut_prd_v2.0.md` 的要求，我们将从本地视频方案升级为 Bilibili 在线视频方案。为了确保升级过程平稳且覆盖完整（包含真实数据的生成），我将此过程拆解为 **3 个独立的任务**。

请按照以下顺序，依次将每个任务的指令发送给大模型。

---

### 任务 1：数据结构定义与 Mock 索引重生成 (Data & Mock)
**目标**：确立新的数据结构（BVID 替代本地路径），并更新 Mock 脚本以立即生成可用的测试数据。
*   **输入给大模型的内容**：
    *   “请阅读 `video_cut_prd_v2.0.md` 中的‘4. 数据结构规范’章节。”
    *   “修改 `scripts/video_indexer/mock_gen.py` 脚本。”
    *   “更新 `video_map.json` 生成逻辑：生成模拟的 BVID (如 `BV1xx...`)、分集 `p` 和 `title`，移除本地文件名。”
    *   “更新 `index_*.json` 生成逻辑：确保索引项包含时间戳 `t` (秒)，并指向新的 `video_map` ID。”
    *   “**执行脚本**：运行 `python scripts/video_indexer/mock_gen.py`，覆盖 `public/video_index/` 下的所有旧索引文件。”
*   **验收标准**：打开 `public/video_index/video_map.json`，看到的是 BVID 数据；打开 `index_a.json`，结构符合 V2.0 定义。

### 任务 2：前端播放器与服务层升级 (Frontend & Player)
**目标**：更新前端核心逻辑与 UI，使其能消费新的索引数据并播放 B站视频。
*   **输入给大模型的内容**：
    *   “修改 `src/services/videoIndexService.ts`：更新 TypeScript 接口 (`VideoMapItem`) 以匹配 V2.0 结构，解析 BVID 和时间戳。”
    *   “修改 `src/components/WordDetailModal.tsx`：废弃 HTML5 Video 标签。”
    *   “封装 `BilibiliPlayer` 组件：使用 iframe 嵌入 B站播放器，支持传入 `bvid`, `page`, `t` (跳转时间)。”
    *   “实现自动跳转：点击单词时，播放器自动加载并跳转到指定秒数。”
    *   “添加 `<meta name="referrer" content="no-referrer">` 以解决防盗链问题。”
*   **验收标准**：前端搜索单词（如 'ability'），点击后能弹出 B站播放器并自动跳转到正确进度。

### 任务 3：真实后端索引管线实现 (Real Backend Pipeline)
**目标**：实现真正的 B站视频索引生成器，替换旧的本地文件扫描器。
*   **输入给大模型的内容**：
    *   “创建或重写 `scripts/video_indexer/indexer.py` (可命名为 `bilibili_indexer.py`)。”
    *   “实现 `download_audio(bvid)`：使用 `yt-dlp` 仅下载音频流到临时目录。”
    *   “集成 `ASREngine`：对临时音频进行 Whisper 识别，生成带时间戳的单词级索引。”
    *   “实现清理逻辑：识别完成后立即删除音频文件。”
    *   “输入源管理：支持从一个 `bvid_list.txt` 或配置数组中读取待处理的 BVID。”
    *   “**生成真实索引**：运行脚本，对几个测试 BVID 进行索引，生成真实的 `video_map.json` 和 `index_*.json`。”
*   **验收标准**：运行新脚本后，生成的索引文件包含真实的 B站视频内容和精确的时间戳。

---

### 升级提示
*   **索引文件的处理**：
    *   在**任务 1** 中，我们会先用 Mock 数据覆盖旧索引，以便前端开发能立即开始，无需等待漫长的视频下载和 AI 识别过程。
    *   在**任务 3** 中，我们将建立真实的生产管线。一旦真实索引生成，它将自然替换掉 Mock 数据。
*   **缓存清理**：前端开发过程中，请注意清理浏览器缓存或 IndexedDB，因为 `video_map` 的 ID 映射关系会发生剧烈变化。
