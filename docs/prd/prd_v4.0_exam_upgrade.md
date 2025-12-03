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
    // 支持多种题型，根据难度等级动态生成
    type: 'cloze' | 'definition' | 'spelling' | 'contextual' | 'audio' | 'wordForm' | 'synonym' | 'matching';
    stem: string; // 题干 (若是 cloze，则为挖空的句子；若是 matching，则为配对说明)
    options?: string[]; // 选择题型有options，输入题型无options
    answer: string | string[]; // 单个答案或多个答案（matching题型）
    audioUrl?: string; // 音频题型专用
    pairs?: { word: string; definition: string }[]; // 匹配题型专用
  }[];
}
```

> [!NOTE]
> `vocabularyQuestions` 中的 `type` 字段决定了题目的展示形式：
> - **选择类**: `cloze`, `definition`, `contextual`, `synonym` - 需要 `options` 数组
> - **输入类**: `spelling`, `wordForm` - 不需要 `options`，用户直接输入
> - **匹配类**: `matching` - 需要 `pairs` 数组
> - **音频类**: `audio` - 需要 `audioUrl`，可能还需要 `options`（听音选择）或无（听音输入）

#### 2.5 词汇专项题型设计 (Adaptive Question Types)

> [!IMPORTANT]
> V4.0 词汇测试采用**难度自适应题型系统**，根据用户当前的 `difficultyLevel` 动态生成不同类型和数量的题目，确保各等级都有适度挑战和多样化体验。

##### 2.5.1 题型设计理念
- **L1 (基础/初一)**: 侧重"多角度认知强化"，全部为选择/匹配题，通过多种题型反复考察同一批单词
- **L2 (进阶/初二)**: 侧重"情境迁移与主动回忆"，引入拼写输入，强化在不同场景下正确使用单词的能力
- **L3 (挑战/中考)**: 侧重"综合能力与实战模拟"，增加输入题占比，模拟真实中考场景

##### 2.5.2 分级题型配置表

**L1 (基础) - 10题**

| 题型 | 数量 | 占比 | 难度 | 详细说明 |
|------|------|------|------|----------|
| 完形填空 (原文挖空) | 3题 | 30% | ⭐⭐ | 直接来源于文章原句，降低难度 |
| 词义辨析 (中英双语释义) | 3题 | 30% | ⭐ | 选择题，提供中文释义辅助 |
| 音频跟读选择 (听音选词) | 2题 | 20% | ⭐⭐ | 播放发音，从4个选项中选出正确拼写 |
| 英英释义匹配 | 1组(3对) | 20% | ⭐⭐ | 连线匹配，批量复习 |

**L2 (进阶) - 10题**

| 题型 | 数量 | 占比 | 难度 | 详细说明 |
|------|------|------|------|----------|
| 情境应用题 (新场景选择) | 4题 | 40% | ⭐⭐⭐ | 非原文语境，考察迁移应用 |
| 拼写输入题 (释义→拼写) | 2题 | 20% | ⭐⭐⭐⭐ | 给英文释义+音标，输入拼写 |
| 完形填空 (原文挖空) | 2题 | 20% | ⭐⭐ | 保留基础题，稳固信心 |
| 同义词/反义词选择 | 1题 | 10% | ⭐⭐⭐ | 扩展语义网络 |
| 音频听写选择 (听音选词) | 1题 | 10% | ⭐⭐⭐ | 听音从选项中选出，非完全输入 |

**L3 (挑战) - 12题**

| 题型 | 数量 | 占比 | 难度 | 详细说明 |
|------|------|------|------|----------|
| 拼写输入题 (释义→拼写) | 3题 | 25% | ⭐⭐⭐⭐⭐ | 纯英文释义，无中文提示 |
| 情境应用题 (复杂语境) | 3题 | 25% | ⭐⭐⭐⭐ | 长句子，需深度理解 |
| 词形变换题 (语法结合) | 2题 | 17% | ⭐⭐⭐⭐ | 根据语境填写正确词形 |
| 音频完整听写 (输入拼写) | 2题 | 17% | ⭐⭐⭐⭐⭐ | 听音后完全输入，无选项 |
| 同义词/反义词选择 | 1题 | 8% | ⭐⭐⭐ | 语义网络 |
| 英英释义匹配 | 1组(3对) | 8% | ⭐⭐⭐ | 批量快速复习 |

##### 2.5.3 题型详细定义

**① 完形填空 (Cloze) - 原文挖空**
- **逻辑**: 选取文章中包含该单词的原句，将该单词挖空
- **选项**: 正确单词 + 3个干扰项（词性相同、拼写相近或语义相关）
- **Prompt**: `Create a cloze question for word "${word}" using the sentence from the text: "${sentence}".`

**② 词义辨析 (Definition) - 中英双语 (L1专属)**
- **逻辑**: 给出单词，要求选出正确含义
- **选项**: 提供中英文双语释义，降低认知门槛
- **Prompt**: `Select the correct definition for "${word}" with both Chinese and English meanings.`

**③ 拼写输入题 (Spelling Input)**
- **逻辑**: 给出释义和音标，要求用户输入完整拼写
- **L2**: 可提供英文释义，部分中文提示
- **L3**: 纯英文释义，无中文提示
- **Prompt**: `Write the correct word based on the definition: "${definition}" and pronunciation: /${phonetic}/`

**④ 情境应用题 (Contextual Application)**
- **逻辑**: 创建新的非原文句子，考察单词在不同语境下的正确理解
- **L2**: 标准长度句子
- **L3**: 长句子，多从句，需深度理解
- **Prompt**: `Create a new sentence (not from the article) that requires understanding of "${word}" in context.`

**⑤ 音频相关题型 (Audio-based Questions)**
- **L1 音频跟读选择**: 播放发音，从4个相似拼写中选择
- **L2 音频听写选择**: 听音从选项中选出（干扰项为同词根不同词形）
- **L3 音频完整听写**: 听音后完全输入，无选项提示
- **Prompt**: `Generate audio pronunciation for "${word}" and create appropriate distractors.`

**⑥ 词形变换题 (Word Form Transformation) - L3专属**
- **逻辑**: 给出句子和括号中的原形单词，要求填写正确词形
- **示例**: `She has always been known for her _______ (ambition) nature.` → `ambitious`
- **Prompt**: `Create a sentence requiring the correct form of "${word}" based on grammatical context.`

**⑦ 同义词/反义词选择 (Synonyms/Antonyms) - L2/L3**
- **逻辑**: 考察词汇语义网络扩展
- **Prompt**: `Provide synonym/antonym options for "${word}".`

**⑧ 英英释义匹配 (Definition Matching) - L1/L3**
- **逻辑**: 将3-4个单词与英文释义进行连线匹配
- **L1**: 简单释义
- **L3**: 复杂释义
- **Prompt**: `Create a matching exercise with ${count} words and their English definitions.`

##### 2.5.4 实施说明

> [!NOTE]
> V4.0 直接实现**完整版**题型配置，包含所有题型以提供最佳学习体验。

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

> [!IMPORTANT]
> V4.0 直接实现**完整版**题型配置，包含所有 8 种题型以提供最佳学习体验。

**必须实现的功能（按优先级排序）:**

1.  **P0 - 数据基础**: 
    - 修改 `llmService` Prompt，支持生成 `readingQuestions` 和 `vocabularyQuestions` 双重结构
    - 更新 `GeneratedContent` 接口，支持 8 种题型
    - 实现 `Settings` 中的难度等级存储与管理

2.  **P0 - UI框架**: 
    - 重构 `QuizView` 组件，支持分步答题（阅读题 -> 词汇题）
    - 创建 `VocabularyQuestionRenderer` 核心组件框架

3.  **P0 - 基础题型组件**（选择类，无外部依赖）:
    - ✅ 完形填空 (Cloze) - 各等级通用
    - ✅ 词义辨析 (Definition) - L1 专属，中英双语
    - ✅ 情境应用 (Contextual) - L2/L3
    - ✅ 同义词/反义词 (Synonym) - L2/L3

4.  **P1 - 输入类题型**:
    - ✅ 拼写输入 (Spelling) - L2/L3
    - ✅ 词形变换 (WordForm) - L3 专属

5.  **P1 - 匹配类题型**:
    - ✅ 英英释义匹配 (Matching) - L1/L3

6.  **P2 - 音频题型**（需要TTS服务集成）:
    - ✅ 音频跟读选择 (L1) - 播放发音，4个选项中选择正确拼写
    - ✅ 音频听写选择 (L2) - 听音从选项中选出（同词根不同词形）
    - ✅ 音频完整听写 (L3) - 听音后完全输入，无选项

7.  **P1 - SRS与历史**:
    - 升级 `ReadingPage` 的 `handleQuizSubmit` 逻辑，实现精准的 SRS 状态更新
    - 保存详细的答题数据到 History 表

8.  **P2 - 难度自动调整**:
    - 实现难度自动调整算法 (Auto-Adjustment Logic)

**完整版题量配置:**
- **L1 (基础)**: 10题
  - 完形填空(3) + 词义辨析(3) + 音频跟读选择(2) + 英英释义匹配(1组3对)
- **L2 (进阶)**: 10题
  - 情境应用(4) + 拼写输入(2) + 完形填空(2) + 同义/反义词(1) + 音频听写选择(1)
- **L3 (挑战)**: 12题
  - 拼写输入(3) + 情境应用(3) + 词形变换(2) + 音频完整听写(2) + 同义/反义词(1) + 英英释义匹配(1组3对)

**验收标准:**
- ✅ 用户可在设置中切换难度等级（L1/L2/L3）
- ✅ LLM 能根据难度等级生成完整的题型组合
- ✅ 前端能正确渲染所有 8 种题型并收集答案
- ✅ SRS 系统根据词汇题结果精准更新单词状态
- ✅ 音频题型能够正常播放并交互
- ✅ 匹配题型支持直观的配对操作

### 4.2 技术难点预判
*   **Prompt 复杂度**：要求 LLM 同时生成文章、阅读题和针对特定单词的分级词汇题（包含8种题型），Prompt 会比较长且复杂，需反复调试以保证 JSON 格式稳定。
*   **干扰项生成**：生成高质量的干扰项（Distractors）是难点，如果干扰项太假（如词性不同），题目就没有意义。需在 Prompt 中强调干扰项的质量。
*   **题型组件适配**：8种题型的 UI 组件需要统一的数据接口和交互逻辑，建议使用工厂模式或组件映射表。
*   **音频资源管理**：音频题型需要 TTS 服务（建议使用浏览器原生 Web Speech API 或集成第三方 TTS API），需考虑资源加载、缓存策略和错误处理。
*   **匹配题交互设计**：需要设计直观的配对 UI，可以使用下拉选择或拖拽匹配，确保在触摸设备上也易于操作。

---

**文档维护：**
本 PRD 由产品团队维护。
**最后更新：** 2025-12-03
