# V4.0 升级任务拆分方案

基于 `prd_v4.0_exam_upgrade.md`，我将 V4.0 的开发过程拆解为 **4 个独立的任务**。这些任务按依赖关系排序，请按顺序执行。

**升级原则：**
- **数据先行**：先完成数据库和接口定义的变更。
- **服务跟进**：升级 LLM 服务以支持新数据结构。
- **UI 重构**：最后调整前端界面和交互逻辑。

---

## 任务 1：难度自适应基础 (The Foundation)

**目标**：更新数据模型以支持难度分级，并在设置页面提供手动切换入口。

**核心工作：**
- 修改 `src/services/db.ts`，更新 `Setting` 和 `History` 接口。
- 修改 `src/services/settingsService.ts`，确保新字段有默认值。
- 更新 `SettingsPage`，添加“难度等级”选择器 (L1/L2/L3)。

**输入给大模型的内容：**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"3. 数据模型调整"和"2.1 用户难度档案"部分，完成以下工作：

1. 数据库更新 (`src/services/db.ts`)：
   - 更新 `Setting` 接口：新增 `difficultyLevel: 'L1' | 'L2' | 'L3'`。
   - 更新 `History` 接口：
     - `questionsJson` 类型改为 `{ reading: any[], vocabulary: any[] }` (注意兼容旧数据)。
     - 新增 `wordResults: { [spelling: string]: boolean }`。

2. 设置服务更新 (`src/services/settingsService.ts`)：
   - 在 `getSettings` 中，如果 `difficultyLevel` 不存在，默认初始化为 `'L2'`。

3. 设置页面 (`src/pages/SettingsPage.tsx`)：
   - 新增一个“难度设置”区域。
   - 使用 `ToggleButtonGroup` 或 `Select` 让用户选择 L1 (基础), L2 (进阶), L3 (挑战)。
   - 保存时更新数据库。
```

**验收标准：**
- ✅ 可以在设置页面切换难度等级，并持久化保存。
- ✅ 检查 IndexedDB，`settings` 表中包含 `difficultyLevel` 字段。

---

## 任务 2: LLM 服务升级 (The Brain)

**目标**: 升级 Prompt,使其支持动态难度调整,并生成包含"阅读理解"和"词汇专项"的双重试题结构。词汇专项需根据难度等级生成**完整版**的题型组合。

**核心工作:**
- 修改 `GeneratedContent` 接口定义,支持 8 种题型。
- 更新 `llmService.ts` 中的 System Prompt,支持完整的分级题型生成。
- 更新 `mockLLMService.ts` 以返回符合新结构的数据（用于测试）。

**输入给大模型的内容:**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"2.2 动态文章生成"和"2.5 词汇专项题型设计"部分,升级 LLM 服务:

1. 类型定义更新:
   - 修改 `GeneratedContent` 接口:
     - 删除旧的 `questions` 数组。
     - 新增 `readingQuestions` (4题, choice)。
     - 新增 `vocabularyQuestions`,需支持 8 种题型:
       - type: 'cloze' | 'definition' | 'spelling' | 'contextual' | 'audio' | 'wordForm' | 'synonym' | 'matching'
       - 每个题目包含: id, targetWord, type, stem, options (某些题型可能没有), answer
       - 音频题型额外包含: audioUrl
       - 匹配题型额外包含: pairs

2. `llmService.ts` 升级:
   - `generateArticle` 函数新增参数 `difficultyLevel`。
   - **System Prompt 调整**:
     - 注入难度要求: `appropriate for reading level **${difficultyLevel}** (CEFR Standard)`.
     - 注入结构要求: 输出 JSON 需包含 `readingQuestions` (4题) 和 `vocabularyQuestions`。
     - **关键**: 明确 `vocabularyQuestions` 的完整版题型配置要求:
       - **L1 (基础) - 10题**:
         * 完形填空(3) + 词义辨析(3,中英双语) + 音频跟读选择(2) + 英英释义匹配(1组3对)
       - **L2 (进阶) - 10题**:
         * 情境应用(4) + 拼写输入(2) + 完形填空(2) + 同义/反义词(1) + 音频听写选择(1)
       - **L3 (挑战) - 12题**:
         * 拼写输入(3) + 情境应用(3) + 词形变换(2) + 音频完整听写(2) + 同义/反义词(1) + 英英释义匹配(1组3对)
     - 强调干扰项质量要求（词性相同、拼写相近或语义相关）。
     - 音频题型说明: 提供单词的音标,前端使用 TTS API 生成音频。

3. `mockLLMService.ts` 同步更新:
   - 构造符合新结构的 Mock 数据,包含所有题型的示例。
   - 确保 Mock 数据覆盖所有三个难度等级的完整题型组合。
```

**验收标准:**
- ✅ 调用 `mockLLMService.generateArticle` 返回的数据包含 `readingQuestions` (4个) 和完整版的 `vocabularyQuestions`（L1/L2为10题,L3为12题）。
- ✅ `llmService` 的 Prompt 中正确包含了难度等级参数和完整版分级题型要求。
- ✅ Mock 数据能够覆盖 L1/L2/L3 三个等级的所有题型（包括音频和匹配）。

---

## 任务 3：考试模块重构 (The Exam)

**目标**：重构答题界面，支持分步答题（阅读题 -> 词汇题），并实现精准的 SRS 状态更新。词汇题部分需支持**所有 8 种题型**的渲染和交互。

