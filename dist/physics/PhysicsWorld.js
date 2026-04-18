"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsWorld = void 0;
const LandingResolver_1 = require("./LandingResolver");
class PhysicsWorld {
    constructor(config) {
        this.config = config;
        this.landingResolver = new LandingResolver_1.LandingResolver(config);
    }
    updateItems(items, pusher, deltaSeconds) {
        const droppedItems = [];
        const stepCount = Math.max(1, Math.ceil(deltaSeconds / this.config.maxStepSeconds));
        const stepDelta = deltaSeconds / stepCount;
        for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
            this.integrateItems(items, stepDelta);
            this.resolveTableBounds(items);
            this.resolvePusherPush(items, pusher);
            for (let iteration = 0; iteration < this.config.separationIterations; iteration += 1) {
                this.resolveItemPairs(items);
                this.resolvePusherPush(items, pusher);
                this.resolveTableBounds(items);
            }
            this.landingResolver.resolveLandingTargets(items, pusher);
            this.relaxSupportStates(items, stepDelta);
            this.collectDroppedItems(items, droppedItems);
        }
        return {
            droppedItems,
            totalReward: droppedItems.reduce((sum, item) => sum + item.rewardAmount, 0)
        };
    }
    integrateItems(items, deltaSeconds) {
        for (const item of items) {
            if (item.isDropped) {
                continue;
            }
            item.applyLinearDamping(this.config.linearDamping, deltaSeconds, this.config.restThreshold);
            item.clampVelocity(this.config.maxSpeedX, this.config.maxSpeedY);
            item.integrate(deltaSeconds);
        }
        for (const item of items) {
            if (item.isDropped) {
                continue;
            }
            this.integrateHeight(item, deltaSeconds);
        }
    }
    resolvePusherPush(items, pusher) {
        if (!pusher.isMovingForward()) {
            return;
        }
        const bounds = pusher.getBounds();
        const minTargetY = pusher.getFrontEdgeY() + this.config.pushSeparationBias;
        const pushVelocity = Math.max(0, pusher.velocityY * this.config.pushVelocityTransfer);
        for (const item of items) {
            if (item.isDropped) {
                continue;
            }
            if (item.height > this.config.airborneCollisionHeight) {
                continue;
            }
            const withinX = item.x + item.radius >= bounds.x &&
                item.x - item.radius <= bounds.x + bounds.width;
            if (!withinX) {
                continue;
            }
            const overlapsY = item.depth + item.radius >= bounds.y &&
                item.depth - item.radius <= bounds.y + bounds.height + pusher.getPushDeltaY();
            if (!overlapsY) {
                continue;
            }
            const targetY = minTargetY + item.radius;
            if (item.depth < targetY) {
                item.depth = targetY;
            }
            item.setMinimumForwardVelocity(pushVelocity);
            const horizontalBias = (item.x - pusher.x) / Math.max(1, bounds.width / 2);
            item.velocity.x += horizontalBias * 6;
        }
    }
    resolveItemPairs(items) {
        for (let index = 0; index < items.length; index += 1) {
            const itemA = items[index];
            if (itemA.isDropped) {
                continue;
            }
            for (let otherIndex = index + 1; otherIndex < items.length; otherIndex += 1) {
                const itemB = items[otherIndex];
                if (itemB.isDropped) {
                    continue;
                }
                if (itemA.height > this.config.airborneCollisionHeight ||
                    itemB.height > this.config.airborneCollisionHeight) {
                    continue;
                }
                const deltaX = itemB.x - itemA.x;
                const deltaY = itemB.depth - itemA.depth;
                const minDistance = itemA.radius + itemB.radius;
                const distanceSquared = deltaX * deltaX + deltaY * deltaY;
                if (distanceSquared >= minDistance * minDistance) {
                    continue;
                }
                const distance = Math.sqrt(Math.max(distanceSquared, 0.0001));
                const normalX = distance > 0 ? deltaX / distance : 0;
                const normalY = distance > 0 ? deltaY / distance : 1;
                const overlap = minDistance - distance;
                const separationX = normalX * overlap * 0.5;
                const separationY = normalY * overlap * 0.5;
                itemA.translate(-separationX, -separationY);
                itemB.translate(separationX, separationY);
                const relativeVelocityX = itemB.velocity.x - itemA.velocity.x;
                const relativeVelocityY = itemB.velocity.y - itemA.velocity.y;
                const separatingSpeed = relativeVelocityX * normalX + relativeVelocityY * normalY;
                if (separatingSpeed > 0) {
                    continue;
                }
                const impulse = -separatingSpeed * this.config.pairBounce;
                const impulseX = normalX * impulse;
                const impulseY = normalY * impulse;
                itemA.velocity.x -= impulseX;
                itemA.velocity.y -= impulseY;
                itemB.velocity.x += impulseX;
                itemB.velocity.y += impulseY;
            }
        }
    }
    resolveTableBounds(items) {
        for (const item of items) {
            if (item.isDropped) {
                continue;
            }
            const minX = this.config.leftWallX + item.radius;
            const maxX = this.config.rightWallX - item.radius;
            const minY = this.config.backWallY + item.radius;
            if (item.x < minX) {
                item.x = minX;
                item.velocity.x = Math.abs(item.velocity.x) * this.config.pairBounce;
            }
            if (item.x > maxX) {
                item.x = maxX;
                item.velocity.x = -Math.abs(item.velocity.x) * this.config.pairBounce;
            }
            if (item.depth < minY) {
                item.depth = minY;
                item.velocity.y = Math.max(0, item.velocity.y);
            }
        }
    }
    collectDroppedItems(items, droppedItems) {
        for (const item of items) {
            if (item.isDropped) {
                continue;
            }
            if (item.depth + item.radius < this.config.dropLineY) {
                continue;
            }
            if (item.height > this.config.dropResolveHeight) {
                continue;
            }
            item.markDropped();
            droppedItems.push(item.buildDropResult());
        }
    }
    integrateHeight(item, deltaSeconds) {
        item.height = Math.max(0, item.height + item.heightVelocity * deltaSeconds);
        if (item.height === 0 && item.heightVelocity <= 0) {
            item.heightVelocity = 0;
            return;
        }
        item.heightVelocity = Math.max(-this.config.maxHeightVelocity, item.heightVelocity - this.config.heightGravity * deltaSeconds);
        if (item.height === 0 && item.heightVelocity < 0) {
            item.heightVelocity = 0;
        }
    }
    relaxSupportStates(items, deltaSeconds) {
        for (const item of items) {
            if (item.isDropped || item.landingAssistActive) {
                continue;
            }
            item.relaxSupportState(deltaSeconds, this.config.supportRelaxationPerSecond);
        }
    }
}
exports.PhysicsWorld = PhysicsWorld;
