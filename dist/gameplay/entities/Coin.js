"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Coin = void 0;
const BoardItem_1 = require("./BoardItem");
class Coin extends BoardItem_1.BoardItem {
    constructor(id, position, velocity, radius, pseudo3D) {
        super(id, "coin", position, velocity, radius, pseudo3D);
    }
    buildDropResult() {
        return {
            id: this.id,
            kind: this.kind,
            rewardAmount: 1,
            feedbackText: "+1",
            position: { ...this.position }
        };
    }
}
exports.Coin = Coin;
