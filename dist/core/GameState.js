"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameState = void 0;
class GameState {
    constructor() {
        this.snapshot = {
            gold: 0,
            sceneCoinCount: 0,
            rewardBlockCount: 0,
            totalSpawnedCoins: 0,
            droppedCoinCount: 0,
            comboCount: 0,
            latestDropHint: "Waiting for drops",
            statusText: "\u70b9\u51fb\u6295\u5e01\u6309\u94ae\uff0c\u628a\u786c\u5e01\u63a8\u5230\u524d\u6cbf\u6389\u843d"
        };
    }
    applyLoadedData(data) {
        if (!data) {
            return;
        }
        this.snapshot = {
            ...this.snapshot,
            ...data,
            sceneCoinCount: 0,
            rewardBlockCount: 0,
            comboCount: 0
        };
    }
    setSceneCoinCount(count) {
        this.snapshot.sceneCoinCount = count;
    }
    setRewardBlockCount(count) {
        this.snapshot.rewardBlockCount = count;
    }
    setComboCount(count) {
        this.snapshot.comboCount = count;
    }
    recordCoinSpawn() {
        this.snapshot.totalSpawnedCoins += 1;
        this.snapshot.statusText = `\u5df2\u6295\u5165\u7b2c ${this.snapshot.totalSpawnedCoins} \u679a\u786c\u5e01`;
    }
    recordDropResolution(droppedCount, totalReward, comboCount, comboBonus, latestDropHint) {
        this.snapshot.droppedCoinCount += droppedCount;
        this.snapshot.gold += totalReward + comboBonus;
        this.snapshot.comboCount = comboCount;
        this.snapshot.latestDropHint = latestDropHint;
        if (comboCount >= 2) {
            this.snapshot.statusText = `Combo x${comboCount} | +${totalReward + comboBonus}`;
            return;
        }
        this.snapshot.statusText = `\u6389\u843d\u5956\u52b1 +${totalReward + comboBonus}`;
    }
    setStatusText(text) {
        this.snapshot.statusText = text;
    }
    getSnapshot() {
        return { ...this.snapshot };
    }
}
exports.GameState = GameState;
