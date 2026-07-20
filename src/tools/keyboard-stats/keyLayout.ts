// 键盘可视化布局与按键归一化工具
// code: 归一化后的按键标识（与 Rust 端 emit 的 combo 尾键一致，小写字母/符号）
// label: 显示文本
// w: 键宽（相对单位，1 = 一个标准键宽）

export interface KeyDef {
  code: string;
  label: string;
  w?: number;
  flex?: boolean; // 占满剩余空间（用于空格行等）
}

// 将 Rust combo（如 "Ctrl+a"、"a"、" "、"\n"）归一化成布局用 code
export function normalizeCombo(combo: string): string {
  const parts = combo.split("+");
  let key = parts[parts.length - 1];
  if (key === " ") return "space";
  if (key === "\n") return "enter";
  if (key === "\t") return "tab";
  if (key === "\u0008") return "backspace";
  if (key.length === 1) return key.toLowerCase();
  const map: Record<string, string> = {
    Ctrl: "ctrl",
    Alt: "alt",
    Shift: "shift",
    Win: "win",
    Space: "space",
    Enter: "enter",
    Tab: "tab",
    Backspace: "backspace",
  };
  return map[key] ?? key.toLowerCase();
}

// 一个 60% 紧凑键盘布局（够用且好看）
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
    { code: "backspace", label: "⌫", w: 2 },
  ],
  [
    { code: "tab", label: "Tab", w: 1.5 },
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
    { code: "capslock", label: "Caps", w: 1.75 },
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
    { code: "enter", label: "⏎ Enter", w: 2.25 },
  ],
  [
    { code: "shift", label: "⇧ Shift", w: 2.25 },
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
    { code: "shift", label: "⇧ Shift", w: 2.75 },
  ],
  [
    { code: "ctrl", label: "Ctrl", w: 1.5 },
    { code: "win", label: "Win", w: 1.25 },
    { code: "alt", label: "Alt", w: 1.25 },
    { code: "space", label: "", flex: true },
    { code: "alt", label: "Alt", w: 1.25 },
    { code: "ctrl", label: "Ctrl", w: 1.5 },
  ],
];
