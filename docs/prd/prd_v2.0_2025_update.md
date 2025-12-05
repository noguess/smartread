# 英语中考备考智能阅读平台 - 产品需求文档 (PRD) V2.0

| 项目属性 | 内容 |
| :--- | :--- |
| **项目名称** | 英语中考智能阅读平台 (Smart Reader) |
| **版本号** | **V2.0** |
| **日期** | 2025-12-05 |
| **版本定位** | **架构重构与文库版** |
| **核心目标** | 解耦文章与试题生成，引入“文库”概念，实现“一文多测”与长期内容沉淀。 |

---

## 1. 版本背景与目标

### 1.1 背景
当前版本 (V1.x/V4.0-Legacy) 中，文章生成与试题生成是**强绑定**的。每次生成文章时，必须同时生成试题。这导致了以下问题：
1.  **资源浪费**：如果用户只想阅读不想做题，或者只想做题不想看新文章，无法满足。
2.  **复用性差**：生成的文章在做完一次题后，虽然有历史记录，但难以再次利用进行不同维度的测试（例如：上次考了阅读理解，这次想考词汇）。
3.  **内容资产缺失**：缺乏一个统一的“文库”来管理高质量的生成内容，用户难以系统地回顾之前的阅读材料。

### 1.2 核心目标
1.  **重构生成流程**：将“文章生成”与“试题生成”彻底解耦。
2.  **新增“文库” (Library)**：建立文章元数据管理系统，所有生成的文章自动入库。
3.  **实现“一文多测”**：支持对同一篇文章进行多次测试，每次可实时调用大模型生成全新的试题。

---

## 2. 核心业务流程重构

### 2.1 旧流程 (V1.x)
1.  用户选择单词 -> 点击生成。
2.  LLM 一次性返回 `{ 文章, 题目 }`。
3.  用户阅读 -> 做题 -> 提交 -> 存入 History。

### 2.2 新流程 (V2.0)

#### 流程 A：文章生成与入库
1.  用户选择单词 -> 点击“生成文章”。
2.  LLM **仅生成文章内容** (Title, Content, TargetWords)。
3.  系统自动将文章保存至 **文库 (Library)**。
4.  跳转至 **文章阅读页**。

#### 流程 B：阅读与发起测试
1.  用户在 **文章阅读页** (可来自刚生成，也可来自文库列表)。
2.  点击 **“开始测试” (Start Quiz)** 按钮。
3.  系统将“文章内容” + “用户当前难度/配置”发送给 LLM。
4.  LLM **实时生成试题**。
5.  用户作答 -> 提交 -> 存入 **测试记录 (Quiz Records)**。

---

## 3. 功能模块详情

### 模块一：文库 (Library)

#### 1.1 文库列表
*   **入口**：主导航栏新增“文库”入口。
*   **展示项**：
    *   文章标题 (Title)
    *   核心词汇预览 (Target Words)
    *   生成时间 (Created Time)
    *   难度等级 (Difficulty Level)
    *   **测试次数** (Tested Count)：显示该文章已被测试过几次。
*   **操作**：
    *   **阅读**：点击进入阅读页。
    *   **删除**：从文库中移除（同时级联删除相关的测试记录）。

#### 1.2 文章阅读页 (Article Reader)
*   **布局**：
    *   左侧/中心：文章内容区域，核心词高亮。
    *   底部/侧边操作栏：
        *   **生成试题 (Generate Quiz)**：核心功能按钮。
        *   **查看历史成绩**：查看基于该文章的过往测试记录。

### 模块二：动态试题生成 (On-Demand Quiz Generation)

#### 2.1 触发机制
*   用户点击“生成试题”时触发。
*   **参数配置**：(可选) 用户在生成前可简要选择本次测试侧重：
    *   *侧重阅读理解*
    *   *侧重词汇掌握*
    *   *综合测试 (默认)*

