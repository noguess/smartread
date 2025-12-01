# V2.0 升级任务拆分方案

基于 `prd_v2.0.md`，我将整个 V2.0 升级过程拆解为 **6 个独立的任务**。每个任务都可以独立完成和验证，确保升级过程平稳可控。

**升级原则：**
- 保持现有功能完整性
- 渐进式升级，随时可回滚
- 每个任务完成后都要验证功能正常

---

## 任务 1：设计系统升级 - 色彩与主题 (The New Look)

**目标**：更新全局色彩系统、字体、圆角等视觉基础元素。

**核心工作：**
- 更新 Material-UI 主题配置，替换为青少年友好的色彩系统
- 引入渐变色和活力配色（蓝紫渐变、薄荷绿、阳光黄）
- 更新字体系统（中文：思源黑体 / 英文：Poppins/Inter）
- 优化全局 CSS 变量和主题 tokens

**输入给大模型的内容：**
```
请根据 prd_v2.0.md 中"2.2.1 色彩系统优化"和"2.2.3 字体系统"部分，升级项目的设计系统：

1. 色彩系统：
   - Primary: 渐变蓝紫色系 (#4A90E2 → #7B68EE)
   - Secondary: 薄荷绿 (#00D9A5)、阳光黄 (#FFD93D)
   - 状态色：成功(翠绿渐变)、学习中(橙色渐变)、需复习(柔和红色)
   - 背景：米白/浅灰 (#F8F9FA) + 护眼模式米黄 (#FFF8E7)

2. 字体系统：
   - 引入 Google Fonts: Noto Sans SC (中文) + Poppins (英文标题) + Inter (英文正文)
   - 正文字号从 16px 升级到 17px
   - 行高从 1.5 升级到 1.7

3. 更新 MUI Theme：
   - 在 src/theme/ 目录创建新的主题配置文件
   - 圆角从 8px 增加到 16px
   - 阴影从硬边改为柔和扩散
   - 支持浅色和护眼模式切换

4. 在 index.html 中添加 Google Fonts 引用
   <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Poppins:wght@600;700&family=Inter:wght@400;500&display=swap" rel="stylesheet">

请保持现有组件结构不变，只更新主题配置。
```

**验收标准：**
- ✅ 所有页面色彩统一更新为新配色方案
- ✅ 字体大小和行高符合新标准
- ✅ 卡片圆角、阴影效果符合新设计
- ✅ 切换护眼模式时颜色正确变化
- ✅ 现有功能完全正常（不受主题更改影响）

**风险提示：**
- 主题更改可能影响某些自定义样式，需要逐页检查

---

## 任务 2：组件样式升级 (The Component Refresh) ✅ Completed

**目标**：重构核心组件的视觉样式，符合青少年友好设计。

**核心工作：**
- 升级 Card 组件样式（圆角、阴影、hover 效果）
- 升级 Button 组件（渐变背景、圆角、微动效）
- 优化 Badge/Chip 组件（状态徽章、图标）
- 为空状态添加友好插图和 Emoji

**输入给大模型的内容：**
```
请根据 prd_v2.0.md 中"2.2.4 组件风格迭代"部分，优化以下核心组件：

1. Card 组件升级：
   - 圆角：16px
   - 阴影：0 4px 20px rgba(0,0,0,0.06)
   - Hover 效果：轻微上浮(translateY(-2px)) + 阴影加深
   - 添加平滑过渡动画 (transition: all 0.2s ease)

2. Button 组件升级：
   - 主按钮：使用渐变背景 (linear-gradient)
   - 圆角：12px
   - Hover 状态：轻微缩放 (scale: 1.02) + 阴影
   - Loading 状态：添加骨架屏动画

3. 进度条和徽章：
   - 学习进度条改为渐变彩色条
   - 状态徽章增加对应图标 (使用 Material Icons Rounded)
   - 使用 Chip 组件的圆润风格

4. 空状态优化：
   - 为"暂无学习记录"、"暂无复习词汇"、"视频资源缺失"等场景添加插图
   - 可以使用简单的 SVG 插图或 Emoji (📚 🎯 🎬)
   - 添加友好的提示文案

5. 图标升级：
   - 将所有图标从 Material Icons Outlined 改为 Material Icons Rounded

请创建或更新以下文件：
- src/components/common/StyledCard.tsx
- src/components/common/StyledButton.tsx
- src/components/common/EmptyState.tsx
```

