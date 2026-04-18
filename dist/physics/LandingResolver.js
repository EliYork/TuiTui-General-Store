"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LandingResolver = void 0;
class LandingResolver {
    constructor(config) {
        this.config = config;
    }
    resolveLandingTargets(items, pusher) {
        for (const item of items) {
            if (!item.shouldResolveLanding(this.config.airborneCollisionHeight)) {
                continue;
            }
            const support = this.findBestSupport(item, items, pusher);
            item.markLandingResolved(support.supportHeight, support.stackLevel);
        }
    }
    findBestSupport(target, items, pusher) {
        const bestSupport = {
            stackLevel: 1,
            supportHeight: 0,
            score: -Infinity
        };
        if (target.height > this.config.stackHeightUnit * 1.6) {
            return bestSupport;
        }
        this.considerPusherSupport(target, pusher, bestSupport);
        for (const item of items) {
            if (item === target || item.isDropped) {
                continue;
            }
            if (item.height > this.config.airborneCollisionHeight) {
                continue;
            }
            const deltaX = item.x - target.x;
            const deltaDepth = item.depth - target.depth;
            const maxDistance = (item.radius + target.radius) * this.config.supportSearchRadiusScale;
            if (Math.abs(deltaDepth) > this.config.supportDepthTolerance) {
                continue;
            }
            const distanceSquared = deltaX * deltaX + deltaDepth * deltaDepth;
            if (distanceSquared > maxDistance * maxDistance) {
                continue;
            }
            const candidateSupportHeight = item.supportHeight + this.getSupportIncrement(item);
            const candidateStackLevel = Math.min(this.config.maxStackLevel, item.stackLevel + 1);
            const score = candidateSupportHeight * 64 - distanceSquared;
            if (score <= bestSupport.score) {
                continue;
            }
            bestSupport.supportHeight = candidateSupportHeight;
            bestSupport.stackLevel = candidateStackLevel;
            bestSupport.score = score;
        }
        return bestSupport;
    }
    considerPusherSupport(target, pusher, bestSupport) {
        const bounds = pusher.getBounds();
        const withinX = target.x + target.radius >= bounds.x &&
            target.x - target.radius <= bounds.x + bounds.width;
        const withinDepth = target.depth + target.radius >= bounds.y &&
            target.depth - target.radius <= bounds.y + bounds.height;
        if (!withinX || !withinDepth) {
            return;
        }
        bestSupport.supportHeight = this.config.pusherSupportHeight;
        bestSupport.stackLevel = Math.max(bestSupport.stackLevel, pusher.stackLevel);
        bestSupport.score = this.config.pusherSupportHeight * 100 + 1;
    }
    getSupportIncrement(item) {
        const radiusDrivenHeight = item.radius * 0.22;
        return Math.min(this.config.stackHeightUnit, radiusDrivenHeight);
    }
}
exports.LandingResolver = LandingResolver;
