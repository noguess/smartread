---
description: 扫描当前文件中的硬编码字符串，并提取到语言包中
---

---
description: "扫描当前文件中的硬编码字符串，并提取到语言包中"
---

# 🌍 Auto I18n Extractor (国际化提取器)

你现在的任务是把当前文件中的 Hardcoded Strings 转换为 I18n Keys。

## Step 1: Scan & Identify
扫描当前打开的组件文件，找出所有渲染在界面上的中文/英文字符串（排除注释和日志）。

## Step 2: Extract & Replace
对于每一个字符串：
1. 生成一个语义化的 Key (如 `settings.profile.title`)。
2. 将代码中的 `"设置"` 替换为 `{t('settings.profile.title')}`。

## Step 3: Update Locale Files
读取 `src/locales/zh.json` 和 `en.json`(或对应文件)：
1. 在两个文件中同步追加新生成的 Key。
2. 对于英文翻译，如果我没提供，请根据中文自动翻译。

## Step 4: Verification
展示修改后的 Git Diff，确认没有破坏代码逻辑。

---

**使用方法**:
当你发现 Agent 忘记写国际化时，直接输入：`/i18n-fix`