**验收标准：**
- ✅ 所有卡片和按钮样式统一且符合新设计
- ✅ Hover 效果流畅自然
- ✅ 空状态显示友好提示
- ✅ 图标统一为圆角风格
- ✅ 无视觉 bug，响应式布局正常

---

## 任务 3：国际化基础设施搭建 (The i18n Foundation) ✅ Completed

**目标**：集成 react-i18next，建立完整的国际化基础设施。

**核心工作：**
- 安装并配置 i18next 和 react-i18next
- 创建语言文件目录结构
- 建立中英文语言文件框架
- 实现语言切换组件

**输入给大模型的内容：**
```
请根据 prd_v2.0.md 中"2.5 技术方案"部分，为项目添加国际化支持：

1. 依赖安装：
   npm install i18next react-i18next i18next-browser-languagedetector

2. 目录结构创建：
   /src/locales/
     ├── zh/
     │   ├── common.json       # 公共文案（导航、按钮等）
     │   ├── home.json         # 首页
     │   ├── vocabulary.json   # 单词本
     │   ├── article.json      # 文章阅读
     │   └── settings.json     # 设置页
     └── en/
         ├── common.json
         ├── home.json
         ├── vocabulary.json
         ├── article.json
         └── settings.json

3. i18n 配置：
   - 创建 src/i18n/config.ts
   - 配置语言检测顺序：localStorage > 浏览器语言 > 默认中文
   - 设置命名空间和资源加载
   - 在 App.tsx 中初始化 i18n

4. 语言切换组件：
   - 创建 src/components/LanguageSwitcher.tsx
   - 位置：导航栏右上角
   - UI：地球图标 🌐 + 下拉菜单（简体中文 ✓ / English）
   - 功能：点击切换语言，选择保存到 localStorage
   - 样式：使用 MUI Select 或 Menu 组件

5. 初始翻译内容：
   - common.json 翻译：导航栏、常用按钮、状态文本
   - 其他模块可以先创建空对象，后续任务补充

请确保 i18n 配置完成后，在代码中使用 useTranslation hook 即可调用翻译。
```

**验收标准：**
- ✅ i18next 正确配置，无控制台错误
- ✅ 语言文件正确加载
- ✅ LanguageSwitcher 组件显示在导航栏
- ✅ 点击切换语言后页面文案同步更新
- ✅ 刷新页面后语言选择持久化
- ✅ common.json 中的文案已翻译并生效

---

## 任务 4：全站文案国际化迁移 (The Translation Migration) ✅ Completed

**目标**：将所有硬编码的中文文案替换为 i18n 调用。

**核心工作：**
- 替换导航、按钮、标签等固定文案
- 翻译各模块的 UI 文案
- 处理动态内容（日期、数字格式）
- 补充英文翻译

**输入给大模型的内容：**
```
请系统性地将项目中的所有硬编码文案替换为 i18n 调用：

1. 查找替换规则：
   - "首页" → t('common:nav.home')
   - "学习记录" → t('common:nav.history')
   - "单词本" → t('common:nav.vocabulary')
   - "设置" → t('common:nav.settings')
   - 其他类似

2. 需要翻译的主要页面/组件：
   - 导航栏（Navigation）
   - 首页（Home/Dashboard）
   - 单词本页面（VocabularyBook）
   - 文章阅读页（ReadingPage）
   - 设置页（Settings）
   - 单词详情弹窗（WordDetailModal）
   - 所有提示信息（Toast/Snackbar）

3. 特殊处理：
   - 日期格式：使用 i18n 的 formatters
   - 数字单位：如"个单词" / "words"
   - 占位符文本：如搜索框的 placeholder

4. 翻译文件补充：
   - 为所有模块补充完整的中英文翻译
   - 确保翻译准确、自然、符合初中生语言习惯
   - 注意英文译文适合英语母语者理解

5. 测试覆盖：
   - 切换到英文模式，检查所有页面无遗漏文案
   - 检查中英文排版是否正常（英文可能更长）

请逐个模块处理，每个模块完成后可以验证。
```

**验收标准：**
- ✅ 所有页面无硬编码中文文案
- ✅ 切换语言时所有文案同步更新
- ✅ 英文翻译准确自然
- ✅ 日期、数字格式根据语言正确显示
- ✅ 无遗漏未翻译的文案
- ✅ 中英文排版均正常，无溢出或错位

