"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PusherRenderer = void 0;
class PusherRenderer {
    render(context, pusher, config, projector) {
        void projector;
        const openingY = config.machine.pusherOpeningY;
        const safeInset = 4;
        const boardLeft = config.machine.playfieldLeft + safeInset;
        const boardRight = config.machine.playfieldRight - safeInset;
        const boardWidth = boardRight - boardLeft;
        const boardTop = pusher.getVisualBackEdgeY();
        const boardBottom = pusher.getFrontEdgeY();
        const boardHeight = boardBottom - boardTop;
        const visibleTop = Math.max(openingY, boardTop);
        const visibleHeight = Math.max(0, boardBottom - visibleTop);
        const highlightWidth = Math.max(10, boardWidth - 16);
        const faceShadowWidth = Math.max(10, boardWidth - 16);
        const grainShadowWidth = Math.max(8, boardWidth - 4);
        context.save();
        context.beginPath();
        context.rect(boardLeft, openingY, boardWidth, config.screen.height - openingY);
        context.clip();
        if (visibleHeight > 0) {
            context.fillStyle = "rgba(15, 23, 42, 0.18)";
            context.fillRect(boardLeft + 8, visibleTop + 8, faceShadowWidth, Math.max(8, visibleHeight - 6));
        }
        const boardGradient = context.createLinearGradient(0, boardTop, 0, boardBottom);
        boardGradient.addColorStop(0, "#bf6a2c");
        boardGradient.addColorStop(0.28, "#f3a54e");
        boardGradient.addColorStop(0.72, "#ee9741");
        boardGradient.addColorStop(1, "#b85a1a");
        context.fillStyle = boardGradient;
        context.fillRect(boardLeft, boardTop, boardWidth, boardHeight);
        context.fillStyle = "rgba(255, 255, 255, 0.16)";
        context.fillRect(boardLeft + 8, visibleTop + 3, highlightWidth, 4);
        context.fillStyle = "#8c4a1f";
        context.fillRect(boardLeft, boardBottom - Math.max(6, pusher.thickness * 0.72), boardWidth, Math.max(6, pusher.thickness * 0.72));
        context.fillStyle = "rgba(124, 45, 18, 0.34)";
        context.fillRect(boardLeft + 2, boardBottom - 6, grainShadowWidth, 4);
        context.strokeStyle = config.colors.pusherEdge;
        context.lineWidth = 1.5;
        context.strokeRect(boardLeft + 1, visibleTop + 1, Math.max(2, boardWidth - 2), Math.max(2, boardBottom - visibleTop - 2));
        context.restore();
    }
}
exports.PusherRenderer = PusherRenderer;
