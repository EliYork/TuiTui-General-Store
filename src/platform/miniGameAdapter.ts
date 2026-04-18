import { Point, Size } from "../utils/math";

export interface FrameDriver {
  schedule(callback: (timeMs: number) => void): number;
  cancel(id: number): void;
  now(): number;
}

export interface MiniGameAdapter {
  canvas: WechatMinigame.Canvas;
  context: CanvasRenderingContext2D;
  screen: Size;
  frameDriver: FrameDriver;
  onTouchStart(handler: (point: Point) => void): void;
}

export function createMiniGameAdapter(): MiniGameAdapter {
  const systemInfo = wx.getSystemInfoSync();
  const pixelRatio = Math.max(systemInfo.pixelRatio || 1, 1);
  const screen = {
    width: systemInfo.windowWidth,
    height: systemInfo.windowHeight
  };

  const canvas = wx.createCanvas();
  canvas.width = screen.width * pixelRatio;
  canvas.height = screen.height * pixelRatio;

  const context = canvas.getContext("2d");
  context.scale(pixelRatio, pixelRatio);

  if (typeof wx.setPreferredFramesPerSecond === "function") {
    wx.setPreferredFramesPerSecond(60);
  }

  return {
    canvas,
    context,
    screen,
    frameDriver: {
      schedule(callback: (timeMs: number) => void): number {
        if (typeof canvas.requestAnimationFrame === "function") {
          return canvas.requestAnimationFrame(callback);
        }

        return setTimeout(() => callback(Date.now()), 16) as unknown as number;
      },
      cancel(id: number): void {
        if (typeof canvas.cancelAnimationFrame === "function") {
          canvas.cancelAnimationFrame(id);
          return;
        }

        clearTimeout(id);
      },
      now(): number {
        return Date.now();
      }
    },
    onTouchStart(handler: (point: Point) => void): void {
      wx.onTouchStart((event) => {
        const touch = event.touches[0] ?? event.changedTouches[0];
        if (!touch) {
          return;
        }

        handler({
          x: touch.clientX,
          y: touch.clientY
        });
      });
    }
  };
}
