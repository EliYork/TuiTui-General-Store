"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveGame = saveGame;
exports.loadGame = loadGame;
function saveGame(snapshot) {
    void snapshot;
    // 阶段一先预留，第二阶段可替换为 wx.setStorageSync。
}
function loadGame() {
    // 阶段一先返回空数据，保留后续接入本地存档的位置。
    return null;
}
