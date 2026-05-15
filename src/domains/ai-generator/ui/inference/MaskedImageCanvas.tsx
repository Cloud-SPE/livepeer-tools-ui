import type { JSX } from "react";
import { useEffect, useRef } from "react";
import type { SegmentationMask } from "../../types";

interface Props {
  maskData: SegmentationMask;
  imageFile: File;
  /** Max display width in CSS pixels. */
  maxDisplayWidth?: number;
}

/**
 * Renders the source image with a translucent red tint applied wherever
 * the mask is set (value > 0.5). The canvas is sized to the original
 * image; CSS scales it for display.
 */
export function MaskedImageCanvas({
  maskData,
  imageFile,
  maxDisplayWidth = 500,
}: Props): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result !== "string") return;
      const img = new Image();
      img.onload = () => {
        const { width, height } = img;
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const maskHeight = maskData.length;
        if (maskHeight === 0) return;
        const maskWidth = maskData[0]?.length ?? 0;
        const yMax = Math.min(height, maskHeight);
        const xMax = Math.min(width, maskWidth);
        const redTint = 255;
        const alpha = 0.4;
        const oneMinusAlpha = 1 - alpha;
        for (let y = 0; y < yMax; y++) {
          const row = maskData[y];
          if (!row) continue;
          for (let x = 0; x < xMax; x++) {
            const value = row[x] ?? 0;
            if (value > 0.5) {
              const pixelIndex = (y * width + x) * 4;
              const r = data[pixelIndex] ?? 0;
              const g = data[pixelIndex + 1] ?? 0;
              const b = data[pixelIndex + 2] ?? 0;
              data[pixelIndex] = r * oneMinusAlpha + redTint * alpha;
              data[pixelIndex + 1] = g * oneMinusAlpha;
              data[pixelIndex + 2] = b * oneMinusAlpha;
              data[pixelIndex + 3] = 255;
            }
          }
        }
        ctx.putImageData(imageData, 0, 0);
      };
      img.src = result;
    };

    reader.readAsDataURL(imageFile);
  }, [maskData, imageFile]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        margin: "10px 0",
        maxWidth: `${maxDisplayWidth}px`,
        width: "100%",
        height: "auto",
      }}
    />
  );
}
