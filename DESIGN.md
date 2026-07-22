# DESIGN.md

> KTool 视觉与交互设计权威规范
> 适用于人类贡献者与 AI Coding Agent 的唯一设计真相来源。

---

## 1. 文档目的

本文件是 KTool 的**唯一设计真相来源（Single Source of Truth）**。任何对界面结构、配色、字号、间距、组件外观、动效的修改，都必须以本文件为准。

- **人类贡献者**：PR 前请阅读第 28 节 Checklist。
- **AI Coding Agent**：执行 UI 任务前必须加载本文件，并严格遵守第 29 节执行规则。

本规范兼容当前技术栈（Tauri 2 + Vue 3 + TypeScript + Naive UI + Tailwind CSS + Pinia），目标是让 KTool 在保留全部功能与布局逻辑的前提下，呈现为"正式发布的 Windows 开发者工具"，而非后台模板或组件库 Demo。

---

## 2. 产品与品牌定位

| 项 | 定义 |
|---|---|
| 产品名称 | KTool |
| 类型 | Windows 桌面开发者工具箱（Tauri 2 原生窗口） |
| 用户 | 开发者 |
| 场景 | 高频、长时间使用 |
| 设计原型 | Native Desktop Developer Tool |
| 关键词 | 简洁 · 专业 · 克制 · 高效 · Developer-first · 长时间不疲劳 |
| 风格参考 | Raycast / Linear / Windows 11 / PowerToys / VS Code 布局逻辑 |

**品牌语气**：冷静、精确、无装饰噪音。我们不做"炫酷"，只做"好用且耐看"。

**禁止气质**：后台管理系统模板、Glassmorphism、Neon、赛博朋克、AI 科技风、大面积渐变、大圆角、夸张阴影、彩虹色工具图标、卡片套卡片。

---

## 3. 设计原则

1. **层级靠面，不靠线**：用背景明度差划分区域，避免 1px 描边堆叠。
2. **单一色相**：中性灰为主，仅一种品牌色（靛蓝）作为唯一强调色。禁用多色相。
3. **克制统一**：同一类控件全应用同一套尺寸、圆角、hover、字重。
4. **主次分明**：双栏不强制对称，结果区应比输入区更"浮现"。
5. **节奏感**：间距、字号、圆角只使用本文件的收敛阶梯，禁止任意值。
6. **长时间不疲劳**：低对比边框、柔和阴影、正文基准字号不小于 14px。
7. **去组件库感**：Naive UI 必须深度覆盖到"看不出是 Naive UI"。

---

## 4. Color System

下表为默认色值。用户可在“设置 → 外观 → 强调色”中覆盖品牌色；悬停、按下与柔和背景色会自动派生，并始终保持单一强调色体系。

### 4.1 语义变量（CSS 变量，定义在 `src/styles/main.css`）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--ktool-brand` | `#4f46e5` | `#6366f1` | 唯一品牌色 / 激活态 / 主按钮 |
| `--ktool-brand-hover` | `#4338ca` | `#818cf8` | 品牌色 hover |
| `--ktool-brand-active` | `#3730a3` | `#4f46e5` | 品牌色按下 |
| `--ktool-brand-contrast` | `#ffffff` | `#ffffff` | 主按钮文字 |
| `--ktool-brand-soft` | `rgba(79,70,229,0.10)` | `rgba(99,102,241,0.16)` | 激活底 / focus ring |
| `--ktool-danger` | `#e5484d` | `#f2555a` | 错误 / 危险 |
| `--ktool-danger-hover` | `#d23b40` | `#ff6b70` | — |
| `--ktool-success` | `#2ba24c` | `#3fbf6a` | 成功状态点 |
| `--ktool-warning` | `#d9a23b` | `#e0ad4a` | 警告状态点 |

### 4.2 中性背景阶梯（Light → Dark）

| Token | Light | Dark | 用途 |
|---|---|---|---|
| `--ktool-bg` | `#f6f7f9` | `#0e1014` | 应用最底层 / Sidebar |
| `--ktool-windowbar` | `#f7f7f8` | `#17191e` | 窗口顶栏 |
| `--ktool-surface` | `#ffffff` | `#16181d` | 主区 / 卡片 / 弹层 |
| `--ktool-surface-2` | `#f1f2f5` | `#1b1e24` | hover 底 / 次级控件 |
| `--ktool-surface-3` | `#e9ebef` | `#23272f` | 按下底 |
| `--ktool-surface-inset` | `#f3f4f6` | `#121419` | 可选辅助编辑区内陷底（非默认） |

