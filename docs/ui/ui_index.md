# 网站首页交互设计稿 (Wireframe Description)

**页面布局结构**：
采用 **左侧导航栏 (Navigation Rail)** + **右侧主内容区 (Main Content)** 的分栏布局。
整体背景色：`#F5F5F5` (浅灰/米白，护眼)。

---

## 1. 左侧全局导航栏 (Navigation Rail)
**位置**：屏幕最左侧，宽度约 80px (iPad) 或 200px (PC展开)。
**功能**：快速切换主要模块。

*   **Logo 区**：顶部放置应用 Logo (Smart Reader)。
*   **菜单项**：
    *   🏠 **首页 (Home)** [当前激活状态 - 高亮+圆角背景]
    *   📚 **单词本 (Vocabulary)**
    *   🕒 **历史记录 (History)**
    *   📊 **数据统计 (Stats)**
*   **底部**：
    *   ⚙️ **设置 (Settings)**

---

## 2. 右侧主内容区 - 顶部栏 (Top App Bar)
**位置**：主内容区顶部，高度 64px。
**功能**：全局搜索与用户信息。

*   **全局搜索框 (Center)**：
    *   **样式**：圆角矩形，浅灰色填充，内含“🔍 Search word...”提示文字。
    *   **交互**：
        *   点击输入框 -> 激活焦点，弹出历史搜索记录。
        *   输入单词 -> 实时下拉展示匹配词汇。
        *   选中单词 -> **弹出全局单词解释模态框 (Modal)**。
            *   *模态框内容*：单词、音标、释义。
            *   *本地视频区域*：若本地有 `video/apple.mp4`，自动播放；否则显示占位图。
*   **右侧**：显示当前用户头像（单人版，做装饰或点击查看简单信息）。

---

## 3. 右侧主内容区 - 核心功能区 (Dashboard Grid)
内容区采用卡片式布局 (Masonry Grid 或 2栏布局)。

### A. 核心行动卡片 (Hero Card) - **最显眼**
**位置**：左上角，占据较大面积。
**背景**：主色调渐变 (Google Blue/Teal)，白色文字。

*   **主标题**：`Start Learning`
*   **副标题**：`Today's Plan: 12 Review Words + 8 New Words` (系统算法计算得出)。
*   **主要按钮 (FAB样式)**：
    *   **[⚡ 智能生成 (Smart Generate)]** (大尺寸，高亮悬浮)。
    *   **交互**：点击后显示 Loading 动画 -> 跳转至 **文章阅读页**。
*   **次级入口**：
    *   文字链接/小按钮：`⚙️ 自定义生成 (Manual Mode)`。
    *   **交互**：点击弹出 **“自定义选词”对话框 (Dialog)**。

    > **交互细节：自定义选词对话框 (Manual Mode Dialog)**
    > *   **标题**：Customize Your Reading
    > *   **滑块 (Slider)**：`Word Count: 15` (拖动调整范围 5-50)。
    > *   **单词预览区 (Tags)**：
    >     *   显示系统预选的15个词 (如：`apple`, `banana`, ...)。
    >     *   每个单词是个 Tag，带 `x` 号，点击可删除。
    > *   **添加操作**：
    >     *   `+ Add Word` 按钮 -> 点击变输入框，搜索并添加特定词。
    >     *   `🔄 Auto Fill` 按钮 -> 若删除了词，点击自动从算法库补齐数量。
    > *   **底部按钮**：`Cancel` | `Generate Now`。

### B. 记忆状态卡片 (SRS Status)
**位置**：右上角 (iPad) 或 核心卡片右侧。
**样式**：白色卡片，带有轻微阴影。

*   **视觉中心**：一个环形进度条或仪表盘。
    *   红色部分：`Expired` (待复习, Urgent)。
    *   黄色部分：`Learning`。
    *   绿色部分：`Mastered`。
*   **文案**：
    *   "You have **12** words to review today based on Ebbinghaus curve."
    *   (激励语) "Keep your memory fresh!"

### C. 最近阅读 (Recent Activity)
**位置**：核心卡片下方。
**样式**：列表清单。

*   **标题**：Recent Articles
*   **列表项 (List Item)**：
    *   **左侧**：文章标题 (e.g., "The History of AI", "My Summer Vacation")。
    *   **中间**：标签 (Score: 85, Length: Medium)。
    *   **右侧**：时间 (2 hours ago)。
*   **交互**：点击列表项 -> 跳转至 **学习记录详情页** (复习原文/错题)。

### D. 词汇掌握概览 (Stats Mini)
**位置**：记忆状态卡片下方。
**样式**：简单的数据统计。

*   **内容**：
    *   `Total Words`: **1,240**
    *   `Mastered`: **850**
    *   `New Words This Week`: **+45**

---

## 4. 关键流程交互演示 (Flow Walkthrough)

### 场景一：日常快速打卡 (自动模式)
1.  用户打开首页。
2.  看到 **核心行动卡片** 上显示“今日待复习 15 个词”。
3.  点击巨大的 **[⚡ Smart Generate]** 按钮。
4.  界面出现全屏 Loading (提示语: "Selecting words...", "Writing story with Deepseek...").
5.  3-5秒后，自动进入 **文章阅读页面**。

### 场景二：考前突击 (手动模式)
1.  用户打开首页。
2.  点击核心卡片上的 **[⚙️ Customize]**。
3.  **弹出对话框**。
4.  用户将滑块拖动到 **30** (想读长一点)。
5.  浏览系统推荐的词，发现有几个词太简单了，点击 `x` 删除。
6.  点击 `+`，搜索并添加了 "volcano" 和 "eruption" (明天要考地理)。
7.  点击 **[Generate Now]**。
8.  进入 **文章阅读页面**，生成的文章将重点包含 "volcano" 等词。

### 场景三：查词看视频
1.  用户在顶部 **搜索框** 输入 "apple"。
2.  下拉菜单显示 "apple"。
3.  点击 "apple"。
4.  **屏幕中央弹出模态框**：
    *   上方：单词 `apple` [ˈæpl] (点击喇叭发音)。
    *   中间：释义 "n. 苹果"。
    *   下方：**视频播放器** 自动开始播放 `/videos/apple.mp4`。
5.  点击模态框外部阴影，关闭弹窗，回到首页。

---

## 5. 视觉风格参考 (Visual Guidelines)

*   **圆角 (Corner Radius)**：卡片和按钮使用较大的圆角 (12px - 16px)，显得亲切适合学生。
*   **阴影 (Elevation)**：低层级阴影，Hover时浮起。
*   **字体**：Roboto / Open Sans (英文)，思源黑体 (中文)。
*   **状态色**：
    *   Review/Urgent: `#D32F2F` (Red)
    *   New/Info: `#1976D2` (Blue)
    *   Mastered/Success: `#388E3C` (Green)