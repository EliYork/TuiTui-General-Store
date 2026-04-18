"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMiniGameAdapter = createMiniGameAdapter;
function createMiniGameAdapter() {
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
            schedule(callback) {
                if (typeof canvas.requestAnimationFrame === "function") {
                    return canvas.requestAnimationFrame(callback);
                }
                return setTimeout(() => callback(Date.now()), 16);
            },
            cancel(id) {
                if (typeof canvas.cancelAnimationFrame === "function") {
                    canvas.cancelAnimationFrame(id);
                    return;
                }
                clearTimeout(id);
            },
            now() {
                return Date.now();
            }
        },
        onTouchStart(handler) {
            wx.onTouchStart((event) => {
                var _a;
                const touch = (_a = event.touches[0]) !== null && _a !== void 0 ? _a : event.changedTouches[0];
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
