# 文件排序Bug修复报告

## 🐛 问题描述

用户搜索单词后，发现显示的是第27个视频，但播放时却跳转到第1个视频。

## 🔍 根本原因

`scan_video_files()` 函数使用了**字母排序**（`files.sort()`），导致文件顺序错误：

```
错误的顺序：
P1, P10, P11, P12, ..., P19, P2, P20, P21, ..., P9

正确的顺序应该是：
P1, P2, P3, P4, ..., P9, P10, P11, ..., P44
```

### 导致的问题

| Video ID | 错误的Page | 正确的Page |
|----------|-----------|-----------|
| 0 | 1 ✅ | 1 |
| 1 | 10 ❌ | 2 |
| 2 | 11 ❌ | 3 |
| 9 | 18 ❌ | 10 |
| 11 | 2 ❌ | 12 |
| 26 | 7 ❌ | 27 |

## ✅ 解决方案

### 修复代码

修改 `scan_video_files()` 函数，使用**按分P编号的数字排序**：

```python
def scan_video_files(directory):
    """Scan for video files in directory and sort by page number"""
    video_extensions = {'.mp4', '.flv', '.mkv', '.mov'}
    files = []
    for f in os.listdir(directory):
        ext = os.path.splitext(f)[1].lower()
        if ext in video_extensions:
            files.append(os.path.join(directory, f))
    
    # Sort by page number extracted from filename, not alphabetically
    def get_page_number(filepath):
        filename = os.path.basename(filepath)
        page_num = extract_page_number(filename)
        return page_num if page_num is not None else 9999
    
    files.sort(key=get_page_number)  # ✅ 数字排序
    return files
```

### 重新生成索引

由于转录缓存已存在，重新索引非常快（无需重新下载和转录）：

```bash
python3 bilibili_indexer.py --skip-download --bvids BV1XksdztEvb
```

**结果：**
- ✅ 44个视频全部重新索引
- ✅ 使用缓存的转录结果，无需重新 ASR
- ✅ 只需几秒钟即可完成

## 📊 验证结果

### 完整验证
```
Total videos: 44
Errors: 0
✅ All mappings correct!
```

### 映射关系（前20个）
```
ID  0: Page  1  ✅
ID  1: Page  2  ✅
ID  2: Page  3  ✅
ID  3: Page  4  ✅
...
ID 26: Page 27  ✅  <- 这个之前是错的！
...
ID 43: Page 44  ✅
```

### 实际测试案例

单词 "sentence" 的索引：
```
Occurrence 1:
  Video ID: 9
  -> Page: 10
  -> BVID: BV1XksdztEvb
  -> Time: 0.0s
  -> URL: https://www.bilibili.com/video/BV1XksdztEvb?p=10&t=0.0

Occurrence 2:
  Video ID: 9
  -> Page: 10
  -> Time: 117.2s
  -> URL: https://www.bilibili.com/video/BV1XksdztEvb?p=10&t=117.2
```

**验证：Video ID 9 正确对应 Page 10！** ✅

## 🎯 修复总结

| 项目 | 状态 | 说明 |
|------|------|------|
| 代码修复 | ✅ | scan_video_files() 使用数字排序 |
| 索引重建 | ✅ | 44个视频全部正确重新索引 |
| 映射验证 | ✅ | 所有 video_id → page 映射正确 |
| 实际测试 | ✅ | 单词搜索跳转正确 |

## 🔧 前端使用

现在前端可以正确获取视频信息了：

```javascript
// 1. 搜索单词
const occurrences = indexData["sentence"]

// 2. 获取视频信息
const occurrence = occurrences[0]  // {"v": "9", "t": 117.2, ...}
const videoInfo = videoMap["9"]    
// {
//   "bvid": "BV1XksdztEvb",
//   "page": 10,  ✅ 正确！
//   ...
// }

// 3. 构造URL
const url = `https://www.bilibili.com/video/${videoInfo.bvid}?p=${videoInfo.page}&t=${occurrence.t}`
// https://www.bilibili.com/video/BV1XksdztEvb?p=10&t=117.2
```

## 🎉 结论

问题已完全解决！
- ✅ Video ID 和 Page Number 映射完全正确
- ✅ 搜索单词后会跳转到正确的视频
- ✅ 时间戳也正确对应
- ✅ 代码已修复，未来不会再出现此问题

用户现在搜索任何单词，都能跳转到正确的视频和时间点了！
