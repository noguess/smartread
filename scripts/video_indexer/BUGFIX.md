# 下载进度显示修复说明

## 🐛 问题描述

在测试 V3.1 时发现：下载大视频或多P视频时，看起来程序"卡住"了，没有任何进度显示。

## 🔍 根本原因

代码中使用了 `capture_output=True`，这会捕获 `you-get` 的所有输出，导致：
- ❌ 用户看不到下载进度条
- ❌ 用户误以为程序卡死
- ❌ 下载44集视频时更加明显

## ✅ 修复方案

### 1. 移除输出捕获
```python
# 修复前
result = subprocess.run(
    download_cmd, 
    capture_output=True,  # ❌ 捕获输出，看不到进度
    text=True,
    timeout=600
)

# 修复后
result = subprocess.run(
    download_cmd,  # ✅ 让 you-get 直接显示进度
    timeout=1800
)
```

### 2. 增加超时时间
- **修复前**: 600秒 (10分钟) - 对于44集视频不够
- **修复后**: 1800秒 (30分钟) - 足够处理大型系列

### 3. 简化成功判断
```python
# you-get 返回码含义：
# 0 = 下载成功
# 1 = 文件已存在（也算成功）
if result.returncode in [0, 1]:
    return {"success": True, ...}
```

### 4. 添加友好提示
```
📥 Downloading video for BV1XksdztEvb...
  📺 Title: 【初中英语2000词】...
  ⏬ Starting download (this may take several minutes for multi-part videos)...
  💡 Tip: You can see you-get's progress below

[you-get 的实时进度条会在这里显示]
  ✅ Download complete
```

## 🧪 测试建议

```bash
# 重新测试之前失败的命令
python bilibili_indexer.py --bvids BV1XksdztEvb
```

现在你应该能看到：
1. 清晰的阶段提示
2. you-get 的实时下载进度
3. 每个分P视频的下载状态
4. 最终的完成确认

## 📝 其他改进

- ✅ 支持更长的下载时间（30分钟）
- ✅ 更准确的成功判断（返回码 0 和 1）
- ✅ 保持了重试机制（3次）
- ✅ 保持了错误追踪功能
