# 代码质量改进项 (Code Quality TODOs)

## 1. 类型安全改进 (移除 `any`)
发现 **14** 处使用了 `any`，应使用适当的 TypeScript 接口进行优化：

- **src/services/db.ts**:
  - `questionsJson: { ... } | any`
  - `questions: any` (快照)
  - `userAnswers: any`
- **src/services/llmService.ts**
  - `Promise<{ readingQuestions: any[]; vocabularyQuestions: any[] }>`
  - `catch (error: any)`
- **src/pages/HomePage.tsx**
  - `calculateStats(..., quizzes: any[])`
- **src/pages/SettingsPage.tsx**
  - `words: any[]`
  - `setArticleLen(e.target.value as any)`
  - `setDifficultyLevel(e.target.value as any)`
- **src/components/common/StatusBadge.tsx**
  - `statusConfig: ... { icon: any; ... }`
- **src/pages/ReadingPage.tsx**
  - `location.state as any`
  - `settings: any`
  - `(error as any).name`

## 2. 组件重构 (拆分大文件)
以下组件超过 300 行，建议进行拆解：

- **[关键] src/pages/ReadingPage.tsx** (~950 行) - *急需重构*。
- **src/components/reading/VocabularyQuestionRenderer.tsx** (409 行)
- **src/components/reading/GenerationLoading.tsx** (361 行)
- **src/pages/SettingsPage.tsx** (360 行)
- **src/components/WordDetailModal.tsx** (306 行)
- **src/pages/LibraryPage.tsx** (300 行)

## 3. 配置管理 (硬编码 URL)
将以下硬编码的字符串提取到 `.env` 文件或本地化的常量配置中：

- **src/services/llmService.ts**:
  - `https://api.deepseek.com/v1` (发现 2 处)
- **src/services/dictionaryService.ts**:
  - `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`

## 4. 遗留代码
- **类组件**: 未发现。 (干得好！)

## 5. 近期已完成任务 (Recently Completed)
- [x] 重构 `QuizHistoryPage` 列表样式，与 Library 保持一致
- [x] 优化 `ReadingPage` 侧边栏历史记录显示 (单行布局、时间格式优化)
- [x] 修复 `QuizResultPage` 返回按钮逻辑 (`navigate(-1)`)
- [x] 优化 `ReadingPage` 加载体验 (引入 `initializing` 状态，消除已有文章的 Loading 闪烁)
