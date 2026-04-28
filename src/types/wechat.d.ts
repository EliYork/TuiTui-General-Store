declare namespace WechatMinigame {
  interface SystemInfo {
    windowWidth: number;
    windowHeight: number;
    pixelRatio: number;
  }

  interface Touch {
    clientX: number;
    clientY: number;
  }

  interface TouchEvent {
    touches: Touch[];
    changedTouches: Touch[];
  }

  interface Canvas {
    width: number;
    height: number;
    getContext(type: "2d"): CanvasRenderingContext2D;
    requestAnimationFrame?(callback: (timeMs: number) => void): number;
    cancelAnimationFrame?(id: number): void;
  }

  interface WX {
    createCanvas(): Canvas;
    getSystemInfoSync(): SystemInfo;
    onTouchStart(listener: (event: TouchEvent) => void): void;
    setPreferredFramesPerSecond?(fps: number): void;
  }
}

declare const wx: WechatMinigame.WX;