### 4.3 边框与文本

| Token | Light | Dark |
|---|---|---|
| `--ktool-border` | `#e4e6ea` | `#262a32` |
| `--ktool-border-strong` | `#d4d7dd` | `#333943` |
| `--ktool-text` | `#1f232b` | `#e7e9ed` |
| `--ktool-text-soft` | `#5b626e` | `#a7aeb9` |
| `--ktool-text-mute` | `#9298a3` | `#6b7280` |

### 4.4 阴影（柔和，禁止夸张）

| Token | Light | Dark |
|---|---|---|
| `--ktool-shadow-sm` | `0 1px 2px rgba(16,18,23,0.06), 0 1px 3px rgba(16,18,23,0.06)` | `0 1px 2px rgba(0,0,0,0.4)` |
| `--ktool-shadow-md` | `0 4px 16px rgba(16,18,23,0.08)` | `0 6px 18px rgba(0,0,0,0.45)` |
| `--ktool-shadow-lg` | `0 12px 32px rgba(16,18,23,0.12)` | `0 16px 40px rgba(0,0,0,0.55)` |

### 4.5 工具图标颜色规则

**所有工具图标必须使用中性色，禁止使用彩色 accent。**

- 常规项：`--ktool-text-mute`
- 激活项：`--ktool-brand`
- 当前工具页 TitleBar 左侧图标：`--ktool-brand`

> 现有 `ToolModule.accent` 字段在新页面中**不得用于侧栏/标题栏着色**；如保留字段，仅可用于工具专属结果高亮（非界面框架）。

---

## 5. Typography

### 5.1 字号阶梯（仅允许以下 5 档）

| 档 | px | 用途 |
|---|---|---|
| `--fs-caption` | 11 | 辅助说明、kbd 标注、分组小标（uppercase） |
| `--fs-secondary` | 13 | 次要文本、列表项、状态栏、pane-head |
| `--fs-body` | 14 | **正文基准**，所有内容默认字号 |
| `--fs-title` | 16 | 面板标题、TitleBar 标题 |
| `--fs-page` | 20 | 页面级标题（如需要） |

### 5.2 字重

| 用途 | 字重 |
|---|---|
| 正文 / 列表项 | 400 / 500 |
| 标题 / 分组标签 / pane-head | 600 |
| 禁止 | 700+ 粗体堆砌 |

### 5.3 字体族

```
-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
"Microsoft YaHei", "Helvetica Neue", Arial, sans-serif
```

代码 / 编辑器 / 行号：`"JetBrains Mono", "Fira Code", "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace`

### 5.4 行高

- 正文：`1.5`
- 标题：`1.2`
- 代码：`1.6`

---

## 6. Spacing System

**仅允许以下六个值，禁止中间值（如 7 / 10 / 14 / 18）。**

| Token | px | 典型用途 |
|---|---|---|
| `--sp-1` | 4 | 图标与文字间距、紧凑内距 |
| `--sp-2` | 8 | 控件内距、小间距 |
| `--sp-3` | 12 | 区块内距、控件间距 |
| `--sp-4` | 16 | 标准页面外距、卡片内距 |
| `--sp-6` | 24 | 大区块间距 |
| `--sp-8` | 32 | 页面级分区间距 |

Tailwind 侧使用 `p-1/p-2/p-3/p-4/p-6/p-8` 与对应 `m-*`、`gap-*`。

---

## 7. Radius System

**仅允许以下四档。禁止 10px / 16px / 圆形大圆角（除非头像/状态点）。**

| Token | px | 用途 |
|---|---|---|
| `--ktool-radius-sm` | 4 | 内部小元素、kbd、tag |
| `--ktool-radius` | 6 | 按钮（small）、switch、输入框 |
| `--ktool-radius-md` | 8 | 卡片、面板、主按钮 |
| `--ktool-radius-lg` | 12 | 弹窗、Dialog、大型容器 |

---

## 8. Border 和 Elevation

- **分隔优先用明度差（bg / surface / surface-2 / inset）**，边框仅在必要时使用。
- 边框默认 `--ktool-border`，强度对比用 `--ktool-border-strong`。
- 禁止双重描边（卡片内再套带边框卡片）。
- Elevation 仅用 `--ktool-shadow-sm/md/lg` 三档，禁止自定义大阴影。
- 容器策略二选一：**（a）无边框 + inset 底色** 或 **（b）无边框 + md 阴影**，不要同时加。

