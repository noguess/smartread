# 前端字段名称不匹配Bug修复

## 🐛 问题描述

用户点击播放列表中的视频（例如 P13, P39），但始终播放第1个视频（P1）。

## 🔍 根本原因

**前端代码中的字段名与后端数据不匹配！**

### 数据结构对比

**后端 video_map.json (正确):**
```json
{
  "0": {
    "bvid": "BV1XksdztEvb",
    "page": 1,  ✅ 字段名是 "page"
    "title": "..."
  }
}
```

**前端 TypeScript 接口 (错误):**
```typescript
interface VideoMapItem {
    bvid: string
    p: number  ❌ 错误：应该是 "page" 不是 "p"
    title: string
}
```

**前端读取代码 (错误):**
```typescript
page: videoInfo.p,  ❌ 读取不存在的字段
```

### 结果

- `videoInfo.p` 返回 `undefined`
- Bilibili iframe URL 变成：`...&page=undefined&...`
- Bilibili 默认播放第1个视频（因为 page 参数无效）

## ✅ 修复方案

### 修复内容

**1. 修复接口定义 (第1-7行):**
```typescript
interface VideoMapItem {
    bvid: string
    page: number      // ✅ 修复：从 "p" 改为 "page"
    title: string
    filename: string  // ✅ 补充：添加缺失的字段
}
```

**2. 修复字段引用 (第71行):**
```typescript
occurrences.push({
    bvid: videoInfo.bvid,
    page: videoInfo.page,  // ✅ 修复：从 videoInfo.p 改为 videoInfo.page
    title: videoInfo.title,
    startTime: entry.t,
    context: entry.c
})
```

## 📊 影响范围

### 修复的文件
- ✅ `/src/services/videoIndexService.ts` (2处修改)

### 相关但不需要修改的文件
- ✅ `/src/components/WordDetailModal.tsx` (已正确使用 `occurrence.page`)

### 播放链接构造 (WordDetailModal.tsx 第116行)
```typescript
// 这部分代码已经是正确的，现在会收到正确的 page 值
src={`//player.bilibili.com/player.html?bvid=${selectedOccurrence.bvid}&page=${selectedOccurrence.page}&t=${Math.floor(selectedOccurrence.startTime)}&high_quality=1&autoplay=1`}
```

**修复前:**
```
https://player.bilibili.com/player.html?bvid=BV1XksdztEvb&page=undefined&t=91
```
→ 播放 P1（默认第一个视频）

**修复后:**
```
https://player.bilibili.com/player.html?bvid=BV1XksdztEvb&page=39&t=91
```
→ 播放 P39（正确的视频）

## 🧪 验证

刷新页面后，搜索任意单词，点击播放列表中的任意一项：

### 预期结果
- ✅ 显示正确的分P编号（如 P13, P39）
- ✅ 播放正确的视频分P
- ✅ 跳转到正确的时间点

### 测试案例
```
单词: "undefined"
出现位置:
  - P13 - 18.7s  ✅ 点击后应该播放 P13 的 18.7 秒处
  - P39 - 91.6s  ✅ 点击后应该播放 P39 的 91.6 秒处
  - P39 - 311.9s ✅ 点击后应该播放 P39 的 311.9 秒处
```

## 🎉 总结

### 问题链条

1. ❌ 后端数据字段：`"page"`
2. ❌ 前端接口定义：`p: number`
3. ❌ 前端读取：`videoInfo.p` → `undefined`
4. ❌ URL：`...&page=undefined&...`
5. ❌ 结果：总是播放第1个视频

### 修复后

1. ✅ 后端数据字段：`"page"`
2. ✅ 前端接口定义：`page: number`
3. ✅ 前端读取：`videoInfo.page` → 正确的数字
4. ✅ URL：`...&page=39&...`
5. ✅ 结果：播放正确的视频

---

**非常抱歉这个低级错误！** 这是一个典型的前后端接口不一致问题。现在已经完全修复，请刷新页面测试。
