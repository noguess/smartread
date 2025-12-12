---
description: "部署前预检查：执行 Lint、TypeScript 检查、单元测试和本地构建，防止 CI/CD 失败"
---

# 🚀 Pre-Deploy Check (部署前预检)

在推送代码到远程仓库或触发 Vercel 部署前，**必须**运行此工作流。它可以发现本地能运行但构建会失败的隐蔽问题（如未使用的变量、类型错误）。

## Step 1: Lint & Code Quality (代码质量检查)
1. 运行 ESLint 检查，确保没有语法错误和未使用的变量。
   - Command: `npm run lint`
2. 如果有 Lint 错误，**必须修复**后再继续。

## Step 2: Type Check & Build (类型与构建检查)
1. 运行完整的类型检查和生产环境构建。这是 Vercel 部署失败的最常见原因。
   - Command: `npm run build`
   > 注意: `npm run build` 包含了 `tsc -b` (类型检查) 和 `vite build` (打包)。
2. 如果构建失败，分析错误日志并修复。常见的错误包括：
   - 这里的类型定义不匹配
   - 引用了不存在的属性
   - 未使用的变量 (当 `tsconfig` 配置了 `noUnusedLocals` 时)

## Step 3: Unit Tests (单元测试)
1. 运行一次全量单元测试，确保没有逻辑回归。
   - Command: `npm run test -- run`
   > `-- run` 参数确保 vitest 只运行一次后退出，而不是进入 watch 模式。

## Step 4: Ready confirm
如果上述所有步骤都通过（Exit Code 0），则代码已准备好部署。

> ✅ **Pre-Deploy Check Passed**
> 你的代码已通过本地验证，可以放心地 `git push` 了！
