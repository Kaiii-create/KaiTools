import QRCode from "qrcode";

/** 码点样式 */
export type DotStyle = "square" | "dot" | "diamond" | "rounded";
/** 码眼样式 */
export type EyeStyle = "square" | "circle" | "leaf";
/** 纠错级别 */
export type ErrorLevel = "L" | "M" | "Q" | "H";

export interface QrOptions {
  text: string;
  size: number; // 输出像素（不含底部文字区）
  errorLevel: ErrorLevel;
  dotStyle: DotStyle;
  eyeStyle: EyeStyle;
  fgColor: string;
  bgColor: string; // "#rrggbb" 或 "transparent"
  gradient: boolean;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number; // 0-360
  logo: HTMLImageElement | null;
  logoSize: number; // 0.1-0.3，相对二维码的比例
  margin: number; // 模块数
  bottomText: string;
  textSize: number; // px
  textColor: string;
}

/** 判断是否在三个码眼区域，返回 'tl' | 'tr' | 'bl' | null */
function eyePosition(row: number, col: number, size: number): string | null {
  if (row < 7 && col < 7) return "tl";
  if (row < 7 && col >= size - 7) return "tr";
  if (row >= size - 7 && col < 7) return "bl";
  return null;
}

/** 绘制单个码点 */
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  style: DotStyle
) {
  switch (style) {
    case "square":
      ctx.fillRect(x, y, size, size);
      break;
    case "dot": {
      const r = size / 2;
      ctx.beginPath();
      ctx.arc(x + r, y + r, r * 0.92, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "diamond": {
      const r = size / 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.lineTo(x + size, y + r);
      ctx.lineTo(x + r, y + size);
      ctx.lineTo(x, y + r);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "rounded": {
      const r = size * 0.25;
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(x, y, size, size, r);
      } else {
        ctx.rect(x, y, size, size);
      }
      ctx.fill();
      break;
    }
  }
}

/** 绘制码眼（定位图案）
 * 以 7x7 区域左上角 (ox, oy) 为原点，模块像素 ppm
 */
function drawEye(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  ppm: number,
  style: EyeStyle,
  fillStyle: string | CanvasGradient
) {
  ctx.save();
  ctx.fillStyle = fillStyle;
  const total = 7 * ppm;
  const inner = 3 * ppm;
  const innerOffset = 2 * ppm;

  if (style === "square") {
    // 外框：7x7 实心，再挖空中间 5x5
    ctx.fillRect(ox, oy, total, total);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillRect(ox + ppm, oy + ppm, 5 * ppm, 5 * ppm);
    ctx.globalCompositeOperation = "source-over";
    ctx.fillRect(ox + innerOffset, oy + innerOffset, inner, inner);
  } else if (style === "circle") {
    // 外圈圆环
    const cx = ox + total / 2;
    const cy = oy + total / 2;
    const rOut = total / 2;
    const rIn = rOut - ppm;
    ctx.beginPath();
    ctx.arc(cx, cy, rOut, 0, Math.PI * 2);
    ctx.arc(cx, cy, rIn, 0, Math.PI * 2, true);
    ctx.fill("evenodd");
    // 内圆
    ctx.beginPath();
    ctx.arc(cx, cy, inner / 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (style === "leaf") {
    // 叶子（圆角矩形外框 + 圆角矩形内框）
    const r = ppm * 1.8;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(ox, oy, total, total, r);
    } else {
      ctx.rect(ox, oy, total, total);
    }
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(ox + ppm, oy + ppm, 5 * ppm, 5 * ppm, r * 0.7);
    } else {
      ctx.rect(ox + ppm, oy + ppm, 5 * ppm, 5 * ppm);
    }
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(
        ox + innerOffset,
        oy + innerOffset,
        inner,
        inner,
        ppm * 0.8
      );
    } else {
      ctx.rect(ox + innerOffset, oy + innerOffset, inner, inner);
    }
    ctx.fill();
  }
  ctx.restore();
}

/** 根据渐变角度创建线性渐变 */
function createGradient(
  ctx: CanvasRenderingContext2D,
  size: number,
  from: string,
  to: string,
  angle: number
): CanvasGradient {
  const rad = (angle * Math.PI) / 180;
  // 计算渐变起止点（以中心为原点）
  const r = size / 2;
  const dx = Math.cos(rad) * r;
  const dy = Math.sin(rad) * r;
  const grad = ctx.createLinearGradient(
    r - dx,
    r - dy,
    r + dx,
    r + dy
  );
  grad.addColorStop(0, from);
  grad.addColorStop(1, to);
  return grad;
}

/** 主绘制函数 */
export function drawQrcode(canvas: HTMLCanvasElement, opts: QrOptions): void {
  if (!opts.text) {
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  // 生成 QR 矩阵
  const qr = QRCode.create(opts.text, {
    errorCorrectionLevel: opts.errorLevel,
  });
  const moduleCount = qr.modules.size;
  const matrix = qr.modules;

  const margin = opts.margin;
  const totalModules = moduleCount + margin * 2;

  // 文字区高度
  const textAreaHeight = opts.bottomText ? opts.size * 0.12 + opts.textSize : 0;

  // 输出像素
  const qrPixelSize = opts.size;
  const ppm = qrPixelSize / totalModules; // 每模块像素

  // 设置 canvas 尺寸
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = opts.size;
  const cssHeight = opts.size + textAreaHeight;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  // 背景
  if (opts.bgColor === "transparent") {
    // 不画背景
  } else {
    ctx.fillStyle = opts.bgColor;
    ctx.fillRect(0, 0, cssWidth, cssHeight);
  }

  // 前景色 / 渐变
  const fillStyle = opts.gradient
    ? createGradient(
        ctx,
        qrPixelSize,
        opts.gradientFrom,
        opts.gradientTo,
        opts.gradientAngle
      )
    : opts.fgColor;

  ctx.fillStyle = fillStyle;

  // 绘制码点（跳过码眼区域）
  const offset = margin * ppm;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!matrix.get(row, col)) continue;
      if (eyePosition(row, col, moduleCount)) continue; // 码眼单独画
      const x = offset + col * ppm;
      const y = offset + row * ppm;
      drawDot(ctx, x, y, ppm, opts.dotStyle);
    }
  }

  // 绘制三个码眼
  const eyePositions = [
    { row: 0, col: 0 }, // 左上
    { row: 0, col: moduleCount - 7 }, // 右上
    { row: moduleCount - 7, col: 0 }, // 左下
  ];
  for (const p of eyePositions) {
    drawEye(
      ctx,
      offset + p.col * ppm,
      offset + p.row * ppm,
      ppm,
      opts.eyeStyle,
      fillStyle
    );
  }

  // 绘制 Logo
  if (opts.logo) {
    const logoPx = opts.size * opts.logoSize;
    const lx = (opts.size - logoPx) / 2;
    const ly = (opts.size - logoPx) / 2;
    // 白色底
    ctx.save();
    ctx.fillStyle = "#ffffff";
    const pad = logoPx * 0.08;
    ctx.fillRect(lx - pad, ly - pad, logoPx + pad * 2, logoPx + pad * 2);
    ctx.drawImage(opts.logo, lx, ly, logoPx, logoPx);
    ctx.restore();
  }

  // 绘制底部文字
  if (opts.bottomText) {
    ctx.save();
    ctx.fillStyle = opts.textColor;
    ctx.font = `${opts.textSize}px sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      opts.bottomText,
      cssWidth / 2,
      opts.size + textAreaHeight / 2
    );
    ctx.restore();
  }
}
