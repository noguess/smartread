# V5.0 升级任务拆分方案

基于 `prd_v5.0.md`，我将 V5.0 的开发过程拆解为 **3 个独立的任务**。这些任务按依赖关系排序，请按顺序执行。

**升级原则：**
- **配置先行**：先完成设置项的变更，确保底层逻辑就绪。
- **UI 跟进**：优化首页视觉和交互。
- **体验升级**：最后攻克流式反馈这一体验难点。

---

## 任务 1：设置与数据更新 (Settings & Data)

**目标**：调整文章长度的定义，并确保 LLM 生成时遵循新的字数标准。

**核心工作：**
- 修改 `src/services/settingsService.ts` 或相关常量定义，更新 Short/Medium/Long 的字数说明。
- 修改 `src/services/llmService.ts`，在 System Prompt 中更新字数要求。
- 检查 `SettingsPage`，更新 UI 上的文字说明（如果之前是硬编码的）。

**输入给大模型的内容：**
```markdown
请根据 prd_v5.0.md 中"2.6 文章长度参数调整"部分，完成以下工作：

1. 设置定义更新：
   - 找到定义文章长度（Short/Medium/Long）的地方（可能是 `src/types.ts` 或 `src/services/settingsService.ts`）。
   - 更新字数标准：
     - Short: ~400 words
     - Medium: ~600 words
     - Long: ~800 words

2. LLM 服务更新 (`src/services/llmService.ts`)：
   - 在生成文章的 System Prompt 中，根据用户选择的长度（Short/Medium/Long），注入新的字数要求。
   - 确保 Prompt 明确要求生成的文章逻辑通顺，不仅仅是堆砌字数。

3. 设置页面更新 (`src/pages/SettingsPage.tsx`)：
   - 如果页面上有显示具体字数（如 "Short (~150 words)"），请更新为新的数值。
```

**验收标准：**
- ✅ 设置页面显示的文章长度说明已更新。
- ✅ 模拟生成文章时，Prompt 中包含了正确的字数要求（可通过 console.log 验证）。

---

## 任务 2：首页重构 (Homepage Redesign)

**目标**：优化首页“开始学习”模块的视觉一致性，替换统计数据，并升级“自定义模式”入口。

**核心工作：**
- 修改 `src/pages/Home.tsx`。
- 重构 CSS/Tailwind 样式，统一左右卡片高度和风格。
- 实现“连续学习天数”和“累计学习时长”的计算逻辑（可能需要从 `History` 数据中统计）。
- 改造“自定义模式”为明显的按钮样式。

**输入给大模型的内容：**
```markdown
请根据 prd_v5.0.md 中"2.3 视觉一致性优化"、"2.4 学习统计替换"和"2.5 '自定义模式'入口优化"部分，重构首页：

1. 视觉一致性 (`src/pages/Home.tsx`):
   - 调整“开始学习”卡片（左侧）和“记忆状态”卡片（右侧）的样式。
   - 确保两者的高度 (Height)、圆角 (Border Radius) 和内边距 (Padding) 完全一致。
   - 使用 Grid 布局或 Flexbox 确保对齐。

2. 学习统计功能:
   - 移除原有的“今日计划”文本。
   - 新增统计逻辑（可封装在 `src/services/statsService.ts` 或直接在组件内计算）：
     - 读取 `history` 数据。
     - 计算“连续学习天数” (Consecutive Days)。
     - 计算“累计学习时长” (Total Learning Time, 假设每篇文章平均耗时或读取实际记录)。
   - 在卡片中展示统计数据：
     - 若连续学习中：显示天数和时长，配以火焰/时钟图标。
     - 若断签：显示上次学习日期，并显示鼓励语。

3. “自定义模式”入口:
   - 将原本的文字链接改为次级按钮 (Secondary Button) 或小卡片。
   - 样式上要弱于“智能生成”主按钮，但必须清晰可见（有边框或背景）。
   - 布局上置于主按钮下方或旁侧。
```

**验收标准：**
- ✅ 首页左右两栏高度和风格视觉上完全一致。
- ✅ “今日计划”被替换为真实的“连续学习”或“上次学习”统计。
- ✅ “自定义模式”变成了一个易于点击的按钮。

---

## 任务 3：流式反馈体验 (Streaming Feedback)

**目标**：改造文章生成等待页面，让用户感知到 AI 的工作进度，消除等待焦虑。

**核心工作：**
- 改造 `src/pages/GeneratingView.tsx` (或相关 Loading 组件)。
- 实现“伪流式”展示逻辑（如果后端不支持真实 Stream）或真实 Stream 对接（视 LLM 服务能力而定，目前假设先做前端模拟或进度步进）。
- 优化动画效果。

**输入给大模型的内容：**
```markdown
请根据 prd_v5.0.md 中"2.1 现状问题"和"2.2 解决方案"部分，升级 Loading 页面：

1. 组件改造 (`src/pages/GeneratingView.tsx`):
   - 废弃原本单一的 Spinner/Loading 图标。
   - 实现一个“进度展示”区域。

2. 进度反馈逻辑:
   - 由于目前 LLM 调用可能是单次返回（非 Stream），我们需要实现一个“模拟进度”或“分阶段提示”：
   - 定义阶段：
     1. "Analyzing vocabulary..." (1-2s)
     2. "Drafting the story outline..." (2-4s)
     3. "Writing the content..." (4-8s)
     4. "Generating quiz questions..." (8-10s)
     5. "Finalizing..." (until response)
   - 使用定时器在这些状态间切换文案。
   - 如果可能，添加一个打字机效果的文本占位符，显示一些随机生成的“思考过程”文本，增加沉浸感。

3. UI 优化:
   - 背景保持模糊或半透明。
   - 文字使用动态动画（如 Fade In/Out）。
```

**验收标准：**
- ✅ 点击生成后，不再是枯燥的 Loading，而是看到变化的文字提示。
- ✅ 整个等待过程用户能感知到进度变化。

---

## 给您的操作建议

1.  **关于统计数据**：在做任务 2 时，如果发现 `History` 表中没有记录“学习时长”，可以先用默认值（如每篇 5 分钟）乘以文章数来估算，或者从现在开始在 `History` 中新增 `duration` 字段（但这涉及数据迁移，V5.0 暂不强制要求）。
2.  **关于流式生成**：如果使用的 `llmService` 是基于 `fetch` 的一次性等待，前端模拟进度条是最稳妥的方案。不要试图强行改为 WebSocket 或 Server-Sent Events，除非后端架构支持。
