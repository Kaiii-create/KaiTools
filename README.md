<div align="center">
  <img src="src/assets/brand/ktool-app-icon-ui.png" width="88" alt="KTool 图标" />
  <h1>KTool</h1>
  <p>轻量、实用、长期可用的 Windows 开发者工具箱</p>

  [![Release](https://img.shields.io/github/v/release/Kaiii-create/KaiTools?display_name=tag)](https://github.com/Kaiii-create/KaiTools/releases/latest)
  [![Downloads](https://img.shields.io/github/downloads/Kaiii-create/KaiTools/total)](https://github.com/Kaiii-create/KaiTools/releases)
  [![CI](https://github.com/Kaiii-create/KaiTools/actions/workflows/ci.yml/badge.svg)](https://github.com/Kaiii-create/KaiTools/actions/workflows/ci.yml)
  [![License](https://img.shields.io/github/license/Kaiii-create/KaiTools)](LICENSE)
</div>

KTool 基于 **Tauri 2 + Vue 3 + TypeScript** 开发，聚合日常编码、格式化、转换、调试和效率工具。数据默认保存在本机，无需登录，仅支持 Windows。

## 下载与安装

前往 [GitHub Releases](https://github.com/Kaiii-create/KaiTools/releases/latest) 下载最新版本：

- 推荐：`KTool_*_x64-setup.exe`，普通 Windows 安装程序。

安装器检测到 D 盘时，默认安装到 `D:\KTool`，也可以在安装界面手动选择其他目录；电脑没有 D 盘时会安全回退到 Windows 默认目录。

> 若 Windows 显示“未知发布者”，说明该构建尚未完成代码签名。请确认安装包来自本仓库的 Releases 页面后再继续安装。

## Code signing policy

Free code signing provided by [SignPath.io](https://about.signpath.io/), certificate by [SignPath Foundation](https://signpath.org/).

### Roles

- Committers and reviewers: [Kaiii-create](https://github.com/Kaiii-create)
- Approvers: [Kaiii-create](https://github.com/Kaiii-create)

### Privacy

KTool stores application data locally by default and does not require registration or login.

This program will not transfer any information to other networked systems unless specifically requested by the user, such as when using the HTTP request tool, loading a user-provided remote resource, or opening an external link.

See the full [Privacy Policy](PRIVACY.md), including local history, keyboard statistics, and network access details.

## 功能

| 分类 | 工具 |
| --- | --- |
| 编码与格式化 | JSON 格式化、Base64 / URL 编解码、代码格式化、Markdown 编辑器 |
| 对比与测试 | 代码对比、正则测试器、HTTP 请求 |
| 时间与转换 | 时间戳转换、世界时钟、进制转换、颜色工具、图片转 ICO |
| 二维码 | 二维码生成、二维码解码 |
| 安全与生成 | MD5 / SHA、UUID、随机密码生成 |
| 文本效率 | 文本去重、排序、替换、前后缀批处理 |
| 独立功能 | 全局键盘统计、每日趋势、桌面迷你键盘 |

主要体验：

- 浅色、深色与跟随系统主题。
- 可配置全局强调色。
- 有明确输入与输出的工具支持历史记录及一键恢复。
- 键盘统计支持历史总计、每日数据、87/104 键布局和桌面小窗。
- Windows 原生安装包，体积和运行开销较低。

## 建议功能与问题反馈

如果你希望增加新工具、改进交互，或者遇到了 Bug，欢迎提交 [Issue](https://github.com/Kaiii-create/KaiTools/issues/new/choose)。请尽量写清楚：

- 想解决的问题或使用场景。
- 期望的操作方式和结果。
- Bug 的复现步骤、系统版本及截图。

我会评估需求的通用性和维护成本，并考虑加入后续迭代。相似需求建议集中在同一个 Issue 中讨论。

## 参与贡献

欢迎一起完善 KTool。常规贡献流程如下：

1. Fork 本仓库。
2. 从 `main` 创建功能分支，例如 `feat/new-tool` 或 `fix/json-format`。
3. 完成修改，并运行 `pnpm run build` 与 `cargo check --manifest-path src-tauri/Cargo.toml`。
4. 提交代码并推送到自己的 Fork。
5. 向本仓库的 `main` 分支发起 [Pull Request](https://github.com/Kaiii-create/KaiTools/pulls)。
6. 维护者审核、讨论和测试后决定是否合并。

提交新工具时，请尽量复用现有设计 token、公共组件和历史记录机制，保持浅色/深色主题一致。

## 本地开发

### 环境要求

- Node.js 20+
- pnpm 10+
- [Rust stable](https://www.rust-lang.org/tools/install)
- Windows 10/11 与 Microsoft C++ Build Tools

```bash
git clone https://github.com/Kaiii-create/KaiTools.git
cd KaiTools
pnpm install
pnpm tauri dev
```

前端检查：

```bash
pnpm run build
```

构建 Windows 安装包：

```bash
pnpm tauri build
```

安装包通常位于：

```text
src-tauri/target/release/bundle/nsis/
src-tauri/target/release/bundle/msi/
```

## 发布新版本

仓库已配置 GitHub Actions。推送 `v*` 标签后，会在 Windows 构建机上自动生成 NSIS `.exe` 安装程序，并上传到 GitHub Releases。

发布前需要同步修改以下三个版本号，例如统一改为 `0.2.0`：

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

确认代码已提交并推送后执行：

```bash
git tag v0.2.0
git push origin main
git push origin v0.2.0
```

随后在仓库的 **Actions** 页面查看构建进度，在 **Releases** 页面确认下载文件和发布说明。

## 技术栈

- [Tauri 2](https://v2.tauri.app/)
- Vue 3、TypeScript、Vite
- Naive UI、Tailwind CSS
- Pinia
- Rust

## 项目结构

```text
KaiTools/
├── .github/workflows/     # CI 与自动发布
├── src/
│   ├── components/        # 公共界面组件
│   ├── composables/       # 公共业务逻辑
│   ├── stores/            # Pinia 状态
│   ├── styles/            # 全局主题与样式
│   └── tools/             # 工具模块与注册表
├── src-tauri/             # Rust、Tauri 与安装器配置
└── README.md
```

## License

[MIT](LICENSE) © 2026 kai
