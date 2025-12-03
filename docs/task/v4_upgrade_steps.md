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

## 任务 2：LLM 服务升级 (The Brain)

**目标**：升级 Prompt，使其支持动态难度调整，并生成包含“阅读理解”和“词汇专项”的双重试题结构。

**核心工作：**
- 修改 `GeneratedContent` 接口定义。
- 更新 `llmService.ts` 中的 System Prompt。
- 更新 `mockLLMService.ts` 以返回符合新结构的数据（用于测试）。

**输入给大模型的内容：**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"2.2 动态文章生成"和"2.4 试题结构升级"部分，升级 LLM 服务：

1. 类型定义更新：
   - 修改 `GeneratedContent` 接口：
     - 删除旧的 `questions` 数组。
     - 新增 `readingQuestions` (4题, choice)。
     - 新增 `vocabularyQuestions` (针对核心单词, cloze/definition)。

2. `llmService.ts` 升级：
   - `generateArticle` 函数新增参数 `difficultyLevel`。
   - **System Prompt 调整**：
     - 注入难度要求：`appropriate for reading level **${difficultyLevel}** (CEFR Standard)`.
     - 注入结构要求：输出 JSON 需包含 `readingQuestions` (4题) 和 `vocabularyQuestions` (针对 Target Words)。
     - 明确 `vocabularyQuestions` 的题型要求（完形填空或释义选择）。

3. `mockLLMService.ts` 同步更新：
   - 构造一个符合新结构的 Mock 数据返回，确保前端开发时不会报错。
```

**验收标准：**
- ✅ 调用 `mockLLMService.generateArticle` 返回的数据包含 `readingQuestions` (4个) 和 `vocabularyQuestions`。
- ✅ `llmService` 的 Prompt 中正确包含了难度等级参数。

---

## 任务 3：考试模块重构 (The Exam)

**目标**：重构答题界面，支持分步答题（阅读题 -> 词汇题），并实现精准的 SRS 状态更新。

**核心工作：**
- 重构 `QuizView` 组件，支持多步骤向导式答题。
- 更新 `ReadingPage` 的 `handleQuizSubmit` 逻辑。
- 实现精准的 SRS 更新逻辑（基于词汇题结果）。

**输入给大模型的内容：**
```markdown
请根据 prd_v4.0_exam_upgrade.md 中"2.6 交互流程优化"部分，重构考试模块：

1. 组件重构 (`src/components/reading/QuizView.tsx`)：
   - 将界面改为两步走 (Stepper)：
     - **Step 1**: 阅读理解 (Reading Comprehension)，展示 4 道单选题。
     - **Step 2**: 词汇专项 (Vocabulary Mastery)，展示核心单词的测试题。
   - 只有完成 Step 1 才能进入 Step 2。
   - 提交时返回两部分的答案。

2. 逻辑集成 (`src/pages/ReadingPage.tsx`)：
   - 更新 `handleQuizSubmit`：
     - 接收两部分答案。
     - **SRS 更新**：遍历 `vocabularyQuestions` 的结果。
       - 答对 -> `SRSAlgorithm.calculateNextReview(word, true)`
       - 答错 -> `SRSAlgorithm.calculateNextReview(word, false)`
     - **保存历史**：将详细的答题结果保存到 `History` 表的新字段中。

注意：阅读理解的得分仅用于展示和后续的难度调整，不直接影响单词 SRS。
```

**验收标准：**
- ✅ 答题界面变为两步，先做阅读题，再做词汇题。
- ✅ 答完题后，单词的 SRS 状态（下次复习时间）根据**词汇题**的对错正确更新。
- ✅ 历史记录中正确保存了详细的答题数据。

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
