# 英语中考备考智能阅读平台 - 产品需求文档 (PRD) V4.0

| 项目属性 | 内容 |
| :--- | :--- |
| **项目名称** | 英语中考智能阅读平台 (Smart Reader) |
| **版本号** | **V4.0** |
| **日期** | 2025-12-03 |
| **版本定位** | 考试系统重构与难度自适应版本 |
| **核心目标** | 建立用户难度档案，实现文章难度动态调整；重构考试模块，引入词汇专项测试，实现对核心单词的精准考核。 |
| **适用终端** | iPad (首选) / PC / Mac (Web Browser) |

---

## 1. V4.0 版本概述

### 1.1 版本背景
在 V3.0 完成了单词学习深度的挖掘（音标、词典、时长统计）后，V4.0 将回归核心业务——**“阅读与测试”**。目前的文章生成难度单一，无法适应不同水平的学生；且试题仅有简单的阅读理解，无法精准验证学生是否真正掌握了本次学习的“核心单词”。

### 1.2 核心升级方向
本版本聚焦于**“难度自适应”**与**“精准考核”**两大方向：

1.  **📈 难度自适应系统 (Adaptive Difficulty System)**
    *   建立用户难度档案，量化用户阅读能力。
    *   实现基于 CEFR 标准的动态文章生成。
    *   提供难度反馈与自动调整机制。

2.  **📝 考试模块重构 (Exam Module Refactor)**
    *   引入**“词汇专项测试”**，针对核心单词生成完形填空或词义辨析题。
    *   试题结构化升级，区分“阅读理解”与“词汇考核”。
    *   精准反馈：单词掌握状态直接由词汇题结果决定。

---

## 2. 详细需求规格

### � 需求一：难度自适应系统

#### 2.1 用户难度档案
在 `Settings` 或 `UserProfile` 中新增难度配置：
*   **难度等级 (Difficulty Level)**：
    *   **L1 (基础/初一)** -> 对应 Prompt: `CEFR A1` (词汇量 ~800)
    *   **L2 (进阶/初二)** -> 对应 Prompt: `CEFR A2` (词汇量 ~1500)
    *   **L3 (挑战/中考)** -> 对应 Prompt: `CEFR B1` (词汇量 ~2000+)
*   **初始设置**：用户首次进入 V4.0 时，引导选择初始难度（默认 L2）。

#### 2.2 动态文章生成
修改 `llmService`，将用户当前的难度等级注入到 System Prompt 中。
*   **Prompt 调整**：
    *   原：`...appropriate for the student's reading level (CEFR A2-B1).`
    *   新：`...appropriate for reading level **${userLevel}** (CEFR Standard).`

#### 2.3 难度动态调整逻辑
*   **触发时机**：每次完成 Quiz 并提交反馈后。
*   **调整规则**：
    *   **升级 (Upgrade)**：连续 3 次阅读理解全对 (4/4) 且 用户反馈难度为“简单(1-2星)”。
    *   **降级 (Downgrade)**：连续 2 次阅读理解不及格 (<2/4) 且 用户反馈难度为“太难(5星)”。
    *   **保持**：其他情况。
*   **UI 反馈**：难度发生变化时，Toast 提示用户：“恭喜！你的阅读等级已提升至 L3！”或“已为你调整文章难度，巩固基础。”

---

### 📝 需求二：考试模块重构与词汇专项测试

#### 2.4 试题结构升级
将原本单一的 `questions` 数组拆分为两部分，以支持更丰富的题型。

**新的数据结构 (GeneratedContent)**：
```typescript
interface GeneratedContent {
  title: string;
  content: string;
  // Part 1: 阅读理解 (Reading Comprehension) - 考察文章大意
  readingQuestions: {
    id: string;
    type: 'choice';
    stem: string; // 题干
    options: string[];
    answer: string;
  }[];
  // Part 2: 词汇专项 (Vocabulary Mastery) - 考察核心单词
  vocabularyQuestions: {
    id: string;
    targetWord: string; // 关联的核心单词
    type: 'cloze' | 'definition'; // 完形填空 或 释义选择
    stem: string; // 题干 (若是 cloze，则为挖空的句子)
    options: string[];
    answer: string;
  }[];
}
```

