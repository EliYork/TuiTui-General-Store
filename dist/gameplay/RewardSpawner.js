"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RewardSpawner = void 0;
const math_1 = require("../utils/math");
const RewardBlock_1 = require("./entities/RewardBlock");
class RewardSpawner {
    constructor(config) {
        this.config = config;
        this.nextId = 1;
    }
    spawnInitial(existingItems) {
        const result = [];
        for (let index = 0; index < this.config.initialCount; index += 1) {
            const rewardBlock = this.trySpawn([...existingItems, ...result]);
            if (!rewardBlock) {
                break;
            }
            result.push(rewardBlock);
        }
        return result;
    }
    trySpawn(existingItems) {
        if (existingItems.filter((item) => item.kind === "reward").length >= this.config.maxVisible) {
            return null;
        }
        const definition = this.pickTypeDefinition();
        const position = this.findSpawnPosition(existingItems, definition.radius);
        if (!position) {
            return null;
        }
        const rewardBlock = new RewardBlock_1.RewardBlock(this.nextId, definition.type, position, {
            x: (0, math_1.randomRange)(this.config.initialSpeedXMin, this.config.initialSpeedXMax),
            y: (0, math_1.randomRange)(this.config.initialSpeedYMin, this.config.initialSpeedYMax)
        }, definition.radius, definition.rewardAmount, definition.label, definition.feedbackLabel, {
            stackLevel: definition.stackLevel
        });
        this.nextId += 1;
        return rewardBlock;
    }
    pickTypeDefinition() {
        const entries = Object.values(this.config.types);
        const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
        let cursor = Math.random() * totalWeight;
        for (const entry of entries) {
            cursor -= entry.weight;
            if (cursor <= 0) {
                return {
                    type: entry.type,
                    rewardAmount: entry.rewardAmount,
                    radius: entry.radius,
                    label: entry.label,
                    feedbackLabel: entry.feedbackLabel,
                    weight: entry.weight,
                    stackLevel: entry.stackLevel
                };
            }
        }
        const fallback = entries[entries.length - 1];
        return {
            type: fallback.type,
            rewardAmount: fallback.rewardAmount,
            radius: fallback.radius,
            label: fallback.label,
            feedbackLabel: fallback.feedbackLabel,
            weight: fallback.weight,
            stackLevel: fallback.stackLevel
        };
    }
    findSpawnPosition(existingItems, radius) {
        const left = this.config.spawnArea.left + radius;
        const right = this.config.spawnArea.right - radius;
        const top = this.config.spawnArea.top + radius;
        const bottom = this.config.spawnArea.bottom - radius;
        for (let attempt = 0; attempt < this.config.spawnAttempts; attempt += 1) {
            const position = {
                x: (0, math_1.randomRange)(left, right),
                y: (0, math_1.randomRange)(top, bottom)
            };
            const hasOverlap = existingItems.some((item) => {
                const deltaX = item.position.x - position.x;
                const deltaY = item.position.y - position.y;
                const minDistance = item.radius + radius + this.config.spawnPadding;
                return deltaX * deltaX + deltaY * deltaY < minDistance * minDistance;
            });
            if (!hasOverlap) {
                return position;
            }
        }
        return null;
    }
}
exports.RewardSpawner = RewardSpawner;
