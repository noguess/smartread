# V5.0 功能想法草稿
## 背单词模块 (Word Memorization Module) - Final Spec

### 1. 核心流程 (Core Flow)
*   **入口**: “今日特训” (Daily Drill)，设置每日目标 (如 20 个)。
*   **P1 选兵 (Selection)**:
    *   基于 SRS 算法推荐一批候选词 (默认 20 个)。
    *   **交互**: 列表展示。用户可移除“已熟知”单词。确认后生成“今日生词表”。
*   **P2 练兵 (Drill) - 四步进阶法**:
    *   **Round 1: 跟读 (Teach)**: 显示中英文。TTS 领读 -> 用户跟读英文 (ASR验证) -> 建立初始连接。
    *   **Round 2: 自读 (Practice)**: 显示中英文。无 TTS -> 用户看音标自读英文 (ASR验证) -> 强化发音。
    *   **Round 3: 看译 (Visual Test)**: **只显示英文**。用户看词 -> 说出中文 (ASR录入) -> 批量判卷。
    *   **Round 4: 听译 (Audio Test)**: **隐藏英文**。TTS 读音 -> 用户说出中文 (ASR录入) -> 批量判卷。
    *   *错题机制*: Round 3/4 错误的词自动打回 Round 1 重修。
*   **P3 阅兵 (Exam) - 最终考核**:
    *   **场景**: 所有特训通关后的终极测试。
    *   **双重验证**:
        1.  **读英文**: 调用 ASR (en-US)。
        2.  **说中文**: 调用 ASR (zh-CN)。
    *   **通关**: 正确率 > 90% 方可更新 SRS 状态并解锁文章生成。

### 2. 技术关键点 (Technical Key Points)
*   **ASR**: 使用 `SpeechRecognition` API。需分装 `SpeechService` 以支持更丝滑的语言切换 (En <-> Zh) 和错误处理。
*   **LLM Grading**: 仅在最后一步调用，避免网络卡顿影响心流。
*   **SRS**: 只有“通关”后才计算艾宾浩斯间隔更新。

### 3. SRS 算法策略 (Weighted SRS Strategy)
*   **单一真理 (Single Source)**: 所有模块(阅读/特训)共享同一个 `NextReviewDate`，但权重不同。
*   **权重分级**:
    *   **Low Quality (阅读 Quiz)**: 答对仅算 "Easy Recall"，间隔增长系数小 (x1.2)。
    *   **High Quality (每日特训)**: 听说通过算 "Active Mastery"，间隔增长系数大 (x2.5)。
*   **新词晋升**: 单词必须经过至少一次“每日特训”才能从 `New` 晋升为 `Review`，阅读中的被动遇到不触发晋升。