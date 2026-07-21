export interface KeyDef {
  code: string; // 与后端 vk token 一致的稳定标识
  label: string;
  w?: number; // 相对宽度（flex）
  hot?: boolean; // 修饰键高亮色
  accent?: boolean; // 主题色
}

/**
 * 把后端发来的组合键字符串归一化为“最终按键 token”。
 * 后端保证 token 与布局 code 一致，这里只做少量兼容与统一小写。
 */
export function normalizeCombo(combo: string): string {
  const parts = combo.split("+");
  let key = parts[parts.length - 1];
  if (!key) key = parts[0] ?? ""; // 兼容纯修饰键（旧数据）
  if (key === " ") return "space";
  if (key === "\n") return "enter";
  if (key === "\t") return "tab";
  if (key === "") return "backspace";
  if (key.length === 1) return key.toLowerCase();
  return key.toLowerCase();
}

// 紧凑布局（无小键盘，60% 配列）
export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { code: "`", label: "~" },
    { code: "1", label: "1" },
    { code: "2", label: "2" },
    { code: "3", label: "3" },
    { code: "4", label: "4" },
    { code: "5", label: "5" },
    { code: "6", label: "6" },
    { code: "7", label: "7" },
    { code: "8", label: "8" },
    { code: "9", label: "9" },
    { code: "0", label: "0" },
    { code: "-", label: "-" },
    { code: "=", label: "=" },
    { code: "backspace", label: "⌫", w: 2, hot: true },
  ],
  [
    { code: "tab", label: "Tab", w: 1.5, hot: true },
    { code: "q", label: "Q" },
    { code: "w", label: "W" },
    { code: "e", label: "E" },
    { code: "r", label: "R" },
    { code: "t", label: "T" },
    { code: "y", label: "Y" },
    { code: "u", label: "U" },
    { code: "i", label: "I" },
    { code: "o", label: "O" },
    { code: "p", label: "P" },
    { code: "[", label: "[" },
    { code: "]", label: "]" },
    { code: "\\", label: "\\", w: 1.5 },
  ],
  [
    { code: "capslock", label: "Caps", w: 1.75, hot: true },
    { code: "a", label: "A" },
    { code: "s", label: "S" },
    { code: "d", label: "D" },
    { code: "f", label: "F" },
    { code: "g", label: "G" },
    { code: "h", label: "H" },
    { code: "j", label: "J" },
    { code: "k", label: "K" },
    { code: "l", label: "L" },
    { code: ";", label: ";" },
    { code: "'", label: "'" },
    { code: "enter", label: "⏎", w: 2.25, accent: true },
  ],
  [
    { code: "shift", label: "Shift", w: 2.25, hot: true },
    { code: "z", label: "Z" },
    { code: "x", label: "X" },
    { code: "c", label: "C" },
    { code: "v", label: "V" },
    { code: "b", label: "B" },
    { code: "n", label: "N" },
    { code: "m", label: "M" },
    { code: ",", label: "," },
    { code: ".", label: "." },
    { code: "/", label: "/" },
    { code: "shift", label: "Shift", w: 2.25, hot: true },
  ],
  [
    { code: "ctrl", label: "Ctrl", w: 1.25, hot: true },
    { code: "win", label: "⊞", w: 1.25, hot: true },
    { code: "alt", label: "Alt", w: 1.25, hot: true },
    { code: "space", label: "", w: 6.25 },
    { code: "alt", label: "Alt", w: 1.25, hot: true },
    { code: "ctrl", label: "Ctrl", w: 1.25, hot: true },
  ],
];

export const COMPACT_LAYOUT: KeyDef[][] = KEYBOARD_ROWS;

// 带小键盘布局：主键盘区 + 导航/方向键 + 数字小键盘
const NUMPAD_BLOCK: KeyDef[][] = [
  [
    { code: "insert", label: "Ins" },
    { code: "home", label: "Home" },
    { code: "pageup", label: "PgUp" },
  ],
  [
    { code: "delete", label: "Del" },
    { code: "end", label: "End" },
    { code: "pagedown", label: "PgDn" },
  ],
  [{ code: "arrowup", label: "↑" }],
  [
    { code: "arrowleft", label: "←" },
    { code: "arrowdown", label: "↓" },
    { code: "arrowright", label: "→" },
  ],
  [
    { code: "numlock", label: "Num" },
    { code: "numpaddiv", label: "/" },
    { code: "numpadmul", label: "*" },
    { code: "numpadsub", label: "-" },
  ],
  [
    { code: "numpad7", label: "7" },
    { code: "numpad8", label: "8" },
    { code: "numpad9", label: "9" },
    { code: "numpadadd", label: "+" },
  ],
  [
    { code: "numpad4", label: "4" },
    { code: "numpad5", label: "5" },
    { code: "numpad6", label: "6" },
  ],
  [
    { code: "numpad1", label: "1" },
    { code: "numpad2", label: "2" },
    { code: "numpad3", label: "3" },
    { code: "numpadenter", label: "⏎" },
  ],
  [
    { code: "numpad0", label: "0", w: 2 },
    { code: "numpaddot", label: "." },
  ],
];

export const FULL_LAYOUT_BLOCKS: KeyDef[][][] = [KEYBOARD_ROWS, NUMPAD_BLOCK];
