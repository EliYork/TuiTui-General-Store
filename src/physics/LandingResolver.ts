import { BoardItem } from "../gameplay/entities/BoardItem";
import { Pusher } from "../gameplay/entities/Pusher";

export interface LandingConfig {
  airborneCollisionHeight: number;
  maxStackLevel: number;
  pusherSupportHeight: number;
  stackHeightUnit: number;
  supportDepthTolerance: number;
  supportSearchRadiusScale: number;
}

interface LandingSupport {
  stackLevel: number;
  supportHeight: number;
  score: number;
}

export class LandingResolver {
  constructor(private readonly config: LandingConfig) {}

  resolveLandingTargets(items: BoardItem[], pusher: Pusher): void {
    for (const item of items) {
      if (!item.shouldResolveLanding(this.config.airborneCollisionHeight)) {
        continue;
      }

      const support = this.findBestSupport(item, items, pusher);
      item.markLandingResolved(support.supportHeight, support.stackLevel);
    }
  }

  private findBestSupport(
    target: BoardItem,
    items: BoardItem[],
    pusher: Pusher
  ): LandingSupport {
    const bestSupport: LandingSupport = {
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

      const candidateSupportHeight =
        item.supportHeight + this.getSupportIncrement(item);
      const candidateStackLevel = Math.min(
        this.config.maxStackLevel,
        item.stackLevel + 1
      );
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

  private considerPusherSupport(
    target: BoardItem,
    pusher: Pusher,
    bestSupport: LandingSupport
  ): void {
    const bounds = pusher.getBounds();
    const withinX =
      target.x + target.radius >= bounds.x &&
      target.x - target.radius <= bounds.x + bounds.width;
    const withinDepth =
      target.depth + target.radius >= bounds.y &&
      target.depth - target.radius <= bounds.y + bounds.height;

    if (!withinX || !withinDepth) {
      return;
    }

    bestSupport.supportHeight = this.config.pusherSupportHeight;
    bestSupport.stackLevel = Math.max(bestSupport.stackLevel, pusher.stackLevel);
    bestSupport.score = this.config.pusherSupportHeight * 100 + 1;
  }

  private getSupportIncrement(item: BoardItem): number {
    const radiusDrivenHeight = item.radius * 0.22;
    return Math.min(this.config.stackHeightUnit, radiusDrivenHeight);
  }
}