#### 2.5 词汇专项题型设计
针对本次生成的文章中包含的 **Target Words**（核心单词），生成对应的测试题。

*   **题型 A：完形填空 (Cloze)**
    *   **逻辑**：选取文章中包含该单词的原句，将该单词挖空。
    *   **选项**：正确单词 + 3 个干扰项（词性相同、拼写相近或语义相关的词）。
    *   **Prompt**：`Create a cloze question for word "${word}" using the sentence from the text: "${sentence}".`

*   **题型 B：词义辨析 (Definition)**
    *   **逻辑**：给出单词，要求选出正确的英文释义或中文含义（视 Prompt 设定，建议英文释义以培养语感）。
    *   **Prompt**：`Select the correct definition for "${word}".`

#### 2.6 交互流程优化
1.  **阅读页面**：保持不变。
2.  **Quiz 页面**：
    *   **Step 1**: 展示 `readingQuestions` (4题)，确认文章理解。
    *   **Step 2**: 展示 `vocabularyQuestions` (核心单词数，如 5-10 题)，逐个击破。
3.  **结果反馈 (ScoreFeedback)**：
    *   **总分计算**：加权计算，阅读理解占 40%，词汇题占 60%。
    *   **SRS 状态更新 (关键)**：
        *   **旧逻辑**：根据总分一刀切更新所有单词状态。
        *   **新逻辑 (精准)**：
            *   某单词在 `vocabularyQuestions` 中**答对** -> 该单词 SRS 标记为 **Pass** (增加间隔)。
            *   某单词在 `vocabularyQuestions` 中**答错** -> 该单词 SRS 标记为 **Fail** (重置/缩短间隔)。
            *   (阅读理解题仅用于调整难度等级，不直接影响单词 SRS)。

---

## 3. 数据模型调整 (Data Schema Updates)

### 3.1 Settings 表更新
```typescript
interface Setting {
  // ... 原有字段
  difficultyLevel: 'L1' | 'L2' | 'L3'; // 新增：当前难度等级
  difficultyHistory: { date: number, level: string, reason: string }[]; // 可选：记录难度变更历史
}
```

### 3.2 History 表更新
需存储更详细的答题记录，以便后续分析。
```typescript
interface History {
  // ... 原有字段
  // 兼容旧数据，新结构存储在 questionsJson 中
  questionsJson: {
    reading: any[];
    vocabulary: any[];
  };
  // 记录每个单词的具体掌握情况
  wordResults: { [spelling: string]: boolean }; // { "apple": true, "banana": false }
}
```

---

## 4. 实施计划

### 4.1 开发优先级
1.  **P0**: 修改 `llmService` Prompt，支持生成 `readingQuestions` 和 `vocabularyQuestions` 双重结构。
2.  **P0**: 重构 `QuizView` 组件，支持分步答题（阅读题 -> 词汇题）。
3.  **P1**: 实现 `Settings` 中的难度等级存储与管理。
4.  **P1**: 升级 `ReadingPage` 的 `handleQuizSubmit` 逻辑，实现精准的 SRS 状态更新。
5.  **P2**: 实现难度自动调整算法 (Auto-Adjustment Logic)。

### 4.2 技术难点预判
*   **Prompt 复杂度**：要求 LLM 同时生成文章、阅读题和针对特定单词的词汇题，Prompt 会比较长且复杂，需反复调试以保证 JSON 格式稳定。
*   **干扰项生成**：生成高质量的干扰项（Distractors）是难点，如果干扰项太假（如词性不同），题目就没有意义。需在 Prompt 中强调干扰项的质量。

---

**文档维护：**
本 PRD 由产品团队维护。
**最后更新：** 2025-12-03
