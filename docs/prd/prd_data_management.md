# PRD: 单词本数据管理与导入优化 (Wordbook Data Management)

## 1. 背景与问题 (Background & Problem)

**现状**：
目前应用在每次启动时（`App.tsx` 初始化阶段）会自动调用 `seedDatabase()` 方法。
**问题**：
1.  **数据重复**：由于缺乏严格的去重检测，每次刷新或重启应用可能导致相同的单词被重复写入数据库，造成单词本“莫名其妙增加”。
2.  **不可控**：用户无法选择是否导入数据，也无法控制导入的时机。
3.  **性能隐患**：随着词库增大，每次启动都进行全量检查/写入会拖慢应用启动速度。

## 2. 目标 (Objectives)

1.  **移除自动导入**：彻底剥离应用启动时的自动数据填充逻辑。
2.  **实现手动导入**：在“设置”页面提供明确的“导入基础词库”功能入口。
3.  **严格去重**：实现智能导入逻辑，确保**拼写（spelling）相同**的单词绝不会重复添加。
4.  **反馈透明**：导入过程应提供进度反馈，并在结束后告知用户（成功导入 X 个，跳过重复 Y 个）。

## 3. 解决方案 (Solution)

### 3.1 架构调整
- **废除**: 删除 `App.tsx` 中的 `seedDatabase()` 调用。
- **新增**: 创建独立的 `DataImportService` (或在 `WordService` 中扩展)，专门负责数据清洗和导入。

### 3.2 交互设计 (UI/UX)
- **位置**: `SettingsPage` (设置页面) -> 新增 "Data Management" (数据管理) 卡片。
- **控件**:
  - 按钮: "Import Core Vocabulary" (导入核心词库)
  - 状态显示: 导入中显示进度条或 Loading 状态。
- **反馈**:
  - 成功 Toast: "Import Complete: Added 50 new words, skipped 616 duplicates."

### 3.3 核心逻辑 (The "Script")

我们将实现一个健壮的导入函数 `importWords(sourceData)`，逻辑如下：

```typescript
async function importWords(words: Word[]) {
    let addedCount = 0;
    let skippedCount = 0;

    for (const word of words) {
        // 1. 归一化检查 (转小写比较，防止 'Apple' 和 'apple' 重复)
        const exists = await db.words
            .where('spelling')
            .equalsIgnoreCase(word.spelling)
            .first();

        if (exists) {
            // 2. 如果存在，跳过 (或者根据策略更新)
            skippedCount++;
        } else {
            // 3. 如果不存在，插入
            await db.words.add({
                ...word,
                status: 'New',
                created: Date.now()
            });
            addedCount++;
        }
    }

    return { addedCount, skippedCount };
}
```

## 4. 详细需求 (Requirements)

### 4.1 功能需求
1.  **停止自动 Seed**: 应用启动时不应有任何写数据库操作。
2.  **去重规则**:
    - 唯一标识: `spelling` (单词拼写)。
    - 比较方式: 忽略大小写 (Case-insensitive)。
3.  **导入源**: 使用现有的 `zhongkao_words.js` 或 `zkgaopinci666.csv` 作为基础词库源。
4.  **执行结果**: 必须返回准确的“新增数量”和“跳过数量”。

### 4.2 非功能需求
- **安全性**: 导入操作不应破坏现有的用户学习记录（如已标记为 "Mastered" 的单词不应被重置为 "New"）。
- **性能**: 批量导入时应考虑使用 Dexie 的 `bulkAdd` 或事务，避免频繁 IO 卡顿 UI（虽然为了去重可能需要逐个检查，或者先批量读取所有现有单词进行内存比对）。

## 5. 验收标准 (Acceptance Criteria)

- [ ] 刷新页面，单词本数量**不再自动增加**。
- [ ] 设置页面出现“导入基础词库”按钮。
- [ ] 点击导入按钮：
    - [ ] 第一次点击：成功导入所有词汇（如 666 个）。
    - [ ] 第二次点击：提示“成功导入 0 个，跳过 666 个重复”。
- [ ] 检查数据库，确认没有重复的单词（如两个 "apple"）。
- [ ] 现有单词的学习状态（如 "Mastered"）在导入操作后保持不变。

---
**注**：此方案将原本隐式的“脚本”逻辑显式化为用户可控的功能，既解决了重复问题，也保证了数据的安全性。
