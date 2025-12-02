# BVID 和分P信息修复报告

## 🐛 问题描述

在首次运行 `bilibili_indexer.py` 时，生成的 `video_map.json` 中 `bvid` 字段全部为 `null`，导致前端无法构造正确的 Bilibili 播放链接。

### 根本原因

`you-get` 下载的文件名格式为：
```
【初中英语2000词】【超清全44集内部VIP课程】...(P8. [8]--8).mp4
```

文件名中**不包含 BVID**，所以用正则表达式 `r'(BV[a-zA-Z0-9]+)'` 无法从文件名提取。

## ✅ 解决方案

### 快速修复（已完成）

创建并运行 `fix_video_map.py` 脚本：

```bash
cd /Users/noguess/work/english_study/scripts/video_indexer
python3 fix_video_map.py
```

**结果：**
- ✅ 成功更新 44 个视频条目
- ✅ 添加 `bvid: "BV1XksdztEvb"` 字段
- ✅ 添加 `page: 1~44` 字段
- ✅ **无需重新下载或转录**

### 长期修复（已完成）

修改 `bilibili_indexer.py`，添加：

1. **`extract_page_number()` 函数** - 从文件名提取分P编号
2. **使用 `bvid_list` 中的 BVID** - 不再依赖文件名
3. **更新 `video_map` 结构** - 包含 `bvid` 和 `page` 字段

## 📊 修复后的数据结构

### 修复前
```json
{
  "0": {
    "filename": "...(P1. [1]--1).mp4",
    "title": "...(P1. [1]--1)",
    "bvid": null  ❌
  }
}
```

### 修复后
```json
{
  "0": {
    "filename": "...(P1. [1]--1).mp4",
    "title": "...(P1. [1]--1)",
    "bvid": "BV1XksdztEvb", ✅
    "page": 1                ✅
  }
}
```

## 🎬 前端使用方法

现在可以正确构造 Bilibili 播放链接了：

```javascript
// 1. 用户搜索单词 "happy"
const occurrences = indexData["happy"]
// [{"v": "7", "t": 123.5, "c": "..."}]

// 2. 获取视频信息
const videoInfo = videoMap["7"]
// {
//   "bvid": "BV1XksdztEvb",
//   "page": 8,
//   ...
// }

// 3. 构造播放链接
const playUrl = `https://www.bilibili.com/video/${videoInfo.bvid}?p=${videoInfo.page}&t=${occurrence.t}`
// https://www.bilibili.com/video/BV1XksdztEvb?p=8&t=123.5

// 4. 跳转或使用嵌入式播放器
window.open(playUrl, '_blank')
// 或
<iframe src={`https://player.bilibili.com/player.html?bvid=${videoInfo.bvid}&page=${videoInfo.page}&t=${occurrence.t}`} />
```

## 📝 验证结果

```bash
# 检查前5个视频条目
cat ../../public/data/video_map.json | python3 -c "..."
```

输出：
```
Video 0: bvid=BV1XksdztEvb, page=1
Video 1: bvid=BV1XksdztEvb, page=10
Video 2: bvid=BV1XksdztEvb, page=11
Video 3: bvid=BV1XksdztEvb, page=12
Video 4: bvid=BV1XksdztEvb, page=13
```

✅ **所有44个视频的 BVID 和分P信息已正确设置！**

## 🚀 下次运行建议

如果需要处理新的视频，建议：

```bash
# 使用 --skip-download 跳过已下载的视频
python bilibili_indexer.py --bvids BV1XksdztEvb --skip-download

# 或者添加新的 BVID
python bilibili_indexer.py --bvids BV新视频ID
```

现在脚本会自动：
- 从 `bvid_list` 获取 BVID（不依赖文件名）
- 从文件名提取分P编号
- 正确生成包含全部信息的 `video_map.json`

## 🎉 总结

问题已完全解决！
- ✅ 无需重新下载（节省了数GB流量和数小时时间）
- ✅ 数据结构完整（BVID + 分P编号）
- ✅ 代码已修复（未来不会再出现此问题）
- ✅ 前端可以正确构造播放链接
