# Task 4 浏览器测试清单

## 🌐 语言切换测试

### 基础切换测试
- [ ] 打开浏览器访问 http://localhost:3001/
- [ ] 确认默认显示中文
- [ ] 点击右上角语言切换器（地球图标🌐）
- [ ] 选择 "English"
- [ ] 确认所有文案变为英文
- [ ] 再次点击语言切换器
- [ ] 选择 "简体中文"
- [ ] 确认所有文案变回中文

### 持久化测试
- [ ] 切换到英文
- [ ] 刷新页面（F5）
- [ ] 确认仍显示英文（localStorage持久化生效）

---

## 📄 页面验证清单

### 1. 首页 (Home / 首页)

#### 中文验证
- [ ] 应用名称：📚 智能阅读器
- [ ] 页面标题：首页
- [ ] Hero区标题：开始学习
- [ ] 今日计划：今日计划：X 个复习词 + X 个新词
- [ ] 按钮：智能生成、自定义模式
- [ ] 统计卡片：学习进度、单词掌握进度、状态统计
- [ ] 最近活动：最近活动、X 分

#### 英文验证
- [ ] 应用名称：📚 Smart Reader
- [ ] 页面标题：Home
- [ ] Hero区标题：Start Learning
- [ ] 今日计划：Today's Plan: X review words + X new words
- [ ] 按钮：Smart Generate、Custom Mode
- [ ] 统计卡片：Learning Progress、Word Mastery Progress、Status Statistics
- [ ] 最近活动：Recent Activity、X pts

### 2. 单词本 (Vocabulary / 单词本)

#### 中文验证
- [ ] 侧边栏：单词本
- [ ] 页面标题：单词本
- [ ] 标签页：全部 (X)、新词 (X)、学习中 (X)、复习 (X)、已掌握 (X)
- [ ] 搜索框：搜索单词...
- [ ] 状态徽章：新词、学习中、复习、已掌握
- [ ] 空状态：这里还没有单词

#### 英文验证
- [ ] 侧边栏：Word Book
- [ ] 页面标题：Word Book
- [ ] 标签页：All (X)、New (X)、Learning (X)、Review (X)、Mastered (X)
- [ ] 搜索框：Search for words...
- [ ] 状态徽章：New、Learning、Review、Mastered
- [ ] 空状态：No words yet

### 3. 学习记录 (History / 学习记录)

#### 中文验证
- [ ] 侧边栏：学习记录
- [ ] 页面标题：📚 学习记录
- [ ] 分数标签：X 分
- [ ] 核心词：🎯 核心词:
- [ ] 空状态：还没有学习记录

#### 英文验证
- [ ] 侧边栏：Learning History
- [ ] 页面标题：📚 Learning History
- [ ] 分数标签：X pts
- [ ] 核心词：🎯 Target Words:
- [ ] 空状态：No learning records yet

### 4. 统计 (Statistics / 统计)

#### 中文验证
- [ ] 侧边栏：统计
- [ ] 页面标题：学习统计
- [ ] 图表：近7天阅读量、单词掌握情况、近期考试成绩

#### 英文验证
- [ ] 侧边栏：Statistics
- [ ] 页面标题：Statistics
- [ ] 图表：Reading Trend (Last 7 Days)、Word Mastery Status、Recent Quiz Scores

### 5. 设置 (Settings / 设置)

#### 中文验证
- [ ] 侧边栏：设置
- [ ] 页面标题：设置
- [ ] API配置
- [ ] 学习偏好：文章长度（短篇/中篇/长篇）、每日新词上限
- [ ] 主题模式：浅色模式、护眼模式
- [ ] 数据管理：重置进度
- [ ] 按钮：保存设置

#### 英文验证
- [ ] 侧边栏：Settings
- [ ] 页面标题：Settings
- [ ] API Configuration
- [ ] 学习偏好：Article Length (Short/Medium/Long)、Daily Word Limit
- [ ] 主题模式：Light Mode、Eye Care Mode
- [ ] 数据管理：Reset Progress
- [ ] 按钮：Save Settings

### 6. 阅读页 (Reading / 阅读页)

#### 中文验证（如果有生成的文章）
- [ ] 生成中提示：正在生成文章...、正在融入 X 个目标单词
- [ ] 按钮：开始测验 / 复习测验
- [ ] 测验：阅读理解测验、提交答案、返回文章
- [ ] 反馈：你答对了 X 题中的 X 题！、你觉得这篇文章难度如何？、完成学习

#### 英文验证
- [ ] 生成中提示：Writing your story...、Incorporating X target words
- [ ] 按钮：Start Quiz / Review Quiz
- [ ] 测验：Reading Comprehension Quiz、Submit Answers、Back to Article
- [ ] 反馈：You got X out of X correct!、How difficult was this article?、Complete

---

## 🔍 特别关注项

### 状态徽章颜色与文字
在单词本页面，检查四种状态徽章：
- [ ] 新词（蓝色渐变）：中文"新词" / 英文"New"
- [ ] 学习中（橙色渐变）：中文"学习中" / 英文"Learning"
- [ ] 复习（红色渐变）：中文"复习" / 英文"Review"
- [ ] 已掌握（绿色渐变）：中文"已掌握" / 英文"Mastered"

### 应用名称
在左侧边栏顶部：
- [ ] 中文：📚 智能阅读器
- [ ] 英文：📚 Smart Reader

### 动态内容插值
- [ ] 数字和计数正确显示（不是显示{{count}}这样的原始文本）
- [ ] 例如："今日计划：5 个复习词 + 10 个新词" 而不是 "今日计划：{{reviewCount}} 个复习词..."

---

## 🐛 常见问题检查

- [ ] 没有显示翻译键名（如"common:nav.home"）
- [ ] 没有空白或undefined
- [ ] 中英文排版正常，无溢出
- [ ] 中英文字体显示正确
- [ ] 刷新后语言选择保持

---

## ✅ 完成标准

当上述所有项都打勾后，Task 4（UI文案国际化迁移）即可宣布**完成并通过验收**！

**测试日期**: _______  
**测试人**: _______  
**问题记录**: _______
