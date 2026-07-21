declare module "jsqr" {
  export interface QRPoint {
    x: number;
    y: number;
  }
  export interface QRCode {
    binaryData: number[];
    data: string;
    chunks: unknown;
    location: {
      topLeftCorner: QRPoint;
      topRightCorner: QRPoint;
      bottomLeftCorner: QRPoint;
      bottomRightCorner: QRPoint;
      topLeftFinderPattern: QRPoint;
      topRightFinderPattern: QRPoint;
      bottomLeftFinderPattern: QRPoint;
    };
  }
  export default function jsQR(
    data: Uint8ClampedArray,
    width: number,
    height: number,
    options?: { inversionAttempts?: "attemptBoth" | "dontInvert" | "onlyInvert" | "invertFirst" }
  ): QRCode | null;
}
