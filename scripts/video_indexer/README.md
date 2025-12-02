# Bilibili Video Indexer V3.1 - Enhanced Robust Edition

## 🎯 功能概述

自动从 Bilibili 视频中提取英文单词并生成时间戳索引，用于前端「单词视频定位」功能。

## ✨ 新增功能（V3.1）

### 1. 下载重试机制
- ✅ 自动重试失败的下载（最多3次）
- ✅ 10分钟下载超时保护
- ✅ 详细的失败原因记录
- ✅ 下载失败不影响其他视频处理

### 2. 灵活的视频输入方式
```bash
# 方式1: 硬编码在脚本中（编辑 BVID_LIST）
python bilibili_indexer.py

# 方式2: 命令行参数
python bilibili_indexer.py --bvids BV1234567890 BV0987654321

# 方式3: 从文件读取
python bilibili_indexer.py --bvid-file videos.txt
```

### 3. 进度条显示
- ✅ 下载进度（需要安装 tqdm: `pip install tqdm`）
- ✅ 处理进度
- ✅ 当前处理文件名显示

### 4. 其他改进
- 🎨 Emoji 图标日志输出，更易读
- 🔧 新增 `--skip-download` 参数，只处理已下载视频
- 📝 改进的帮助文档

## 📖 使用指南

### 安装依赖
```bash
# 可选：安装进度条库（推荐）
pip install tqdm
```

### 场景1: 处理单个视频
```bash
python bilibili_indexer.py --bvids BV1XksdztEvb
```

### 场景2: 处理系列视频
创建 `videos.txt` 文件：
```
# 我的视频列表
BV1234567890
https://www.bilibili.com/video/BV0987654321
BV1111111111
```

然后运行：
```bash
python bilibili_indexer.py --bvid-file videos.txt
```

### 场景3: 重试失败的视频
如果上次运行有视频失败，使用：
```bash
python bilibili_indexer.py --retry-failed
```

### 场景4: 只处理已下载视频（跳过下载）
```bash
python bilibili_indexer.py --skip-download
```

## 📁 输出文件

处理完成后，会在 `public/data/` 目录生成：

- `video_map.json` - 视频元数据映射
- `index_a.json`, `index_b.json`, ... - 按字母分片的单词索引
- `metadata.json` - 总体统计信息
- `failed_videos.json` - 失败记录（如果有）

## 🛡️ 健壮性特性

| 特性 | 说明 |
|------|------|
| **缓存机制** | 转录结果自动缓存，避免重复ASR |
| **断点续传** | 检测已处理视频，自动跳过 |
| **失败重试** | 下载失败自动重试3次 |
| **异常容错** | 单个视频失败不影响整体流程 |
| **资源清理** | 自动删除临时音频文件 |
| **多P支持** | 自动处理多P视频系列 |

## 🔧 高级配置

编辑脚本顶部的配置项：

```python
# 停用词列表（不会被索引的常见词）
STOP_WORDS = {'a', 'an', 'the', ...}

# 输出目录
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "public", "data")

# 临时下载目录
TEMP_DIR = os.path.join(SCRIPT_DIR, "temp_downloads")
```

## 📊 数据过滤策略

1. **频率密度过滤**: 只保留在2分钟内出现≥3次的单词（被教授的单词）
2. **去重**: 移除60秒内的重复出现
3. **停用词过滤**: 排除常见功能词

## ❓ 常见问题

### Q: 下载失败怎么办？
A: 脚本会自动重试3次。如果仍然失败，检查：
   - 是否安装了 `you-get`
   - 网络连接是否正常
   - BVID 是否正确

### Q: 如何查看详细错误？
A: 不使用 tqdm 时会显示完整的 traceback。或者查看 `failed_videos.json`

### Q: 可以中断后继续吗？
A: 可以！脚本会自动检测已缓存的转录结果，只处理未完成的视频

## 📝 版本历史

### V3.1 (2025-12-01)
- ✨ 添加下载重试机制和超时保护
- ✨ 支持命令行参数和文件输入BVID
- ✨ 添加进度条显示（可选）
- 🎨 改进日志输出格式

### V3.0 (Previous)
- 缓存机制
- 频率密度过滤
- 失败视频追踪
