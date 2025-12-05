# Prompt 优化方案

## 当前问题
- System Prompt 过长（~110 行，~2000 tokens）
- 生成时间：35-40 秒（占总时间 78-89%）
- 总耗时：~45 秒

## 优化方案对比

### 方案 A：简化 Prompt（推荐）★★★★★
**难度**：低  
**收益**：5-15 秒  
**风险**：中（可能影响输出质量）

**策略**：
1. 压缩重复性说明
2. 移除冗长示例
3. 使用更简洁的表达
4. 将详细规则移至用户 prompt

**实施步骤**：
- [ ] 精简 System Prompt 至 <50 行
- [ ] 测试输出质量是否下降
- [ ] 调整措辞以保持效果

**优化后 Prompt 示例**：
```
You are an English teacher creating Zhongkao study materials.
Generate a JSON article with embedded vocabulary and questions.

STRUCTURE:
{
  "title": "...",
  "content": "Markdown article (400-800 words). Bold ALL target words with **word**.",
  "readingQuestions": [/* 4 contextual questions */],
  "vocabularyQuestions": [/* 10-12 questions, see types below */]
}

QUESTION TYPES BY LEVEL:
L1 (10Q): cloze(3), definition(3), audio(2), matching(1x3)
L2 (10Q): contextual(4), spelling(2), cloze(2), synonym(1), audio(1)
L3 (12Q): spelling(3), contextual(3), wordForm(2), audio(2), synonym(1), matching(1x3)

RULES:
- Cloze: use article sentences
- Contextual: NEW sentences
- Audio/Spelling: include "phonetic" field
- Matching: "pairs" array + string[] answer
- Each vocab Q needs "targetWord"
```

---

### 方案 B：分阶段生成（最有效）★★★★★
**难度**：中  
**收益**：体验大幅提升（可提前显示文章）  
**风险**：低（增加 API 调用成本）

**策略**：
1. 第一次调用：生成文章 + 阅读题（~15秒）
2. 第二次调用：基于文章生成词汇题（~10秒）
3. 用户可以在第一阶段完成后开始阅读

**优点**：
- 用户感知时间大幅减少（15秒 vs 45秒）
- 可以在生成词汇题时提前阅读
- 失败重试更精准（只重试失败的部分）

**缺点**：
- API 调用次数增加（成本 ↑）
- 代码复杂度增加

---

### 方案 C：切换模型
**难度**：低  
**收益**：10-20 秒（取决于模型）  
**风险**：中（可能影响质量或增加成本）

**可选模型**：
| 模型 | 速度 | 质量 | 成本 | 推荐度 |
|------|------|------|------|--------|
| gpt-3.5-turbo | ⚡⚡⚡⚡ | ⭐⭐⭐ | 💰💰 | ★★★★ |
| gpt-4o-mini | ⚡⚡⚡ | ⭐⭐⭐⭐ | 💰💰💰 | ★★★★★ |
| deepseek-chat | ⚡⚡ | ⭐⭐⭐⭐ | 💰 | ★★★ (当前) |

---

### 方案 D：调整温度参数
**难度**：极低  
**收益**：2-5 秒  
**风险**：极低

**当前**：`temperature: 0.7`（较高，更多采样）  
**建议**：`temperature: 0.3`（更确定，更快）

**实施**：
```typescript
temperature: 0.3,  // 从 0.7 降低
```

---

### 方案 E：使用流式输出（UI 优化）★★★★
**难度**：高  
**收益**：用户体验大幅提升（感知时间 -60%）  
**风险**：低

**策略**：
- 使用 `stream: true`
- 逐字显示文章内容
- 问题部分仍需等待完整内容

**优点**：
- 用户立即看到内容生成（类似 ChatGPT）
- 感知等待时间大幅减少

**缺点**：
- 需要处理 JSON 不完整的问题
- 代码复杂度高

---

### 方案 F：缓存常见场景
**难度**：中  
**收益**：命中时 -100%（0秒）  
**风险**：低

**策略**：
- 缓存常见单词组合的生成结果
- 使用 LocalStorage 或 IndexedDB
- 设置过期时间（如 7 天）

**适用场景**：
- 用户反复练习相同的单词
- 高频单词组合

---

## 推荐实施顺序

### 🥇 第1阶段（立即实施，低风险）
1. **方案 D**：降低 temperature 至 0.3（30秒即可完成）
2. **方案 A**：简化 Prompt（1小时）

**预期收益**：减少 7-20 秒，总时长降至 25-38 秒

---

### 🥈 第2阶段（短期优化，1-2周）
3. **方案 C**：评估其他模型（如 gpt-4o-mini）
4. **方案 F**：实现简单的缓存机制

**预期收益**：常见场景下降至 0-15 秒

---

### 🥉 第3阶段（长期优化，需要时间）
5. **方案 B**：分阶段生成（最佳体验）
6. **方案 E**：流式输出（终极体验）

**预期收益**：用户感知等待时间降至 5-10 秒

---

## 成本效益分析

| 方案 | 开发时间 | 节省时间 | 成本增加 | ROI |
|------|----------|----------|----------|-----|
| D (温度) | 5 分钟 | 2-5秒 | 0 | ⭐⭐⭐⭐⭐ |
| A (Prompt) | 1-2 小时 | 5-15秒 | 0 | ⭐⭐⭐⭐⭐ |
| C (模型) | 30 分钟 | 10-20秒 | 可能 ↑ | ⭐⭐⭐⭐ |
| F (缓存) | 3-5 小时 | 0-45秒 | 存储空间 | ⭐⭐⭐⭐ |
| B (分阶段) | 5-8 小时 | 体验 ↑↑ | API ×2-3 | ⭐⭐⭐ |
| E (流式) | 10-15 小时 | 体验 ↑↑↑ | 0 | ⭐⭐⭐ |

---

## 下一步行动

建议立即实施：
1. ✅ 将 temperature 从 0.7 改为 0.3
2. ✅ 精简 System Prompt
3. 📊 测试并对比效果

预计总耗时可从 **45秒降至 25-30秒**（减少 33-44%）
