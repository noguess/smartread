
# 产品需求文档 (PRD) - B站英语单词视频定位服务 (Bilibili Word Locator)

| 文档版本 | 修改日期 | 修改人 | 备注 |
| :--- | :--- | :--- | :--- |
| V1.0 | 202X-XX-XX | [你的名字] | 初始版本（本地文件方案） |
| **V2.0** | **202X-XX-XX** | **[你的名字]** | **重大架构变更**：废弃本地视频存储，改为基于 Bilibili 在线视频源。引入音频临时下载与嵌入式播放器方案。 |

## 1. 项目背景与目标

### 1.1 项目背景
用户希望利用 Bilibili（B站）上丰富的英语学习资源进行针对性学习。当用户需要查询特定单词时，希望系统能直接检索已收录的 B站视频，并在当前页面通过嵌入式播放器直接跳转到单词出现的精确时间点，而无需下载视频文件或跳转至 B站官网寻找。

### 1.2 项目目标
开发一套**基于 Bilibili 视频源的在线索引与播放服务**。
1.  **零本地存储**：不下载、不存储视频文件，仅在处理阶段临时下载音频用于分析，最大限度节省存储空间。
2.  **在线流式播放**：利用 Bilibili 官方提供的嵌入式播放器（Iframe），实现视频在自有网站的直接播放。
3.  **精准定位跳转**：通过 URL 参数或播放器 API，实现点击单词即跳转至 B站视频的对应进度条位置。

## 2. 需求范围 (Scope)

### 2.1 包含内容 (In Scope)
*   **资源获取**：输入 Bilibili 视频链接或 BVID，后端工具提取音频流（处理完即删除）。
*   **内容分析**：ASR（语音识别）生成单词级时间轴索引。
*   **索引构建**：建立“单词 -> [BVID, 时间点]”的映射关系。
*   **嵌入式播放**：前端集成 Bilibili Iframe 播放器，并根据索引控制播放进度。

### 2.2 不包含内容 (Out of Scope)
*   **视频存储**：**严禁**长期存储任何视频或音频文件。
*   **付费内容破解**：不支持 Bilibili 大会员专属或付费视频的解析。
*   **弹幕/评论抓取**：仅关注视频内容的语音部分。

## 3. 详细功能需求 (Functional Requirements)

### 3.1 视频元数据与音频提取 (Backend Processing)
*   **输入**：包含 Bilibili 视频 ID (BVID) 的列表（如 `BV1xx...`）。
*   **处理逻辑**：
    1.  **临时下载**：调用工具（如 `yt-dlp` 或 `bilix`）**仅下载音频流**到临时目录。
    2.  **音频分析**：调用 WhisperX 对临时音频进行识别，获取单词级时间戳。
    3.  **清理**：分析完成后，**立即物理删除**临时音频文件。
*   **输出**：生成包含 BVID 和时间戳的 JSON 索引数据。

### 3.2 索引构建 (Indexing)
*   **映射逻辑**：将 ASR 识别出的单词与 BVID 进行关联。
*   **数据结构优化**：
    *   支持多 P 视频（B站的分集视频）：需记录 `BVID` + `Page_Index (p)`。

### 3.3 前端播放与跳转 (Frontend Playback)
*   **交互逻辑**：
    1.  用户搜索单词，列表展示结果。
    2.  用户点击某一条目。
    3.  对应视频播放位置加载 Bilibili 嵌入式播放器（Iframe）。
    4.  **自动跳转**：播放器 URL 携带时间参数（`&t=xxx`）或通过 JS 控制，直接从目标时间开始播放。
*   **播放器配置**：
    *   需配置 `high_quality=1` (允许的情况下) 以保证清晰度。
    *   需配置 `autoplay=1` (如浏览器策略允许)。

## 4. 数据结构规范 (Data Specification)

