
# 产品需求文档 (PRD) - 英语单词视频定位服务 (Video Word Locator)

| 文档版本 | 修改日期 | 修改人 | 备注 |
| :--- | :--- | :--- | :--- |
| V1.0 | 202X-XX-XX | [你的名字] | 初始版本创建 |
| V1.2 | 202X-XX-XX | [你的名字] | **架构修正**：明确“非破坏性”处理原则，严禁切分视频文件，强调基于时间轴的跳转机制 |

## 1. 项目背景与目标

### 1.1 项目背景
用户拥有大量完整的英语讲解视频文件。当需要学习特定单词时，用户希望直接跳转到原视频中讲解该单词的片段，而不是在一堆被切碎的短视频文件中寻找，或者手动拖动进度条盲找。

### 1.2 项目目标
开发一套**基于时间轴索引的检索服务**。
1.  **完整性保持**：不对原始视频进行任何切割、转码或修改，保持视频文件的完整性。
2.  **精准定位**：通过语音识别生成时间轴索引，前端通过控制播放器进度条（Seek）实现“指哪打哪”。
3.  **轻量化架构**：Python 离线生成索引数据 + 前端静态页面读取，无数据库服务。

## 2. 需求范围 (Scope)

### 2.1 包含内容 (In Scope)
*   **音频提取与分析**：从完整视频中提取音频流进行识别。
*   **时间轴映射**：建立“单词 -> [视频文件引用, 时间点]”的索引。
*   **前端播放控制**：前端根据索引数据，控制 `<video>` 标签自动跳转到指定时间（`currentTime`）。
*   **数据清洗**：词形还原、停用词过滤。

### 2.2 不包含内容 (Out of Scope)
*   **视频剪辑/切片**：**严禁**将长视频物理切割成短片段。
*   **视频转码**：假设输入视频已是浏览器可播放格式（如 MP4/WebM）。如果格式不支持，建议人工预处理，本项目不自动转码。
*   **在线存储**：视频文件存储在本地磁盘或静态文件服务器，通过路径引用。

## 3. 详细功能需求 (Functional Requirements)

### 3.1 视频分析与元数据提取 (Non-destructive Processing)
*   **输入**：包含视频文件的根目录。
*   **处理逻辑**：
    1.  **只读操作**：程序**只读取**视频文件，不进行任何写入或分割操作。
    2.  **临时音频提取**：使用 `ffmpeg` 将视频的音频流提取到内存或临时文件夹（分析完即删），用于 ASR 识别。
    3.  **时间轴获取**：调用 WhisperX/Stable-Whisper 获取单词级的 `Start_Time`。
*   **输出**：仅生成 JSON 索引文件，原视频文件保持不动。

### 3.2 索引构建 (Indexing)
*   **核心逻辑**：将 ASR 识别出的单词及其在**原视频中的绝对时间戳**存入数据库。
*   **数据清洗**：
    *   **词形还原**：搜索 "run" 能找到 "running"。
    *   **停用词过滤**：忽略 "the", "a" 等无意义词汇。

### 3.3 前端播放与跳转 (Frontend Playback)
*   **交互逻辑**：
    1.  用户搜索单词。
    2.  列表展示包含该单词的视频及上下文例句。
    3.  用户点击某一条目。
    4.  **关键行为**：播放器加载对应的**完整视频文件**，并立即执行 `video.currentTime = Start_Time`，然后开始播放。

## 4. 数据结构规范 (Data Specification)

### 4.1 视频映射表 (video_map.json)
将视频路径映射为 ID，避免索引冗余。
```json
{
  "0": "videos/Lesson01_Full.mp4",
  "1": "videos/Movie_Scene_Complete.mp4"
}
```

### 4.2 倒排索引分片 (例如 index_a.json)
*   **Key**: 单词原型 (Lemma)。
*   **Value**: 数组，存储跳转坐标。
*   **Start/End**: 对应**原视频**中的秒数。

```json
{
  "abandon": [
    {
      "v": 0,                // 引用 video_map 中的 "videos/Lesson01_Full.mp4"
      "t": [120.5, 121.2],   // 单词在原视频第 2分00.5秒 出现
      "c": "never abandon your dreams" // 上下文用于展示，不用于播放
    }
  ]
}
```

## 5. 非功能需求 (Non-Functional Requirements)

### 5.1 准确性
*   **时间戳精度**：ASR 必须输出准确的 Word-level 时间戳。如果单词在视频的 10:00 处，跳转时间应为 9:59 (提前1秒缓冲) 以确保发音完整。

### 5.2 性能与存储
*   **零冗余存储**：除了生成的 JSON 索引（KB/MB级别），不产生任何额外的视频文件副本。

## 6. 技术实现路径建议 (Implementation Strategy)

### 6.1 后端处理栈 (Python)
*   **FFmpeg (python-ffmpeg)**: 仅用于 `input_video -> extract_audio_stream -> pipe_to_whisper`。**不要使用 `trim` 或 `segment` 滤镜。**
*   **WhisperX**: 用于生成带时间戳的字幕数据。
*   **逻辑伪代码**:
    ```python
    # 错误做法 (严禁)
    # ffmpeg.input(video).trim(start, end).output(clip).run()
    
    # 正确做法
    audio_file = extract_audio_temp(original_video_path)
    result = whisperx_model.transcribe(audio_file)
    # result 包含: word="hello", start=10.5, end=11.0
    # 将 10.5 写入 JSON，不修改视频
    ```

### 6.2 前端实现栈 (HTML/JS)
*   **HTML5 Video API**:
    ```javascript
    const videoPlayer = document.getElementById('mainPlayer');
    
    function jumpToWord(videoPath, startTime) {
        // 1. 如果当前视频源不同，则切换源
        if (videoPlayer.getAttribute('src') !== videoPath) {
            videoPlayer.src = videoPath;
            videoPlayer.load();
        }
        
        // 2. 等待元数据加载后跳转
        videoPlayer.onloadedmetadata = () => {
            videoPlayer.currentTime = Math.max(0, startTime - 0.5); // 提前0.5秒缓冲
            videoPlayer.play();
        };
        
        // 3. 如果视频已经加载好了，直接跳转
        if (videoPlayer.readyState >= 1) {
             videoPlayer.currentTime = Math.max(0, startTime - 0.5);
             videoPlayer.play();
        }
    }
    ```

## 7. 风险与对策
*   **风险**：浏览器对本地视频文件的访问限制（CORS/File Protocol）。
*   **对策**：
    *   建议使用 `http-server` (Node.js) 或 `python -m http.server` 在本地启动一个微型静态服务器来托管视频和 JSON 文件，而不是直接双击 HTML 打开。