**批量检查技巧：**
```bash
# 搜索可能的硬编码中文
grep -r "[\u4e00-\u9fa5]" src/ --include="*.tsx" --include="*.ts"
```

---

## 任务 5：阅读页排版与交互优化 (The Reading Experience)

**目标**：重构文章阅读页，提升阅读舒适度和用户体验。

**核心工作：**
- 优化文章排版（宽度、行高、段间距）
- 改进核心词高亮样式
- 实现三栏式响应布局
- 添加阅读辅助功能（字号调节、进度条）

**输入给大模型的内容：**
```
请根据 prd_v2.0.md 中"2.8 优化方案"部分，重构文章阅读页：

1. 核心阅读区排版优化：
   - 容器最大宽度：680px，居中显示
   - 段落样式：
     * font-size: 17px
     * line-height: 1.8
     * margin-bottom: 20px
     * text-align: justify（英文两端对齐）
   - 左右 padding: 32px

2. 核心词高亮优化：
   - 当前仅加粗，改为多层次反馈：
     * 字体加粗 (font-weight: 600)
     * 颜色：#1976d2
     * 底色高亮：linear-gradient(180deg, transparent 60%, #E3F2FD 60%)
     * cursor: pointer
     * 添加小标记（如右上角小圆点）
   - Hover 效果：
     * 底色加深
     * 轻微上移 (translateY(-1px))
     * 平滑过渡 (transition: all 0.2s ease)

3. 布局结构优化：
   桌面端（≥1024px）- 三栏式：
   ┌─────────────────────────────────────────────┐
   │  [导航栏]                                    │
   ├──────┬──────────────────────┬────────────────┤
   │侧边栏│   文章阅读区         │   工具栏       │
   │160px │   max-width:680px    │   200px        │
   │      │   居中               │   - 字号 A-A+  │
   │      │                      │   - 阅读进度   │
   └──────┴──────────────────────┴────────────────┘

   移动端（<1024px）- 单栏式：
   - 侧边栏和工具栏折叠
   - 文章全宽展开
   - 工具栏变为浮动按钮

4. 阅读辅助功能：
   a. 字号调节：
      - 工具栏添加 A- / A / A+ 三档按钮
      - 切换字号：15px / 17px / 19px
      - 选择保存到 localStorage
   
   b. 阅读进度条：
      - 页面顶部 fixed 定位
      - 高度：2px
      - 随滚动实时更新进度百分比
      - 使用 MUI LinearProgress 组件
   
   c. 首次引导提示：
      - 首次进入时显示：💡 提示：点击蓝色单词可查看释义和视频讲解
      - 3秒后自动淡出
      - 可手动关闭，关闭后不再显示（localStorage 控制）

5. 单词点击交互优化：
   - 点击核心词时显示波纹效果（MUI Ripple）
   - 弹窗从屏幕中央改为靠近点击位置（Popover）

请创建或更新：
- src/pages/ReadingPage.tsx
- src/components/ArticleContent.tsx
- src/components/ReadingToolbar.tsx
- src/styles/reading.css
```

**验收标准：**
- ✅ 文章阅读区宽度、行高、段间距符合标准
- ✅ 核心词高亮效果明显且美观
- ✅ Hover 效果流畅
- ✅ 桌面端三栏布局正常
- ✅ 移动端响应式布局正确
- ✅ 字号调节功能正常，选择可持久化
- ✅ 阅读进度条准确显示
- ✅ 首次引导提示正确显示和隐藏
- ✅ 单词点击弹窗位置合理

---

## 任务 6：微动效与最终优化 (The Polish)

**目标**：添加微动效，提升交互趣味性，进行全面测试和性能优化。

**核心工作：**
- 添加页面过渡动效
- 实现完成反馈动效（Confetti）
- 性能优化和响应式测试
- 最终走查和 bug 修复

