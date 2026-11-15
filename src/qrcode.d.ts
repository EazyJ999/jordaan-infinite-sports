declare module "qrcode" {
  interface QRCodeStatic {
    toDataURL(
      text: string,
      options?: {
        margin?: number;
        width?: number;
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
        color?: { dark?: string; light?: string };
      },
    ): Promise<string>;
    toCanvas(
      canvas: HTMLCanvasElement,
      text: string,
      options?: {
        margin?: number;
        width?: number;
        errorCorrectionLevel?: "L" | "M" | "Q" | "H";
        color?: { dark?: string; light?: string };
      },
    ): Promise<void>;
  }
  const QRCode: QRCodeStatic;
  export default QRCode;
}