**核心工作：**
- 重构 `QuizView` 组件，支持多步骤向导式答题。
- 实现所有词汇题型的 UI 组件（选择题、输入题、匹配题、音频题）。
- 集成 TTS 服务用于音频题型。
- 更新 `ReadingPage` 的 `handleQuizSubmit` 逻辑。
- 实现精准的 SRS 更新逻辑（基于词汇题结果）。

**输入给大模型的内容：**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"2.6 交互流程优化"和"4.1 开发优先级"部分，重构考试模块：

1. 组件重构 (`src/components/reading/QuizView.tsx`)：
   - 将界面改为两步走 (Stepper)：
     - **Step 1**: 阅读理解 (Reading Comprehension)，展示 4 道单选题。
     - **Step 2**: 词汇专项 (Vocabulary Mastery)，展示完整版的词汇测试题（L1/L2为10题，L3为12题）。
   - **Step 2 需支持所有 8 种题型**：
     - **选择题类型** (cloze, definition, contextual, synonym)：使用 RadioGroup
     - **输入题类型** (spelling, wordForm)：使用 TextField
     - **匹配题类型** (matching)：自定义匹配组件（下拉选择或拖拽）
     - **音频题类型** (audio)：音频播放器 + 选择/输入
   - 只有完成 Step 1 才能进入 Step 2。
   - 提交时返回两部分的答案。

2. 题型组件开发（完整版）：
   - 创建 `VocabularyQuestionRenderer` 组件，根据题目的 `type` 字段渲染不同的 UI：
     - `type: 'cloze' | 'definition' | 'contextual' | 'synonym'` → RadioGroup (选择题)
     - `type: 'spelling' | 'wordForm'` → TextField (输入题)
     - `type: 'matching'` → 自定义匹配组件:
       * 可使用多个下拉选择框
       * 或实现拖拽式配对界面
       * 确保在 iPad 上触控友好
     - `type: 'audio'` → 音频播放组件:
       * 使用 Web Speech API 或第三方 TTS
       * 根据题目的 audioUrl 或音标生成/播放音频
       * 支持重复播放
       * L1/L2 提供选项，L3 为输入框
   - 确保各题型的用户答案能够正确收集和验证。

3. TTS 服务集成 (`src/services/ttsService.ts`)：
   - 实现音频生成逻辑：
     * 优先使用浏览器原生 `window.speechSynthesis`
     * 或集成免费 TTS API（如 Google Cloud TTS、Azure TTS 等）
   - 提供 `playWord(word: string, phonetic?: string)` 方法
   - 处理音频加载失败的降级方案

4. 逻辑集成 (`src/pages/ReadingPage.tsx`)：
   - 更新 `handleQuizSubmit`：
     - 接收两部分答案（阅读题 + 词汇题）。
     - **SRS 更新**：遍历 `vocabularyQuestions` 的结果。
       - 答对 -> `SRSAlgorithm.calculateNextReview(word, true)`
       - 答错 -> `SRSAlgorithm.calculateNextReview(word, false)`
     - **保存历史**：将详细的答题结果保存到 `History` 表，包含题型信息。

注意：阅读理解的得分仅用于展示和后续的难度调整，不直接影响单词 SRS。
```

**验收标准：**
- ✅ 答题界面变为两步，先做阅读题，再做词汇题。
- ✅ 词汇题部分能够正确渲染所有 8 种题型。
- ✅ 音频题型能够正常播放单词发音，支持重复播放。
- ✅ 匹配题型提供直观的配对操作界面。
- ✅ 所有题型的答案能够正确收集和验证。
- ✅ 答完题后，单词的 SRS 状态根据**词汇题**的对错正确更新。
- ✅ 历史记录中正确保存了详细的答题数据（包括题型信息）。
- ✅ 在 iPad 等触控设备上操作流畅。

---

## 任务 4：难度自动调整 (The Auto-Pilot)

**目标**：实现基于答题表现的难度自动升降级逻辑。

**核心工作：**
- 在 `ReadingPage` 完成答题后触发调整逻辑。
- 实现升级/降级判定算法。
- 添加 UI 反馈 (Toast)。

**输入给大模型的内容：**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"2.3 难度动态调整逻辑"部分，实现自动调整：

1. 逻辑实现 (`src/pages/ReadingPage.tsx` 或独立 Hook)：
   - 在 `handleFinish` (提交反馈后) 中执行检查。
   - **升级条件**：阅读理解 4 题全对 且 用户反馈难度 <= 2 (简单)。
     - 动作：`difficultyLevel` 提升一级 (L1->L2, L2->L3)。
   - **降级条件**：阅读理解答对 < 2 题 且 用户反馈难度 = 5 (太难)。
     - 动作：`difficultyLevel` 降低一级 (L3->L2, L2->L1)。
   - **保持**：其他情况不变。

2. 状态更新：
   - 调用 `settingsService.saveSettings` 更新难度。
   - 如果发生调整，弹出 Toast 提示用户（如“难度已提升至 L3”）。
```

**验收标准：**
- ✅ 模拟全对且反馈简单，难度等级自动提升。
- ✅ 模拟低分且反馈太难，难度等级自动降低。
- ✅ 调整时有明确的 UI 提示。

---

## 给您的操作建议

1.  **Mock 数据先行**：在做任务 3（UI 重构）时，务必先确保任务 2 中的 `mockLLMService` 已经返回了正确的新结构数据，否则 UI 会报错。
2.  **兼容性注意**：`History` 表的 `questionsJson` 结构发生了变化。在展示历史记录（`HistoryPage`）时，可能需要做防卫性编程，判断是旧结构（数组）还是新结构（对象），防止页面崩溃。