**输入给大模型的内容：**
```
请完成最后的优化工作，提升产品的整体体验：

1. 微动效系统：
   a. 页面过渡动效：
      - 页面切换时淡入 + 轻微上移 (Fade + Slide)
      - 使用 Framer Motion 或 MUI transitions
      - 时长：200-300ms，缓动函数：ease-out
   
   b. 完成反馈动效：
      - 当用户答题得分 >= 90 时触发 Confetti 撒花动画
      - 使用库：react-confetti 或 canvas-confetti
      - 持续时间：2-3秒
      - 触发位置：结算页面展示时
   
   c. 加载状态优化：
      - 将所有 CircularProgress 改为骨架屏（Skeleton）
      - 为文章生成、数据加载等场景添加 Skeleton

2. 性能优化：
   - 检查并优化大型组件的 re-render
   - 为列表添加虚拟滚动（如单词本列表很长时）
   - 图片/字体资源懒加载
   - 代码分割（React.lazy）

3. 响应式测试：
   - 测试设备：iPad (768px), iPad Pro (1024px), Desktop (1440px+)
   - 检查所有页面在不同尺寸下的布局
   - 修复可能的溢出、错位问题

4. 可访问性 (A11y)：
   - 为所有按钮添加 aria-label
   - 检查键盘导航（Tab、Enter、ESC）
   - 色彩对比度检查（使用 axe DevTools）

5. 最终走查：
   - 完整走一遍用户流程：首页 → 生成文章 → 阅读 → 答题 → 查看历史 → 单词本 → 设置
   - 中英文模式各走一遍
   - 记录并修复发现的 bug

6. Lighthouse 优化：
   - 运行 Lighthouse 测试
   - 确保各项评分：
     * Performance >= 90
     * Accessibility >= 95
     * Best Practices >= 90
     * SEO >= 90

请列出发现的问题和优化建议。
```

**验收标准：**
- ✅ 页面切换动效流畅自然
- ✅ 高分完成时 Confetti 动效正常触发
- ✅ 加载状态使用骨架屏代替 Spinner
- ✅ 所有页面响应式布局完美
- ✅ 键盘导航功能正常
- ✅ Lighthouse 各项评分达标
- ✅ 中英文模式无 bug
- ✅ 整体用户体验流畅、愉悦

**性能检查清单：**
```typescript
// 使用 React DevTools Profiler 检查性能
// 检查以下场景的渲染性能：
- 语言切换
- 字号调节
- 单词列表滚动
- 文章生成后的页面切换
```

---

## 给您的操作建议

### 执行策略：

1. **按顺序执行**：任务 1-6 有一定的依赖关系，建议按顺序完成
   - 任务 1-2 是视觉基础，可并行
   - 任务 3-4 是国际化，需串行
   - 任务 5 依赖任务 1-2 的视觉基础
   - 任务 6 是收尾，需在其他都完成后进行

2. **每个任务完成后的检查点**：
   - 运行 `npm run dev` 确保无编译错误
   - 在浏览器中检查视觉效果
   - 测试相关功能是否正常
   - 提交代码前确认无 TypeScript 错误

3. **版本控制建议**：
   ```bash
   # 每完成一个任务，提交一次
   git add .
   git commit -m "feat: complete task N - task_name"
   
   # 创建备份分支
   git checkout -b v2-backup
   git checkout main
   ```

4. **风险控制**：
   - 任务 1-2（视觉改造）风险较低，可大胆执行
   - 任务 3-4（i18n）需要全局替换，建议使用 VSCode 的全局查找替换
   - 任务 5（阅读页重构）涉及核心功能，需要充分测试
   - 建议在开始前创建 `v1.3-stable` 分支作为备份

5. **测试技巧**：
   - 准备一个测试检查清单（Checklist）
   - 每完成一个任务，完整走一遍核心流程
   - 重点测试：文章生成 → 阅读 → 答题 → 单词详情

### Prompt 模板：

在向大模型发送任务时，可以使用以下模板：

```
我正在进行项目的 V2.0 升级，现在需要完成任务 N。

【任务背景】
<复制本文档中该任务的"目标"和"核心工作"部分>

【详细需求】
<复制"输入给大模型的内容"部分>

【当前项目状态】
- 技术栈：React + TypeScript + Vite + Material-UI
- 现有功能：<简述当前相关功能状态>
- 相关文件：<列出需要修改的主要文件>

【期望输出】
1. 需要创建/修改的文件清单
2. 关键代码实现
3. 配置更改说明
4. 验收自查建议

请开始吧！
```

---

祝您的 V2.0 升级顺利！这个拆解方案应该能让升级过程平稳可控。如有任何问题，随时可以调整任务粒度或顺序。🚀
