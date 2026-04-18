import {
  addVec3,
  crossVec3,
  lengthVec3,
  normalizeVec3,
  rotateVec3AroundAxis,
  scaleVec3,
  vec3
} from "../core/render3d/math3d";
import { RuntimeGameConfig } from "../data/gameConfig";
import { PusherRig3DState } from "../gameplay3d/PusherRig3D";
import { CoinBody3D } from "../gameplay3d/entities/CoinBody3D";
import { clamp, lerp } from "../utils/math";

interface SupportPlane3D {
  height: number;
  surfaceVelocityX: number;
  surfaceVelocityZ: number;
  kind: "base" | "pusher" | "hidden" | "stack";
}

const WORLD_UP = vec3(0, 1, 0);

export class PhysicsWorld3D {
  private readonly cabinet = this.config.threeD.cabinet;
  private readonly physics = this.config.physics3d;

  constructor(private readonly config: RuntimeGameConfig) {}

  updateCoins(
    coins: CoinBody3D[],
    pusher: PusherRig3DState,
    deltaSeconds: number
  ): void {
    if (coins.length === 0) {
      return;
    }

    const stepCount = Math.max(
      1,
      Math.ceil(deltaSeconds / this.physics.maxStepSeconds)
    );
    const stepDelta = deltaSeconds / stepCount;

    for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
      this.integrateCoins(coins, stepDelta);

      for (
        let iteration = 0;
        iteration < this.physics.solverIterations;
        iteration += 1
      ) {
        this.resolveCoinSupports(coins, pusher, stepDelta);
        this.resolvePusherFrontFaceContacts(coins, pusher, stepDelta);
        this.resolveCoinPairs(coins, stepDelta);
        this.resolveBounds(coins, pusher);
      }

      this.resolveCoinSupports(coins, pusher, stepDelta);
      this.resolvePusherFrontFaceContacts(coins, pusher, stepDelta);
      this.resolveBounds(coins, pusher);
    }
  }

  private integrateCoins(coins: CoinBody3D[], deltaSeconds: number): void {
    for (const coin of coins) {
      const wasGrounded = coin.isGrounded;
      coin.isGrounded = false;
      coin.supportVelocityZ = 0;
      if (coin.isSleeping) {
        coin.velocity.x = 0;
        coin.velocity.y = 0;
        coin.velocity.z = 0;
        coin.angularVelocity.x = 0;
        coin.angularVelocity.y = 0;
        coin.angularVelocity.z = 0;
        continue;
      }

      const horizontalSpeed = Math.hypot(coin.velocity.x, coin.velocity.z);
      const angularSpeed = lengthVec3(coin.angularVelocity);
      const isSettling =
        wasGrounded &&
        horizontalSpeed < this.physics.sleepLinearSpeed * 1.4 &&
        angularSpeed < this.physics.sleepAngularSpeed * 2.2;
      const linearDamping = isSettling
        ? this.physics.settledLinearDamping
        : wasGrounded
          ? this.physics.groundFriction * 0.18
          : this.physics.airDamping;
      const linearDampingFactor = Math.exp(-linearDamping * deltaSeconds);
      const angularDamping = isSettling
        ? this.physics.settledAngularDamping
        : wasGrounded
          ? this.physics.groundAngularDamping
          : this.physics.airAngularDamping;
      const angularDampingFactor = Math.exp(-angularDamping * deltaSeconds);

      coin.velocity.x *= linearDampingFactor;
      coin.velocity.z *= linearDampingFactor;
      coin.velocity.y = clamp(
        coin.velocity.y - this.physics.gravity * deltaSeconds,
        -this.physics.maxVerticalSpeed,
        this.physics.maxVerticalSpeed
      );
      coin.velocity.x = clamp(
        coin.velocity.x,
        -this.physics.maxHorizontalSpeed,
        this.physics.maxHorizontalSpeed
      );
      coin.velocity.z = clamp(
        coin.velocity.z,
        -this.physics.maxHorizontalSpeed,
        this.physics.maxHorizontalSpeed
      );

      coin.angularVelocity.x *= angularDampingFactor;
      coin.angularVelocity.y *= angularDampingFactor;
      coin.angularVelocity.z *= angularDampingFactor;

      if (isSettling) {
        this.clampSettledMotion(coin);
      }

      this.limitAngularSpeed(coin);

      coin.position.x += coin.velocity.x * deltaSeconds;
      coin.position.y += coin.velocity.y * deltaSeconds;
      coin.position.z += coin.velocity.z * deltaSeconds;
      this.integrateOrientation(coin, deltaSeconds);
    }
  }

  private integrateOrientation(coin: CoinBody3D, deltaSeconds: number): void {
    const angularSpeed = lengthVec3(coin.angularVelocity);
    if (angularSpeed <= 0.0001) {
      return;
    }

    const axis = scaleVec3(coin.angularVelocity, 1 / angularSpeed);
    const rotatedNormal = rotateVec3AroundAxis(
      coin.normal,
      axis,
      angularSpeed * deltaSeconds
    );
    const normalizedNormal = normalizeVec3(rotatedNormal);

    coin.normal.x = normalizedNormal.x;
    coin.normal.y = normalizedNormal.y;
    coin.normal.z = normalizedNormal.z;
  }

  private resolveCoinSupports(
    coins: CoinBody3D[],
    pusher: PusherRig3DState,
    deltaSeconds: number
  ): void {
    for (const coin of coins) {
      const support = this.getSupportPlane(coin, pusher);
      const minCenterY = support.height + this.getVerticalExtent(coin);
      const supportContactSlop = 0.5;

      if (
        coin.isSleeping &&
        (coin.position.y > minCenterY + 0.75 ||
          Math.abs(support.surfaceVelocityZ) > this.physics.sleepLinearSpeed * 0.35)
      ) {
        this.wakeCoin(coin);
      }

      if (coin.position.y > minCenterY + supportContactSlop) {
        continue;
      }

      coin.position.y = minCenterY;
      coin.isGrounded = true;
      coin.supportVelocityZ = support.surfaceVelocityZ;

      if (coin.velocity.y < 0) {
        coin.velocity.y = -coin.velocity.y * this.physics.collisionBounce;
      }

      if (Math.abs(coin.velocity.y) < 8) {
        coin.velocity.y = 0;
      }

      const horizontalBlend =
        1 - Math.exp(-this.physics.groundFriction * deltaSeconds);
      coin.velocity.x = lerp(
        coin.velocity.x,
        support.surfaceVelocityX,
        horizontalBlend
      );

      const surfaceFriction =
        support.surfaceVelocityZ < 0
          ? this.physics.pusherCarry
          : support.surfaceVelocityZ > 0
            ? this.physics.pusherCarry * 0.18
            : this.physics.groundFriction;
      const depthBlend = 1 - Math.exp(-surfaceFriction * deltaSeconds);
      coin.velocity.z = lerp(
        coin.velocity.z,
        support.surfaceVelocityZ,
        depthBlend
      );

      this.applyContactStabilization(coin, support, deltaSeconds);

      if (this.updateSleepState(coin, support, deltaSeconds)) {
        continue;
      }

      this.applyGroundTiltForces(coin, support, deltaSeconds);
      this.limitAngularSpeed(coin);
    }
  }

  private applyGroundTiltForces(
    coin: CoinBody3D,
    support: SupportPlane3D,
    deltaSeconds: number
  ): void {
    const normal = this.getDisplayNormal(coin);
    const tilt = clamp(1 - normal.y, 0, 1);
    if (tilt <= 0.08) {
      return;
    }

    const horizontalSpeed = Math.hypot(
      coin.velocity.x - support.surfaceVelocityX,
      coin.velocity.z - support.surfaceVelocityZ
    );
    const angularSpeed = lengthVec3(coin.angularVelocity);
    const forceScale = clamp((tilt - 0.16) / 0.46, 0, 1);
    if (forceScale <= 0) {
      return;
    }
    if (
      horizontalSpeed < this.physics.sleepLinearSpeed * 0.95 &&
      angularSpeed < this.physics.sleepAngularSpeed * 1.6
    ) {
      return;
    }

    const settleAxis = crossVec3(normal, WORLD_UP);
    const settleAxisLength = lengthVec3(settleAxis);
    if (settleAxisLength > 0.0001) {
      const settleTorque = scaleVec3(
        settleAxis,
        (this.physics.settlingTorque * forceScale * deltaSeconds) /
          settleAxisLength
      );
      coin.angularVelocity.x += settleTorque.x;
      coin.angularVelocity.y += settleTorque.y;
      coin.angularVelocity.z += settleTorque.z;
    }

    const rollDirectionLength = Math.hypot(normal.x, normal.z);
    if (rollDirectionLength > 0.0001) {
      const rollDirection = vec3(
        normal.x / rollDirectionLength,
        0,
        normal.z / rollDirectionLength
      );
      const rollAcceleration = this.physics.rollAcceleration * forceScale;
      coin.velocity.x += rollDirection.x * rollAcceleration * deltaSeconds;
      coin.velocity.z += rollDirection.z * rollAcceleration * deltaSeconds;
    }

    if (support.surfaceVelocityZ !== 0) {
      coin.angularVelocity.x +=
        -support.surfaceVelocityZ * 0.014 * tilt * deltaSeconds;
    }
  }

  private getSupportPlane(
    coin: CoinBody3D,
    pusher: PusherRig3DState
  ): SupportPlane3D {
    const frontReachZ = coin.position.z - this.getDepthExtent(coin);
    const upperPlatformHeight =
      frontReachZ >=
      this.cabinet.platformFrontZ - coin.radius * this.physics.platformEdgeSlack
        ? 0
        : -this.cabinet.dropWellDepth;

    const support: SupportPlane3D = {
      height: upperPlatformHeight,
      surfaceVelocityX: 0,
      surfaceVelocityZ: 0,
      kind: "base"
    };

    if (!this.isOnVisiblePusherSurface(coin, pusher)) {
      if (
        !this.isOnHiddenRearSupportSurface(coin, pusher) ||
        !this.canRideElevatedSupport(coin, pusher.topY)
      ) {
        return support;
      }

      return {
        height: Math.max(support.height, pusher.topY),
        surfaceVelocityX: 0,
        surfaceVelocityZ:
          pusher.velocityZ < 0 ? pusher.velocityZ : pusher.velocityZ * 0.1,
        kind: "hidden"
      };
    }

    if (!this.canRideElevatedSupport(coin, pusher.topY)) {
      return support;
    }

    return {
      height: Math.max(support.height, pusher.topY),
      surfaceVelocityX: 0,
      surfaceVelocityZ:
        pusher.velocityZ < 0 ? pusher.velocityZ : pusher.velocityZ * 0.18,
      kind: "pusher"
    };
  }

  private canRideElevatedSupport(
    coin: CoinBody3D,
    supportHeight: number
  ): boolean {
    const verticalExtent = this.getVerticalExtent(coin);
    const coinTopY = coin.position.y + verticalExtent;

    return coinTopY >= supportHeight - coin.thickness * 0.35;
  }

  private isOnVisiblePusherSurface(
    coin: CoinBody3D,
    pusher: PusherRig3DState
  ): boolean {
    const sideExtent = this.getSideExtent(coin);
    const depthExtent = this.getDepthExtent(coin);
    const withinX =
      Math.abs(coin.position.x) <=
      pusher.width / 2 + sideExtent * this.physics.pusherCaptureSlack;
    const withinZ =
      coin.position.z + depthExtent * this.physics.pusherCaptureSlack >=
        pusher.frontZ &&
      coin.position.z - depthExtent <= pusher.backZ;

    return withinX && withinZ;
  }

  private isOnHiddenRearSupportSurface(
    coin: CoinBody3D,
    pusher: PusherRig3DState
  ): boolean {
    if (pusher.hiddenSupportBackZ <= pusher.hiddenSupportFrontZ + 0.5) {
      return false;
    }

    const sideExtent = this.getSideExtent(coin);
    const depthExtent = this.getDepthExtent(coin);
    const withinX =
      Math.abs(coin.position.x) <=
      pusher.hiddenSupportWidth / 2 + sideExtent * 0.22;
    const withinZ =
      coin.position.z + depthExtent * this.physics.pusherCaptureSlack >=
        pusher.hiddenSupportFrontZ &&
      coin.position.z - depthExtent <= pusher.hiddenSupportBackZ;

    return withinX && withinZ;
  }

  private applyContactStabilization(
    coin: CoinBody3D,
    support: SupportPlane3D,
    deltaSeconds: number
  ): void {
    const relativeLinearSpeed = Math.hypot(
      coin.velocity.x - support.surfaceVelocityX,
      coin.velocity.z - support.surfaceVelocityZ
    );
    const angularSpeed = lengthVec3(coin.angularVelocity);
    const isSettling =
      relativeLinearSpeed < this.physics.sleepLinearSpeed * 1.4 &&
      angularSpeed < this.physics.sleepAngularSpeed * 2.2;

    if (!isSettling) {
      return;
    }

    const linearFactor = Math.exp(-this.physics.settledLinearDamping * deltaSeconds);
    coin.velocity.x =
      support.surfaceVelocityX +
      (coin.velocity.x - support.surfaceVelocityX) * linearFactor;
    coin.velocity.z =
      support.surfaceVelocityZ +
      (coin.velocity.z - support.surfaceVelocityZ) * linearFactor;

    const angularFactor = Math.exp(
      -this.physics.settledAngularDamping * deltaSeconds
    );
    coin.angularVelocity.x *= angularFactor;
    coin.angularVelocity.y *= angularFactor;
    coin.angularVelocity.z *= angularFactor;

    if (support.kind !== "stack") {
      this.flattenCoinOnFlatSupport(coin, deltaSeconds, relativeLinearSpeed, angularSpeed);
    }

    this.clampSettledMotion(coin);
  }

  private flattenCoinOnFlatSupport(
    coin: CoinBody3D,
    deltaSeconds: number,
    relativeLinearSpeed: number,
    angularSpeed: number
  ): void {
    const normal = this.getDisplayNormal(coin);
    const tilt = clamp(1 - normal.y, 0, 1);
    if (tilt <= 0.012) {
      return;
    }

    const settlingBlend =
      relativeLinearSpeed < this.physics.sleepLinearSpeed * 1.15 &&
      angularSpeed < this.physics.sleepAngularSpeed * 1.5
        ? 1 - Math.exp(-14 * deltaSeconds)
        : 1 - Math.exp(-7 * deltaSeconds);
    const flattenedNormal = normalizeVec3(
      addVec3(
        scaleVec3(normal, 1 - settlingBlend),
        scaleVec3(WORLD_UP, settlingBlend)
      )
    );

    coin.normal.x = flattenedNormal.x;
    coin.normal.y = flattenedNormal.y;
    coin.normal.z = flattenedNormal.z;

    const angularClampFactor = Math.exp(-10 * deltaSeconds);
    coin.angularVelocity.x *= angularClampFactor;
    coin.angularVelocity.z *= angularClampFactor;
    if (flattenedNormal.y > 0.985) {
      coin.normal.x = 0;
      coin.normal.y = 1;
      coin.normal.z = 0;
      coin.angularVelocity.x = 0;
      coin.angularVelocity.z = 0;
    }
  }

  private resolveCoinPairs(coins: CoinBody3D[], deltaSeconds: number): void {
    for (let index = 0; index < coins.length; index += 1) {
      const coinA = coins[index];

      for (
        let otherIndex = index + 1;
        otherIndex < coins.length;
        otherIndex += 1
      ) {
        const coinB = coins[otherIndex];
        const deltaX = coinB.position.x - coinA.position.x;
        const deltaZ = coinB.position.z - coinA.position.z;
        const radiusSum = coinA.radius + coinB.radius;
        const horizontalDistanceSquared = deltaX * deltaX + deltaZ * deltaZ;

        if (horizontalDistanceSquared >= radiusSum * radiusSum) {
          continue;
        }

        const deltaY = coinB.position.y - coinA.position.y;
        const verticalOverlap =
          this.getVerticalExtent(coinA) +
          this.getVerticalExtent(coinB) -
          Math.abs(deltaY);
        if (verticalOverlap <= 0) {
          continue;
        }

        const horizontalDistance = Math.sqrt(
          Math.max(horizontalDistanceSquared, 0.0001)
        );
        const horizontalOverlap = radiusSum - horizontalDistance;

        if (verticalOverlap < horizontalOverlap * 0.9) {
          this.resolveVerticalPair(
            coinA,
            coinB,
            deltaX,
            deltaZ,
            deltaY,
            verticalOverlap,
            deltaSeconds
          );
          continue;
        }

        this.resolveHorizontalPair(
          coinA,
          coinB,
          deltaX,
          deltaZ,
          horizontalDistance,
          horizontalOverlap
        );
      }
    }
  }

  private resolveVerticalPair(
    coinA: CoinBody3D,
    coinB: CoinBody3D,
    deltaX: number,
    deltaZ: number,
    deltaY: number,
    overlap: number,
    deltaSeconds: number
  ): void {
    const relativeSpeed = Math.hypot(
      coinA.velocity.x - coinB.velocity.x,
      coinA.velocity.y - coinB.velocity.y,
      coinA.velocity.z - coinB.velocity.z
    );
    const impactScale = this.getPairImpactScale(overlap, relativeSpeed);
    if (impactScale > 0) {
      this.wakeCoin(coinA);
      this.wakeCoin(coinB);
    }

    const upperCoin = deltaY >= 0 ? coinB : coinA;
    const lowerCoin = deltaY >= 0 ? coinA : coinB;
    const lowerAnchored =
      lowerCoin.isGrounded || lowerCoin.isSleeping || lowerCoin.velocity.y <= 0;
    const upperCorrection = lowerAnchored ? overlap : overlap * 0.65;
    const lowerCorrection = lowerAnchored ? 0 : overlap * 0.35;

    upperCoin.position.y += upperCorrection;
    lowerCoin.position.y -= lowerCorrection;

    if (upperCoin.velocity.y < 0) {
      upperCoin.velocity.y *= -this.physics.collisionBounce;
    }

    if (lowerAnchored && Math.abs(upperCoin.velocity.y) < 8) {
      upperCoin.velocity.y = 0;
    }

    const stackBlend = 1 - Math.exp(-this.physics.stackFriction * deltaSeconds);
    upperCoin.velocity.x = lerp(
      upperCoin.velocity.x,
      lowerCoin.velocity.x,
      stackBlend * 0.7
    );
    upperCoin.velocity.z = lerp(
      upperCoin.velocity.z,
      lowerCoin.velocity.z,
      stackBlend * 0.7
    );

    if (lowerAnchored) {
      const stackSupport: SupportPlane3D = {
        height:
          lowerCoin.position.y +
          this.getVerticalExtent(lowerCoin) -
          this.getVerticalExtent(upperCoin),
        surfaceVelocityX: lowerCoin.velocity.x,
        surfaceVelocityZ: lowerCoin.isGrounded
          ? lowerCoin.supportVelocityZ
          : lowerCoin.velocity.z,
        kind: "stack"
      };

      upperCoin.isGrounded = true;
      upperCoin.supportVelocityZ = stackSupport.surfaceVelocityZ;
      this.applyContactStabilization(upperCoin, stackSupport, deltaSeconds);
      this.updateSleepState(upperCoin, stackSupport, deltaSeconds);
    }

    const offsetLength = Math.hypot(deltaX, deltaZ);
    if (offsetLength > 0.0001 && impactScale > 0) {
      const tipAxis = vec3(-deltaZ / offsetLength, 0, deltaX / offsetLength);
      this.addAngularKick(
        upperCoin,
        tipAxis,
        this.physics.collisionAngularKick * 0.85 * impactScale
      );
    }
  }

  private resolveHorizontalPair(
    coinA: CoinBody3D,
    coinB: CoinBody3D,
    deltaX: number,
    deltaZ: number,
    horizontalDistance: number,
    overlap: number
  ): void {
    let normalX = deltaX / horizontalDistance;
    let normalZ = deltaZ / horizontalDistance;

    if (!Number.isFinite(normalX) || !Number.isFinite(normalZ)) {
      const fallbackAngle =
        (((coinA.id * 17 + coinB.id * 31) % 360) * Math.PI) / 180;
      normalX = Math.cos(fallbackAngle);
      normalZ = Math.sin(fallbackAngle);
    }

    const separationX = normalX * overlap * 0.5;
    const separationZ = normalZ * overlap * 0.5;

    coinA.position.x -= separationX;
    coinA.position.z -= separationZ;
    coinB.position.x += separationX;
    coinB.position.z += separationZ;

    const relativeVelocityX = coinB.velocity.x - coinA.velocity.x;
    const relativeVelocityZ = coinB.velocity.z - coinA.velocity.z;
    const relativePlanarSpeed = Math.hypot(relativeVelocityX, relativeVelocityZ);
    const impactScale = this.getPairImpactScale(overlap, relativePlanarSpeed);
    if (impactScale > 0) {
      this.wakeCoin(coinA);
      this.wakeCoin(coinB);
    }
    const separatingSpeed =
      relativeVelocityX * normalX + relativeVelocityZ * normalZ;

    if (separatingSpeed < 0) {
      const impulse = -separatingSpeed * this.physics.collisionBounce;
      const impulseX = normalX * impulse;
      const impulseZ = normalZ * impulse;

      coinA.velocity.x -= impulseX;
      coinA.velocity.z -= impulseZ;
      coinB.velocity.x += impulseX;
      coinB.velocity.z += impulseZ;
    }

    const tipAxis = vec3(-normalZ, 0, normalX);
    if (impactScale > 0) {
      this.addAngularKick(
        coinA,
        tipAxis,
        -this.physics.collisionAngularKick * 0.42 * impactScale
      );
      this.addAngularKick(
        coinB,
        tipAxis,
        this.physics.collisionAngularKick * 0.42 * impactScale
      );
    }
  }

  private resolveBounds(
    coins: CoinBody3D[],
    pusher: PusherRig3DState
  ): void {
    for (const coin of coins) {
      const sideExtent = this.getSideExtent(coin);
      const depthExtent = this.getDepthExtent(coin);
      const minX = -this.cabinet.width / 2 + sideExtent;
      const maxX = this.cabinet.width / 2 - sideExtent;
      const minZ = this.physics.frontWallZ + depthExtent;
      const maxZ = this.getRearBoundZ(coin, pusher, depthExtent);

      if (coin.position.x < minX) {
        this.wakeCoin(coin);
        coin.position.x = minX;
        coin.velocity.x = Math.abs(coin.velocity.x) * this.physics.wallBounce;
        this.addAngularKick(
          coin,
          vec3(0, 0, 1),
          this.physics.collisionAngularKick * 0.56
        );
      }

      if (coin.position.x > maxX) {
        this.wakeCoin(coin);
        coin.position.x = maxX;
        coin.velocity.x = -Math.abs(coin.velocity.x) * this.physics.wallBounce;
        this.addAngularKick(
          coin,
          vec3(0, 0, -1),
          this.physics.collisionAngularKick * 0.56
        );
      }

      if (coin.position.z < minZ) {
        this.wakeCoin(coin);
        coin.position.z = minZ;
        coin.velocity.z = Math.abs(coin.velocity.z) * this.physics.wallBounce;
        this.addAngularKick(
          coin,
          vec3(1, 0, 0),
          this.physics.collisionAngularKick * 0.4
        );
      }

      if (coin.position.z > maxZ) {
        this.wakeCoin(coin);
        coin.position.z = maxZ;
        coin.velocity.z = -Math.abs(coin.velocity.z) * this.physics.wallBounce;
        this.addAngularKick(
          coin,
          vec3(-1, 0, 0),
          this.physics.collisionAngularKick * 0.4
        );
      }
    }
  }

  private resolvePusherFrontFaceContacts(
    coins: CoinBody3D[],
    pusher: PusherRig3DState,
    deltaSeconds: number
  ): void {
    if (pusher.velocityZ >= 0) {
      return;
    }

    for (const coin of coins) {
      const sideExtent = this.getSideExtent(coin);
      const depthExtent = this.getDepthExtent(coin);
      const verticalExtent = this.getVerticalExtent(coin);
      const bottomY = coin.position.y - verticalExtent;
      const topY = coin.position.y + verticalExtent;
      const withinX = Math.abs(coin.position.x) <= pusher.width / 2 + sideExtent;
      const overlapsVertical =
        bottomY < pusher.topY - 0.5 && topY > pusher.baseY + 0.5;
      const overlapsFrontFace =
        coin.position.z < pusher.frontZ &&
        coin.position.z + depthExtent > pusher.frontZ;
      const alreadyAboveTop = bottomY >= pusher.topY - coin.thickness * 0.35;

      if (
        !withinX ||
        !overlapsVertical ||
        !overlapsFrontFace ||
        alreadyAboveTop
      ) {
        continue;
      }

      this.wakeCoin(coin);
      coin.position.z = pusher.frontZ - depthExtent - 0.01;
      coin.velocity.z = lerp(coin.velocity.z, pusher.velocityZ, 0.82);
      coin.velocity.y = Math.min(coin.velocity.y, 0);

      const compression = clamp(
        (coin.position.y - pusher.baseY) / Math.max(1, pusher.height),
        0,
        1
      );
      coin.angularVelocity.x *= 0.6 + compression * 0.18;
      coin.angularVelocity.z *= 0.52;
      if (Math.abs(coin.angularVelocity.x) < this.physics.sleepAngularSpeed * 0.3) {
        coin.angularVelocity.x = 0;
      }
      if (Math.abs(coin.angularVelocity.z) < this.physics.sleepAngularSpeed * 0.3) {
        coin.angularVelocity.z = 0;
      }
    }
  }

  private getRearBoundZ(
    coin: CoinBody3D,
    pusher: PusherRig3DState,
    depthExtent: number
  ): number {
    const visibleRearBoundZ = this.cabinet.depth - depthExtent;
    const hiddenRearBoundZ = pusher.hiddenSupportBackZ - depthExtent;
    const sideExtent = this.getSideExtent(coin);
    const withinVisiblePusherLane =
      Math.abs(coin.position.x) <= pusher.width / 2 + sideExtent &&
      coin.position.z >= pusher.frontZ - depthExtent &&
      coin.position.z <= pusher.backZ + depthExtent;
    const withinRearSupportLane =
      Math.abs(coin.position.x) <= pusher.hiddenSupportWidth / 2 + sideExtent &&
      coin.position.z >= pusher.hiddenSupportFrontZ - depthExtent;

    return withinVisiblePusherLane || withinRearSupportLane
      ? Math.max(visibleRearBoundZ, hiddenRearBoundZ)
      : visibleRearBoundZ;
  }

  private addAngularKick(
    coin: CoinBody3D,
    axis: { x: number; y: number; z: number },
    strength: number
  ): void {
    coin.angularVelocity.x += axis.x * strength;
    coin.angularVelocity.y += axis.y * strength;
    coin.angularVelocity.z += axis.z * strength;
    this.limitAngularSpeed(coin);
  }

  private limitAngularSpeed(coin: CoinBody3D): void {
    const angularSpeed = lengthVec3(coin.angularVelocity);
    if (angularSpeed <= this.physics.maxAngularSpeed || angularSpeed === 0) {
      return;
    }

    const scale = this.physics.maxAngularSpeed / angularSpeed;
    coin.angularVelocity.x *= scale;
    coin.angularVelocity.y *= scale;
    coin.angularVelocity.z *= scale;
  }

  private updateSleepState(
    coin: CoinBody3D,
    support: SupportPlane3D,
    deltaSeconds: number
  ): boolean {
    if (!coin.isGrounded) {
      this.wakeCoin(coin);
      return false;
    }

    if (Math.abs(support.surfaceVelocityZ) > this.physics.sleepLinearSpeed * 0.35) {
      this.wakeCoin(coin);
      return false;
    }

    const linearSpeed = Math.hypot(
      coin.velocity.x - support.surfaceVelocityX,
      coin.velocity.y,
      coin.velocity.z - support.surfaceVelocityZ
    );
    const angularSpeed = lengthVec3(coin.angularVelocity);

    if (support.kind !== "stack" && this.getDisplayNormal(coin).y < 0.94) {
      this.wakeCoin(coin);
      return false;
    }

    if (
      linearSpeed > this.physics.sleepLinearSpeed ||
      angularSpeed > this.physics.sleepAngularSpeed
    ) {
      this.wakeCoin(coin);
      return false;
    }

    const deeplySettled =
      linearSpeed < this.physics.sleepLinearSpeed * 0.4 &&
      angularSpeed < this.physics.sleepAngularSpeed * 0.4;
    coin.sleepTimer += deeplySettled ? deltaSeconds * 2.4 : deltaSeconds;
    if (coin.sleepTimer < this.physics.sleepDelaySeconds) {
      return false;
    }

    coin.isSleeping = true;
    coin.velocity.x = 0;
    coin.velocity.y = 0;
    coin.velocity.z = 0;
    coin.angularVelocity.x = 0;
    coin.angularVelocity.y = 0;
    coin.angularVelocity.z = 0;
    return true;
  }

  private wakeCoin(coin: CoinBody3D): void {
    coin.isSleeping = false;
    coin.sleepTimer = 0;
  }

  private clampSettledMotion(coin: CoinBody3D): void {
    const linearClamp = this.physics.sleepLinearSpeed * 0.3;
    const angularClamp = this.physics.sleepAngularSpeed * 0.35;

    if (Math.abs(coin.velocity.x) < linearClamp) {
      coin.velocity.x = 0;
    }
    if (Math.abs(coin.velocity.z) < linearClamp) {
      coin.velocity.z = 0;
    }
    if (Math.abs(coin.angularVelocity.x) < angularClamp) {
      coin.angularVelocity.x = 0;
    }
    if (Math.abs(coin.angularVelocity.y) < angularClamp) {
      coin.angularVelocity.y = 0;
    }
    if (Math.abs(coin.angularVelocity.z) < angularClamp) {
      coin.angularVelocity.z = 0;
    }
  }

  private getPairImpactScale(overlap: number, relativeSpeed: number): number {
    if (
      overlap < this.physics.pairWakeOverlap &&
      relativeSpeed < this.physics.pairWakeSpeed
    ) {
      return 0;
    }

    const speedScale = clamp(
      relativeSpeed / (this.physics.pairWakeSpeed * 2.2),
      0,
      1
    );
    const overlapScale = clamp(
      overlap / (this.physics.pairWakeOverlap * 2.2),
      0,
      1
    );

    return Math.max(speedScale, overlapScale);
  }

  private getDisplayNormal(coin: CoinBody3D) {
    return coin.normal.y >= 0 ? coin.normal : scaleVec3(coin.normal, -1);
  }

  private getVerticalExtent(coin: CoinBody3D): number {
    return this.getExtentForComponent(coin, this.getDisplayNormal(coin).y);
  }

  private getSideExtent(coin: CoinBody3D): number {
    return this.getExtentForComponent(coin, this.getDisplayNormal(coin).x);
  }

  private getDepthExtent(coin: CoinBody3D): number {
    return this.getExtentForComponent(coin, this.getDisplayNormal(coin).z);
  }

  private getExtentForComponent(coin: CoinBody3D, component: number): number {
    const alignment = Math.abs(component);
    return (
      coin.halfThickness * alignment +
      coin.radius * Math.sqrt(Math.max(0, 1 - alignment * alignment))
    );
  }
}