### 4.1 视频资源表 (video_map.json)
不再存储本地路径，而是存储 B站的元数据。
```json
{
  "0": {
    "bvid": "BV1Nb411v7XU",
    "p": 1, 
    "title": "TED演讲：如何通过练习学习英语",
    "cover": "http://i0.hdslb.com/bfs/archive/....jpg" // 可选，用于列表展示封面
  },
  "1": {
    "bvid": "BV1Nb411v7XU",
    "p": 2,
    "title": "TED演讲：词汇量拓展训练"
  }
}
```

### 4.2 倒排索引分片 (index_a.json)
结构与 V1.0 类似，但在逻辑上指向在线资源。
```json
{
  "practice": [
    {
      "v": 0,                // 引用 video_map 中的 ID 0
      "t": 125,              // 精确到秒（整数），B站参数通常精确到秒
      "c": "you need to practice everyday" // 上下文
    }
  ]
}
```

## 5. 技术实现路径建议 (Implementation Strategy)

### 5.1 后端处理栈 (Python)
*   **下载工具**: `yt-dlp` (推荐) 或 `bilix`。
    *   命令示例：`yt-dlp -f 'ba' --extract-audio --audio-format mp3 https://www.bilibili.com/video/BVxxxx`
    *   *注：`'ba'` 表示 best audio，只下载音频，速度快且不占带宽。*
*   **ASR**: WhisperX (同前版本，保持高精度)。

### 5.2 前端实现栈 (HTML/JS + Bilibili Iframe)
*   **播放器嵌入代码**:
    B站官方 Iframe 格式如下：
    ```html
    <iframe 
      id="biliPlayer"
      src="//player.bilibili.com/player.html?bvid=BV1xx411c7mD&page=1&t=120&high_quality=1" 
      scrolling="no" 
      border="0" 
      frameborder="no" 
      framespacing="0" 
      allowfullscreen="true">
    </iframe>
    ```
*   **动态跳转逻辑 (JavaScript)**:
    由于跨域限制，直接控制 Iframe 内部 `video` 标签比较困难。最稳健的方式是**重新加载 Iframe 的 src**。

    ```javascript
    function playBilibiliVideo(bvid, page, timeInSeconds) {
        const playerFrame = document.getElementById('biliPlayer');
        // 构造 B站 嵌入式 URL
        // t 参数单位为秒
        // page 参数对应分集 (p1 = 1)
        const baseUrl = "//player.bilibili.com/player.html";
        const newSrc = `${baseUrl}?bvid=${bvid}&page=${page}&t=${Math.floor(timeInSeconds)}&high_quality=1&autoplay=1`;
        
        playerFrame.src = newSrc;
    }
    ```

## 6. 关键风险与对策 (Risk & Mitigation)

### 6.1 B站防盗链与跨域策略
*   **风险**：B站有时会限制 Iframe 在非白名单域名的播放，或者强制跳转回 B站 App。
*   **对策**：
    *   在 HTML `<head>` 中添加 Meta 标签：`<meta name="referrer" content="no-referrer">`。这通常能绕过基础的防盗链检查，允许视频在第三方站点加载。

### 6.2 视频失效风险
*   **风险**：UP 主删除了视频或视频被 B站下架，导致索引对应的 BVID 失效。
*   **对策**：
    *   前端处理 `iframe` 加载错误很难（因为跨域），但可以增加“报错/失效反馈”按钮。
    *   定期运行脚本检查 BVID 的 HTTP 状态码（轻量级检查）。

### 6.3 时间轴精度误差
*   **风险**：B站 Iframe 的 `t` 参数通常只支持整数秒，且关键帧（Keyframe）可能导致跳转位置有 1-2 秒的偏差。
*   **对策**：
    *   在生成索引时，将 `Start_Time` 统一**前移 2 秒**写入 JSON。例如单词在 10.5s，索引存 8s。宁可早到多听一会，也不能晚到导致单词被切掉。

## 7. 开发环境与依赖
*   **本地开发**：Python 3.8+ (用于跑 Whisper 和下载脚本)。