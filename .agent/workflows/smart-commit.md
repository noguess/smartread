---
description: 智能提交：自动同步架构文档、勾选任务并生成 Commit Message
---

---
description: "智能提交：自动同步架构文档、勾选任务并生成 Commit Message"
---

# 🚀 Smart Commit Protocol (智能提交协议)

你现在进入**“提交收尾模式”**。请严格按照以下步骤执行，不要跳步，不要偷懒。

## Step 1: Documentation Sync (文档同步)
扫描本次会话中修改的所有代码：
1. **架构检查**: 是否引入了新库 (package.json)？是否新建了核心目录？是否改变了技术栈或目录结构？
   - *如果有*: 立即读取并更新 `ARCHITECTURE.md` 的对应章节。
2. **环境变量**: 是否使用了新的 `env` 变量？
   - *如果有*: 更新 `.env.example`。
3. **PRD检查**: 是否改变了大的产品功能？是否有核心产品功能的变更？
   - *如果有*: 立即读取并更新 `PRD.md` 的对应章节。

## Step 2: Task Management (任务管理)
读取根目录下的 `TODO.md`：
1. 识别本次修改对应哪一项任务。
2. 将该任务的状态标记为 `[x]`。

## Step 3: Git Commit Generation (生成提交)
只有在完成上述两步后，基于修改内容生成 Git Commit Message。
- **格式要求**: 遵循 Conventional Commits (feat/fix/docs/refactor)。
- **语言要求**: 使用**中文**编写 Commit 的描述部分。
- **调起终端自动进行提交

---

**最终输出格式**:

> ✅ **收尾工作已完成**
> - [ ] 文档同步: {结果}
> - [ ] 任务状态: {结果}