---

## 9. Icon System

### 9.1 图标库

统一使用 `@vicons/ionicons5`（与现有代码一致），禁止混用多套图标库。

### 9.2 尺寸阶梯

| 场景 | 尺寸 |
|---|---|
| 窗口品牌图标 | 24 |
| 工具/section 级图标（TitleBar） | 20 |
| **标准控件 / 侧栏 / 按钮图标** | **16** |
| 密集区 tiny 操作（如 pane-head text 按钮） | 13 |

### 9.3 颜色

- 标准图标：`--ktool-text-soft`
- 激活/主操作图标：`--ktool-brand`
- 禁止：彩色 accent、彩虹图标、hover 才变色的随机色。

### 9.4 统一图标按钮类

全局提供 `.ktool-icon-btn`：30×30，radius 6，透明底，hover `--ktool-surface-2`，图标 16px。TitleBar / pane-head / Editor 内所有零散 icon 按钮必须复用此类。

---

## 10. Motion System

| Token | 值 | 用途 |
|---|---|---|
| `--ktool-duration` | `0.18s` | 标准过渡 |
| 进入 | `0.22s` | 工具切换 / 弹层 fade-up |
| 弹出 | `0.16s` | Popover / Dialog pop |
| `--ktool-ease` | `cubic-bezier(0.22, 1, 0.36, 1)` | 全局缓动 |

规则：

- 禁止 > 0.3s 的慢动画。
- 按钮按下：`transform: scale(0.97)`，使用 `--ktool-duration`。
- 列表项 hover 仅做背景/颜色过渡，禁止位移与缩放（移除现有 `scale(1.06)`）。
- 尊重 `prefers-reduced-motion`：媒体查询下禁用非必要过渡。

---

## 11. Layout System

```
┌──────────────────────────────────────────────┐
│ WindowChrome (36px)  拖拽区 + 系统控制           │
├──────────┬───────────────────────────────────┤
│          │ TitleBar (48px)  工具名 / 主操作     │
│ Sidebar  ├───────────────────────────────────┤
│ (208px)  │ ToolToolbar (48px)  开关 / 动作      │
│          ├───────────────────────────────────┤
│          │ ToolPage (flex-1)  输入/输出/结果    │
│          ├───────────────────────────────────┤
│          │ StatusBar (32px)  状态 / 计数        │
└──────────┴───────────────────────────────────┘
```

- 分区靠背景明度差：`bg`(Sidebar) → `surface`(主区)。
- 全局最小窗口：**宽 880px × 高 560px**（见第 25 节）。
- 主区内容使用 `ToolPage` 容器，默认 `padding: 16px`。

---

## 12. WindowChrome 规范

| 项 | 值 |
|---|---|
| 高度 | 36px |
| 背景 | `--ktool-windowbar` |
| 下边框 | `1px --ktool-border` |
| 品牌图标 | 24px，`appIcon` |
| 品牌名 | `KTool`，14px/600，`--ktool-text` |
| 系统控制按钮 | 46px 宽，hover `--ktool-surface-3` |
| 关闭按钮 hover | 文字 `#fff`，底 `#c42b1c` |

规则：拖拽区 `data-tauri-drag-region`；窗口控制按钮 `border-radius: 0`。

---

## 13. Sidebar 规范

| 项 | 值 |
|---|---|
| 宽度 | **208px**（固定，禁止 232 等旧值） |
| 背景 | `--ktool-bg`（比主区深一档，靠面分隔，去 `border-right`） |
| 搜索框 | 上外距 12，左右 12，控件高 32 |
| 分组标签 | 11px/600，uppercase，letter-spacing 0.04em，`--ktool-text-mute` |
| 列表项高 | 32px，内距 8×12，radius 6 |
| 激活态 | 左侧 3px `--ktool-brand` 指示条 + `--ktool-brand-soft` 底 + `--ktool-brand` 文字 |

规则：

- 图标统一 16px、`--ktool-text-mute`，激活时变 `--ktool-brand`，**禁止 scale 动画**。
- 底部"设置"与列表项同体系，密度一致。
- 搜索框 suffix 显示 `Ctrl K` kbd（11px，`--ktool-surface-2` 底）。

---

## 14. TitleBar / Header 规范

