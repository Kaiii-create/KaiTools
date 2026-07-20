# KTool

一个基于 **Tauri 2 + Vue 3** 开发的轻量级桌面开发工具箱，内置多种日常开发常用的小工具，开箱即用，仅支持 Windows 平台。

## ✨ 功能特性

内置 14 个实用工具：

| 工具 | 说明 |
|------|------|
| JSON 格式化 | 格式化 / 压缩 / 校验 JSON |
| 时间戳转换 | 时间戳与日期互转 |
| Base64 / URL | 编码与解码 |
| 二维码生成 | 文本 / 链接生成二维码 |
| HTTP 请求 | 简单的接口调试 |
| 代码格式化 | 代码美化 |
| 加密工具 | 常见加解密（基于 crypto-js） |
| 颜色处理 | 颜色格式转换 |
| 世界时钟 | 多时区时间对照 |
| 图片转 ICO | 生成应用图标 |
| 键盘统计 | 按键使用统计 |
| 代码对比 | diff 文本差异 |
| Markdown 编辑器 | 实时预览编辑 |

## 🛠 技术栈

- **桌面框架**：[Tauri 2](https://v2.tauri.app/)
- **前端**：Vue 3 + TypeScript + Vite
- **UI**：Naive UI + Tailwind CSS
- **状态管理**：Pinia
- **包管理器**：pnpm

## 🚀 开发环境

### 前置要求

- Node.js（建议 18+）
- [Rust 工具链](https://www.rust-lang.org/tools/install)（Tauri 编译需要）
- pnpm：`npm install -g pnpm`

### 安装依赖

```bash
pnpm install
```

### 启动开发模式

```bash
pnpm tauri dev
```

> 这会自动启动 Vite 开发服务器（端口 1420）并打开桌面窗口。

### 打包发布

```bash
pnpm tauri build
```

> 产物为 Windows 安装包（`.msi` / `.nsis`），位于 `src-tauri/target/release/`。

## 📁 项目结构

```
kai-tools/
├── src/                 # 前端源码（Vue 3）
│   ├── tools/           # 各工具模块 + 中央注册表 registry.ts
│   ├── components/      # 公共组件
│   ├── stores/          # Pinia 状态（含主题）
│   └── styles/          # 全局样式（Tailwind）
├── src-tauri/           # Tauri (Rust) 桌面壳
├── index.html
└── vite.config.ts
```

## ➕ 新增工具

1. 在 `src/tools/<tool-id>/` 下实现 `ToolModule` 接口。
2. 在 `src/tools/registry.ts` 中 `import` 并 `register(...)` 一行即可。

## 📄 License

MIT