#### 2.2 生成逻辑
*   **输入**：文章全文 + 核心单词列表 + 用户难度等级 (L1/L2/L3)。
*   **输出**：试题 JSON (结构同 V4.0，包含 Reading Questions & Vocabulary Questions)。
*   **特性**：每次生成都应尝试提供不同的题目（依赖 LLM 的随机性或 Prompt 中的随机种子控制）。

### 模块三：测试与结算

#### 3.1 测试记录 (Quiz History)
*   测试结果不再直接依附于“文章生成记录”，而是作为独立的实体关联到“文章”。
*   **数据结构变化**：
    *   旧：`History` 表包含 `article` + `questions`。
    *   新：`QuizRecord` 表包含 `articleId` + `questions` + `score`。

#### 3.2 艾宾浩斯算法适配
*   单词状态更新逻辑保持不变，依然基于测试结果触发。
*   **注意**：由于可以多次测试，单词的复习频率可能会增加，需确保算法能处理短时间内多次复习的情况（例如：同一天测两次，第二次是否还增加 interval？建议：同一天多次测试仅取最高分或最后一次更新状态，避免刷分）。

---

## 4. 数据模型变更 (Database Schema)

需对 `IndexedDB` 进行迁移和改造。

### 4.1 新增表：Articles
存储文章本体。
```typescript
interface Article {
  id?: number; // 自增主键
  uuid: string; // 唯一标识
  title: string;
  content: string; // Markdown content
  targetWords: string[]; // 核心词列表
  difficultyLevel: 'L1' | 'L2' | 'L3';
  createdAt: number; // Timestamp
  source: 'generated' | 'imported'; // 来源
  tags?: string[]; // 预留
}
```

### 4.2 改造表：QuizRecords (原 History)
存储测试记录，关联 Article。
```typescript
interface QuizRecord {
  id?: number;
  articleId: string; // 关联 Article.uuid
  date: number; // 测试时间
  questions: GeneratedQuestions; // 试题快照
  userAnswers: UserAnswers; // 用户答案
  score: number;
  difficultyFeedback: number;
  // ... 其他统计字段
}
```

### 4.3 数据迁移策略 (Migration)
*   **旧数据兼容**：
    *   遍历旧的 `History` 表。
    *   将 `articleContent`, `title`, `targetWords` 提取出来，生成一条 `Article` 记录。
    *   将剩余的题目和答题数据，生成一条 `QuizRecord` 记录，并关联上述 `Article`。

---

## 5. 接口/服务层调整 (Service Layer)

### 5.1 LLM Service
拆分为两个核心方法：
1.  `generateArticleOnly(words, settings)`: 仅返回文章 JSON。
2.  `generateQuizForArticle(articleText, words, settings)`: 仅返回试题 JSON。

### 5.2 Article Service
*   `saveArticle(article)`
*   `getArticle(id)`
*   `getAllArticles()`

### 5.3 Quiz Service
*   `saveQuizRecord(record)`
*   `getRecordsByArticleId(articleId)`

---

## 6. UI/UX 变更清单

1.  **导航栏**：新增 "Library" (文库)。
2.  **首页**：
    *   "生成"按钮文案改为 "Generate Article"。
    *   生成后不再直接进入做题模式，而是进入阅读模式。
3.  **阅读页**：
    *   新增 "Start Quiz" 悬浮按钮或底部栏。
    *   新增 "History" Tab 或入口，查看该文章的历史成绩。
4.  **文库页**：
    *   卡片式或列表式展示已生成的文章。

---

## 7. 验收标准
1.  **生成解耦**：点击生成文章，速度应比之前快（因为少生成了题目），且不包含题目。
2.  **文库记录**：生成后，在文库中能看到该文章。
3.  **多次测试**：
    *   进入同一篇文章，点击测试，生成题目 A。
    *   退出，再次点击测试，生成题目 B（题目内容应有所不同，或至少ID不同）。
4.  **数据完整性**：旧的历史记录经迁移后，能在文库和测试记录中正确显示。
