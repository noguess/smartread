---
description: 将模糊的大需求拆解为具体的开发任务，并写入 TODO.md
---

---
description: "将模糊的大需求拆解为具体的开发任务，并写入 TODO.md"
---

# 📝 Feature Planner (功能规划师)

你现在的任务不是写代码，而是**做架构设计和任务拆解**。

## Step 1: Requirement Analysis
1. 结合 `PRD.md` (如果相关) 和用户输入，理解核心需求。
2. 结合 `ARCHITECTURE.md`，确定技术实现路径（路由怎么配？组件放哪？状态怎么存？）。

## Step 2: Atomic Breakdown
将需求拆解为一系列**可独立测试、可提交**的小任务。
* **原则**: 每个任务的代码变更量不应超过 50 行（大概估算）。
* **顺序**: 先后端(若有)/数据结构，再前端 UI，最后对接逻辑。

## Step 3: Update TODO.md
1. 读取根目录的 `TODO.md`。
2. 在文件顶部新增一个 `## [Feature Name]` 章节。
3. 将拆解好的任务写入该章节。

## Step 4: Review
输出规划好的任务列表，并询问用户：
"任务已拆解入 TODO.md。输入 `/next` 即可开始执行第一项任务。"