| 项 | 值 |
|---|---|
| 高度 | **48px** |
| 背景 | `--ktool-surface` |
| 下边框 | 去描边，改用与主区 8px 间距/明度差分隔 |
| 工具图标 | 20px，`--ktool-brand` |
| 标题 | **16px/600**，`--ktool-text` |
| 副标题（描述） | 13px，`--ktool-text-mute` |
| 右侧操作按钮 | `.ktool-icon-btn`（30×30，16px 图标） |
| 右侧按钮数量 | ≤ 5（键盘统计 / 历史 / 主题 / 设置 / GitHub）；命令面板并入 Sidebar 搜索 |

规则：标题层级要"说话"——这是页面唯一最高级标题，字重 ≥ 面板内其他标题。

键盘统计属于全局常驻能力，不进入工具注册表、侧栏或命令面板；由历史记录左侧的独立按钮打开覆盖式大面板。该面板必须复用全局浅色/深色 token 与强调色，不得使用写死的深色舞台。

历史记录覆盖所有具有明确“输入 → 输出”的工具，并必须支持点击后恢复输入、模式与主要配置。世界时钟、键盘统计等持续状态功能，以及必须重新选择本地文件的转换功能，不生成不可恢复的伪历史。

---

## 15. ToolToolbar 规范

| 项 | 值 |
|---|---|
| 高度 | **48px**（min-height） |
| 背景 | `--ktool-surface` |
| 内距 | 8×12 |
| 左右分组 | 左侧"开关类"，右侧"动作类"，中间 `flex-1` 分隔 |
| 单行控件上限 | ≤ 6，超出动作收进 `n-dropdown` 或 icon button |

规则：

- 开关组（switch）之间可用 1px 竖线分隔，禁止平铺 9 个控件。
- 主动作（如"格式化"）使用 primary 主按钮，其余为次按钮/幽灵按钮。
- 禁止 `flex-wrap` 兜底式换行。

---

## 16. ToolPage 规范

- 根容器 `ToolPage`，默认 `padding: 16px`，`overflow-y: auto`。
- 内部纵向节奏：区块间距 16 / 24，禁止 10/12 混用。
- 双栏工具（如 JSON）使用 `flex` 横向分栏，默认**非对称**：输出区 56% / 输入区 44%（可拖拽，范围 30%–70%）。
- 禁止在 ToolPage 内再套带边框卡片（卡片套卡片）。

---

## 17. Input / Output / Editor 规范

| 项 | 值 |
|---|---|
| 编辑区圆角 | 8 |
| 编辑区内距 | 12（textarea padding: 10×12） |
| 字号 | 13（代码）/ 14（文本） |
| 行高 | 1.6 |
| 行号槽宽 | 42，右对齐，13px，`--ktool-text-mute` |

规则：

- **输入区**：默认使用 `--ktool-surface` 白色编辑面 + `--ktool-shadow-sm`，输入前、输入中、输入后不改变大面积底色；聚焦仅使用品牌色 focus ring。
- **输出区（结果）**：同样使用 `--ktool-surface` + `--ktool-shadow-sm`，通过“只读”标签、局部操作和 56% 默认宽度建立主次。
- `--ktool-surface-inset` 仅用于确实需要弱化的辅助编辑区，不得作为主输入区默认背景。
- pane-head：去底部边框，padding 8×12，标题 13px/600，操作统一 icon-only 16px。
- 分隔条热区 12px，grip 默认隐藏、hover 显示。

---

## 18. Button 规范

统一三类，全应用一致：

| 类型 | 外观 | 高度(small) | 高度(default) | 圆角 | 文字色 |
|---|---|---|---|---|---|
| Primary | `--ktool-brand` 填充 | 28 | 32 | 6 | `--ktool-brand-contrast` |
| Secondary | `--ktool-surface-2` 底，无边框 | 28 | 32 | 6 | `--ktool-text` |
| Ghost | 透明，text-only | 28 | 32 | 6 | `--ktool-text-soft` |

规则：

- 禁止 NaiveUI 默认描边按钮与自绘按钮并存；所有按钮高度对齐。
- hover：Primary→`brand-hover`；Secondary→`surface-3`；Ghost→`surface-2`。
- 按下：`scale(0.97)`。
- 禁用态：透明度 0.5，禁止交互。

---

## 19. 表单组件规范（深度覆盖 Naive UI）

所有表单组件通过 `src/lib/theme.ts` 覆盖，做到"看不出是 Naive UI"。

