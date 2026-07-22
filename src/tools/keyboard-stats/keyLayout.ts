export interface KeyDef {
  code: string;
  label: string;
  w?: number;
  h?: number;
  x?: number;
  y?: number;
  spacer?: boolean;
}

const gap = (w = 0.65): KeyDef => ({ code: `gap-${w}`, label: "", w, spacer: true });

/** 标准 ANSI 主键区，包含功能键行。 */
export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    { code: "escape", label: "Esc" }, gap(),
    { code: "f1", label: "F1" }, { code: "f2", label: "F2" }, { code: "f3", label: "F3" }, { code: "f4", label: "F4" }, gap(),
    { code: "f5", label: "F5" }, { code: "f6", label: "F6" }, { code: "f7", label: "F7" }, { code: "f8", label: "F8" }, gap(),
    { code: "f9", label: "F9" }, { code: "f10", label: "F10" }, { code: "f11", label: "F11" }, { code: "f12", label: "F12" },
  ],
  [gap(1)],
  [
    { code: "`", label: "`" },
    { code: "1", label: "1" }, { code: "2", label: "2" }, { code: "3", label: "3" },
    { code: "4", label: "4" }, { code: "5", label: "5" }, { code: "6", label: "6" },
    { code: "7", label: "7" }, { code: "8", label: "8" }, { code: "9", label: "9" },
    { code: "0", label: "0" }, { code: "-", label: "-" }, { code: "=", label: "=" },
    { code: "backspace", label: "Backspace", w: 2 },
  ],
  [
    { code: "tab", label: "Tab", w: 1.5 },
    { code: "q", label: "Q" }, { code: "w", label: "W" }, { code: "e", label: "E" },
    { code: "r", label: "R" }, { code: "t", label: "T" }, { code: "y", label: "Y" },
    { code: "u", label: "U" }, { code: "i", label: "I" }, { code: "o", label: "O" },
    { code: "p", label: "P" }, { code: "[", label: "[" }, { code: "]", label: "]" },
    { code: "\\", label: "\\", w: 1.5 },
  ],
  [
    { code: "capslock", label: "Caps Lock", w: 1.75 },
    { code: "a", label: "A" }, { code: "s", label: "S" }, { code: "d", label: "D" },
    { code: "f", label: "F" }, { code: "g", label: "G" }, { code: "h", label: "H" },
    { code: "j", label: "J" }, { code: "k", label: "K" }, { code: "l", label: "L" },
    { code: ";", label: ";" }, { code: "'", label: "'" },
    { code: "enter", label: "Enter", w: 2.25 },
  ],
  [
    { code: "shift", label: "Shift", w: 2.25 },
    { code: "z", label: "Z" }, { code: "x", label: "X" }, { code: "c", label: "C" },
    { code: "v", label: "V" }, { code: "b", label: "B" }, { code: "n", label: "N" },
    { code: "m", label: "M" }, { code: ",", label: "," }, { code: ".", label: "." },
    { code: "/", label: "/" }, { code: "shift", label: "Shift", w: 2.75 },
  ],
  [
    { code: "ctrl", label: "Ctrl", w: 1.25 }, { code: "win", label: "Win", w: 1.25 },
    { code: "alt", label: "Alt", w: 1.25 }, { code: "space", label: "", w: 6.25 },
    { code: "alt", label: "Alt", w: 1.25 }, { code: "menu", label: "Menu", w: 1.25 },
    { code: "ctrl", label: "Ctrl", w: 1.25 },
  ],
];

/** 标准编辑/方向键区，与主键区的功能行和字母区对齐。 */
export const NAVIGATION_ROWS: KeyDef[][] = [
  [
    { code: "printscreen", label: "PrtSc" },
    { code: "scrolllock", label: "Scroll" },
    { code: "pause", label: "Pause" },
  ],
  [gap(1)],
  [
    { code: "insert", label: "Insert" },
    { code: "home", label: "Home" },
    { code: "pageup", label: "PgUp" },
  ],
  [
    { code: "delete", label: "Delete" },
    { code: "end", label: "End" },
    { code: "pagedown", label: "PgDn" },
  ],
  [gap(1)],
  [gap(1), { code: "arrowup", label: "↑" }, gap(1)],
  [
    { code: "arrowleft", label: "←" },
    { code: "arrowdown", label: "↓" },
    { code: "arrowright", label: "→" },
  ],
];

/** 标准 17 键数字区；+ 与 Enter 为纵向双倍键，0 为横向双倍键。 */
export const NUMPAD_GRID: KeyDef[][] = [[
  { code: "numlock", label: "Num", x: 1, y: 1 },
  { code: "numpaddiv", label: "/", x: 2, y: 1 },
  { code: "numpadmul", label: "*", x: 3, y: 1 },
  { code: "numpadsub", label: "−", x: 4, y: 1 },
  { code: "numpad7", label: "7", x: 1, y: 2 },
  { code: "numpad8", label: "8", x: 2, y: 2 },
  { code: "numpad9", label: "9", x: 3, y: 2 },
  { code: "numpadadd", label: "+", x: 4, y: 2, h: 2 },
  { code: "numpad4", label: "4", x: 1, y: 3 },
  { code: "numpad5", label: "5", x: 2, y: 3 },
  { code: "numpad6", label: "6", x: 3, y: 3 },
  { code: "numpad1", label: "1", x: 1, y: 4 },
  { code: "numpad2", label: "2", x: 2, y: 4 },
  { code: "numpad3", label: "3", x: 3, y: 4 },
  { code: "numpadenter", label: "Enter", x: 4, y: 4, h: 2 },
  { code: "numpad0", label: "0", x: 1, y: 5, w: 2 },
  { code: "numpaddot", label: ".", x: 3, y: 5 },
]];

export const TKL_LAYOUT_BLOCKS: KeyDef[][][] = [KEYBOARD_ROWS, NAVIGATION_ROWS];
export const FULL_LAYOUT_BLOCKS: KeyDef[][][] = [KEYBOARD_ROWS, NAVIGATION_ROWS, NUMPAD_GRID];
