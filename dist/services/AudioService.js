"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOUND_SLOTS = exports.SOUND_ASSET_BASE_PATH = void 0;
exports.playSound = playSound;
exports.SOUND_ASSET_BASE_PATH = "assets/audio";
exports.SOUND_SLOTS = [
    {
        id: "coin-drop",
        fileName: "coin-drop.mp3",
        maxDurationSeconds: 0.25,
        maxFileSizeKb: 40,
        usage: "主动投放物体成功生成时播放。"
    },
    {
        id: "coin-score",
        fileName: "coin-score.mp3",
        maxDurationSeconds: 0.35,
        maxFileSizeKb: 50,
        usage: "普通物品进入结算区并获得资源时播放。"
    },
    {
        id: "reward-drop",
        fileName: "reward-drop.mp3",
        maxDurationSeconds: 0.45,
        maxFileSizeKb: 60,
        usage: "预留给普通奖励掉落或更强反馈。"
    },
    {
        id: "reward-rare",
        fileName: "reward-rare.mp3",
        maxDurationSeconds: 0.7,
        maxFileSizeKb: 90,
        usage: "解锁新可投放物品或稀有奖励时播放。"
    },
    {
        id: "reward-spawn",
        fileName: "reward-spawn.mp3",
        maxDurationSeconds: 0.35,
        maxFileSizeKb: 50,
        usage: "世界随机掉落生成一批物体时播放。"
    },
    {
        id: "combo",
        fileName: "combo.mp3",
        maxDurationSeconds: 0.5,
        maxFileSizeKb: 70,
        usage: "重新开始或连击反馈预留。"
    }
];
// 静音占位：调用点保留，等正式音频放入 assets/audio 后再在这里接入播放实现。
function playSound(_name) {
}