| 组件 | 规范 |
|---|---|
| Input | 高 32(small)/36(default)，radius 6，底 `surface`，focus `brand-soft` ring 2px，边框 focus 变 `brand` |
| Select | 同 Input；下拉面板 `surface` + `shadow-md`，选项 hover `surface-2` |
| Switch | 扁窄（宽 36–40），rail `surface-3`，开态 `brand`；checked/unchecked 文案必须不同 |
| Tabs | 激活文字 `brand`，bar `brand`，去默认粗边框 |
| Tag | radius 4，语义色用 token |

禁止：保留 NaiveUI 默认 rail、默认下拉描边、默认 button 边框。

---

## 20. Drawer / Dialog / Popover 规范

| 组件 | 容器圆角 | 背景 | 阴影 | 内距 |
|---|---|---|---|---|
| Drawer（历史） | 12（仅一侧） | `--ktool-surface` | `--ktool-shadow-lg` | 16 |
| Dialog / Modal | 12 | `--ktool-surface` | `--ktool-shadow-lg` | 24 |
| Popover | 8 | `--ktool-surface` | `--ktool-shadow-md` | 12 |

规则：遮罩 `rgba(0,0,0,0.45)`；弹入动画 0.16s pop；关闭按钮 30×30 icon-btn。

---

## 21. 状态规范（Empty / Loading / Error / Success）

- **Empty**：居中图标(20px, mute) + 13px 引导文案 + 可选示例快捷键；禁止苍白 placeholder。
- **Loading**：骨架屏或 spinner（16px，`brand`），禁止全屏遮罩打断。
- **Error**：状态点 `danger` + 13px 错误文案；输入框边框变 `danger`，focus ring `danger-soft`。
- **Success**：状态点 `success` + 13px 文案；短暂 toast（message.success，2s 自动消失）。

---

## 22. Light Mode

- 以第 4 节 Light 列为准。
- 背景层次：`bg #f6f7f9` → `surface #fff` → `surface-2 #f1f2f5` → `inset #f3f4f6`。
- 边框 `#e4e6ea`，文本 `#1f232b / #5b626e / #9298a3`。
- 阴影轻柔（见 4.4）。

---

## 23. Dark Mode

- 以第 4 节 Dark 列为准，非纯黑（最底 `#0e1014`）。
- 背景层次：`bg #0e1014` → `surface #16181d` → `surface-2 #1b1e24` → `inset #121419`。
- 边框 `#262a32`，文本 `#e7e9ed / #a7aeb9 / #6b7280`。
- 品牌色提亮为 `#6366f1`；阴影偏深（见 4.4）。
- 输入框聚焦时**略提亮**（surface-2），禁止聚焦变白。

---

## 24. Accessibility

- 文本对比度：正文 ≥ 4.5:1（WCAG AA）；大文本 ≥ 3:1。
- 键盘可达：所有可点元素 `:focus-visible` 显示 2px `brand` 描边。
- 目标尺寸：可点控件 ≥ 28×28（icon-btn ≥ 30×30）。
- 动效：支持 `prefers-reduced-motion: reduce` 时关闭非必要过渡。
- 语义：按钮用 `<button>`，图标按钮带 `aria-label` / `title`。

---

## 25. 响应式与最小窗口

| 项 | 值 |
|---|---|
| 最小窗口 | **880 × 560** |
| 推荐窗口 | 1200 × 800 |
| Sidebar | 固定 208px，最小窗口下不收起（空间不足时允许横向滚动主区） |
| 主区 | flex-1，最小宽 0（禁止内容溢出撑破布局） |
| 断点 | 不依赖移动端断点；仅保证 ≥ 880px 下所有功能区可见 |

规则：禁止为桌面工具引入移动端汉堡菜单；窗口小于最小值时由 Tauri 限制缩放。

---

## 26. 新增工具页面标准模板

新增工具须复用既有容器组件（`ToolPage` / `ToolToolbar` / `EditorPane` / `StatusBar`），结构如下：

```
ToolPage
├─ ToolToolbar (bordered=false)
│   ├─ 左侧：开关类（switch 组，竖线分隔）
│   └─ 右侧 #side：主按钮(primary) + 次按钮/icon-btn
├─ 工作区（双栏或非对称，输入 inset / 输出 surface+shadow）
└─ StatusBar (tone + 计数)
```

注册：`src/tools/registry.ts` 一行 `register(xxx)`；`index.ts` 的 `ToolModule` **不得用 accent 给侧栏/标题栏着色**；图标来自 `@vicons/ionicons5`。

---

## 27. 禁止事项（Hard Rules）

