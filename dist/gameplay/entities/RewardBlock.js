"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardBlock = void 0;
const BoardItem_1 = require("./BoardItem");
class RewardBlock extends BoardItem_1.BoardItem {
    constructor(id, rewardType, position, velocity, radius, rewardAmount, label, feedbackLabel, pseudo3D) {
        super(id, "reward", position, velocity, radius, pseudo3D);
        this.rewardType = rewardType;
        this.rewardAmount = rewardAmount;
        this.label = label;
        this.feedbackLabel = feedbackLabel;
    }
    buildDropResult() {
        return {
            id: this.id,
            kind: this.kind,
            rewardAmount: this.rewardAmount,
            feedbackText: `${this.feedbackLabel} +${this.rewardAmount}`,
            rewardType: this.rewardType,
            position: { ...this.position }
        };
    }
}
exports.RewardBlock = RewardBlock;