- 禁止后台管理系统风格（搜索+分组+设置三件套不做差异化改造前不得提交）。
- 禁止 Glassmorphism / Neon / 赛博朋克 / AI 科技风。
- 禁止大面积渐变、大圆角（>12）、夸张阴影（自定义大 blur）。
- **禁止彩虹色工具图标**（侧栏/标题栏图标必须中性或品牌色）。
- 禁止卡片套卡片（嵌套带边框卡片）。
- 禁止间距使用 4/8/12/16/24/32 以外的值。
- 禁止字号使用 11/13/14/16/20 以外的值（特殊场景需 PR 说明）。
- 禁止圆角使用 4/6/8/12 以外的值。
- 禁止 NaiveUI 默认组件未覆盖直接暴露（rail/switch/select 下拉/button 边框）。
- 禁止 Toolbar 单行 > 6 控件且用 `flex-wrap` 兜底。
- 禁止双栏强制 50/50 无主次。

---

## 28. Pull Request UI Checklist

提交涉及 UI 的 PR 前，逐项确认：

- [ ] 间距仅使用了 4/8/12/16/24/32
- [ ] 字号仅使用了 11/13/14/16/20
- [ ] 圆角仅使用了 4/6/8/12
- [ ] 未引入新的彩色（仅品牌色 + 中性灰 + 语义 success/warning/danger）
- [ ] 侧栏/标题栏图标为中性或品牌色（无彩虹）
- [ ] 按钮统一为 Primary / Secondary / Ghost 三类，高度一致
- [ ] Naive UI 组件已通过 `theme.ts` 覆盖，无默认外观外露
- [ ] 区域分隔靠明度差而非 1px 线堆叠
- [ ] 无卡片套卡片
- [ ] Light / Dark 双主题下变量均来自 token，无写死颜色
- [ ] 控件尺寸 ≥ 28px，键盘 `:focus-visible` 可见
- [ ] 最小窗口 880×560 下未出现溢出/功能不可见
- [ ] 动效时长 ≤ 0.22s，且响应 `prefers-reduced-motion`
- [ ] 未破坏任何现有功能与布局逻辑

---

## 29. AI Coding Agent 执行规则

AI Agent 在执行任何 KTool UI 任务时，**必须**：

1. **先读本文件**：动手前完整加载 `DESIGN.md`，以本文件为唯一规范，不凭"组件库默认外观"判断。
2. **读取现有 token**：变更样式前先读 `src/styles/main.css` 与 `src/lib/theme.ts`，复用既有 CSS 变量，禁止硬编码颜色/间距（除非新增语义色并同步补 token）。
3. **数值锁定**：任何 padding/margin/gap 只能取 `4/8/12/16/24/32`；字号只能 `11/13/14/16/20`；圆角只能 `4/6/8/12`。需要例外时，先在本文件提 PR 扩充，不要在代码中私自引入。
4. **图标中性化**：新增/修改工具图标时，禁止设置彩色 accent 用于框架着色；统一 `16px`、中性或品牌色。
5. **复用容器组件**：优先复用 `ToolPage / ToolToolbar / EditorPane / StatusBar / Sidebar`，不要新建平行布局结构。
6. **不破坏逻辑**：只做视觉层修改，不得更改 Pinia store、路由、工具注册、事件绑定等行为。
7. **双主题同步**：改一个主题的视觉，必须同步检查 Light 与 Dark 两组的 token 取值。
8. **去 NaiveUI 感**：若用了 `n-button/n-input/n-select/n-switch/n-tabs`，确认已在 `theme.ts` 覆盖；不要留下库默认外观。
9. **提交前自查**：按第 28 节 Checklist 逐条核对，并在回复中说明符合的条目。
10. **不确定就问**：当需求与本文冲突时，停下来指出冲突，不要擅自"我觉得好看"地偏离规范。

---

## 30. 版本维护方式

- **单一来源**：本 `DESIGN.md` 是唯一权威；代码中的 token（`main.css` / `theme.ts`）必须与之同步。
- **变更流程**：任何规范调整须通过 PR 修改本文件 + 同步更新 token，并在 PR 描述注明"Design Spec Update"。
- **版本号**：随仓库 SemVer 演进；破坏性视觉变更（如重命名 token、改间距阶梯）需在 PR 中标注 `BREAKING: design`。
- **截图存档**：重大改版在 `.design-qa/` 留存 before/after 对比图与 QA 结论（参考既有 `design-qa.md` 流程）。
- **定期审查**：每里程碑评审一次规范与实现的偏离度，回收"私下引入的例外值"。

---

*KTool Design System · 服务于开发者，服务于长时间专注。*
