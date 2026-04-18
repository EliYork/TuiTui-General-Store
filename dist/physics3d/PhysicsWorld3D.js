"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PhysicsWorld3D = void 0;
const math3d_1 = require("../core/render3d/math3d");
const math_1 = require("../utils/math");
const WORLD_UP = (0, math3d_1.vec3)(0, 1, 0);
class PhysicsWorld3D {
    constructor(config) {
        this.config = config;
        this.cabinet = this.config.threeD.cabinet;
        this.physics = this.config.physics3d;
    }
    updateCoins(coins, pusher, deltaSeconds) {
        const droppedItems = [];
        if (coins.length === 0) {
            return {
                droppedItems,
                totalReward: 0
            };
        }
        const stepCount = Math.max(1, Math.ceil(deltaSeconds / this.physics.maxStepSeconds));
        const stepDelta = deltaSeconds / stepCount;
        for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
            this.integrateCoins(coins, stepDelta);
            for (let iteration = 0; iteration < this.physics.solverIterations; iteration += 1) {
                this.resolveCoinSupports(coins, pusher, stepDelta);
                this.resolvePusherFrontFaceContacts(coins, pusher, stepDelta);
                this.resolveCoinPairs(coins, stepDelta);
                this.resolveBounds(coins, pusher);
            }
            this.resolveCoinSupports(coins, pusher, stepDelta);
            this.resolvePusherFrontFaceContacts(coins, pusher, stepDelta);
            this.resolveBounds(coins, pusher);
            this.collectDroppedCoins(coins, droppedItems);
        }
        return {
            droppedItems,
            totalReward: droppedItems.reduce((sum, item) => sum + item.rewardAmount, 0)
        };
    }
    integrateCoins(coins, deltaSeconds) {
        for (const coin of coins) {
            if (coin.isDropped) {
                continue;
            }
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
            const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
            const isSettling = wasGrounded &&
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
            coin.velocity.y = (0, math_1.clamp)(coin.velocity.y - this.physics.gravity * deltaSeconds, -this.physics.maxVerticalSpeed, this.physics.maxVerticalSpeed);
            coin.velocity.x = (0, math_1.clamp)(coin.velocity.x, -this.physics.maxHorizontalSpeed, this.physics.maxHorizontalSpeed);
            coin.velocity.z = (0, math_1.clamp)(coin.velocity.z, -this.physics.maxHorizontalSpeed, this.physics.maxHorizontalSpeed);
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
    integrateOrientation(coin, deltaSeconds) {
        const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
        if (angularSpeed <= 0.0001) {
            return;
        }
        const axis = (0, math3d_1.scaleVec3)(coin.angularVelocity, 1 / angularSpeed);
        const rotatedNormal = (0, math3d_1.rotateVec3AroundAxis)(coin.normal, axis, angularSpeed * deltaSeconds);
        const normalizedNormal = (0, math3d_1.normalizeVec3)(rotatedNormal);
        coin.normal.x = normalizedNormal.x;
        coin.normal.y = normalizedNormal.y;
        coin.normal.z = normalizedNormal.z;
    }
    resolveCoinSupports(coins, pusher, deltaSeconds) {
        for (const coin of coins) {
            if (coin.isDropped) {
                continue;
            }
            const support = this.getSupportPlane(coin, pusher);
            const minCenterY = support.height + this.getVerticalExtent(coin);
            const supportContactSlop = 0.5;
            if (coin.isSleeping &&
                (coin.position.y > minCenterY + 0.75 ||
                    Math.abs(support.surfaceVelocityZ) > this.physics.sleepLinearSpeed * 0.35)) {
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
            const horizontalBlend = 1 - Math.exp(-this.physics.groundFriction * deltaSeconds);
            coin.velocity.x = (0, math_1.lerp)(coin.velocity.x, support.surfaceVelocityX, horizontalBlend);
            const surfaceFriction = this.getSupportSurfaceFriction(support);
            const depthBlend = 1 - Math.exp(-surfaceFriction * deltaSeconds);
            coin.velocity.z = (0, math_1.lerp)(coin.velocity.z, support.surfaceVelocityZ, depthBlend);
            this.applyContactStabilization(coin, support, deltaSeconds);
            if (this.updateSleepState(coin, support, deltaSeconds)) {
                continue;
            }
            this.applyGroundTiltForces(coin, support, deltaSeconds);
            this.limitAngularSpeed(coin);
        }
    }
    applyGroundTiltForces(coin, support, deltaSeconds) {
        const normal = this.getDisplayNormal(coin);
        const tilt = (0, math_1.clamp)(1 - normal.y, 0, 1);
        if (tilt <= 0.08) {
            return;
        }
        const horizontalSpeed = Math.hypot(coin.velocity.x - support.surfaceVelocityX, coin.velocity.z - support.surfaceVelocityZ);
        const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
        const forceScale = (0, math_1.clamp)((tilt - 0.16) / 0.46, 0, 1);
        if (forceScale <= 0) {
            return;
        }
        if (horizontalSpeed < this.physics.sleepLinearSpeed * 0.95 &&
            angularSpeed < this.physics.sleepAngularSpeed * 1.6) {
            return;
        }
        const settleAxis = (0, math3d_1.crossVec3)(normal, WORLD_UP);
        const settleAxisLength = (0, math3d_1.lengthVec3)(settleAxis);
        if (settleAxisLength > 0.0001) {
            const settleTorque = (0, math3d_1.scaleVec3)(settleAxis, (this.physics.settlingTorque * forceScale * deltaSeconds) /
                settleAxisLength);
            coin.angularVelocity.x += settleTorque.x;
            coin.angularVelocity.y += settleTorque.y;
            coin.angularVelocity.z += settleTorque.z;
        }
        const rollDirectionLength = Math.hypot(normal.x, normal.z);
        if (rollDirectionLength > 0.0001) {
            const rollDirection = (0, math3d_1.vec3)(normal.x / rollDirectionLength, 0, normal.z / rollDirectionLength);
            const rollAcceleration = this.physics.rollAcceleration * forceScale;
            coin.velocity.x += rollDirection.x * rollAcceleration * deltaSeconds;
            coin.velocity.z += rollDirection.z * rollAcceleration * deltaSeconds;
        }
        if (support.surfaceVelocityZ !== 0) {
            coin.angularVelocity.x +=
                -support.surfaceVelocityZ * 0.014 * tilt * deltaSeconds;
        }
    }
    getSupportPlane(coin, pusher) {
        const frontReachZ = coin.position.z - this.getDepthExtent(coin);
        const upperPlatformHeight = frontReachZ >=
            this.cabinet.platformFrontZ - coin.radius * this.physics.platformEdgeSlack
            ? 0
            : -this.cabinet.dropWellDepth;
        const support = {
            height: upperPlatformHeight,
            surfaceVelocityX: 0,
            surfaceVelocityZ: 0,
            kind: "base"
        };
        if (!this.isOnVisiblePusherSurface(coin, pusher)) {
            if (!this.isOnHiddenRearSupportSurface(coin, pusher) ||
                !this.canRideElevatedSupport(coin, pusher.topY)) {
                return support;
            }
            return {
                height: Math.max(support.height, pusher.topY),
                surfaceVelocityX: 0,
                surfaceVelocityZ: this.getPusherCarryVelocity(coin, pusher, "hidden"),
                kind: "hidden"
            };
        }
        if (!this.canRideElevatedSupport(coin, pusher.topY)) {
            return support;
        }
        return {
            height: Math.max(support.height, pusher.topY),
            surfaceVelocityX: 0,
            surfaceVelocityZ: this.getPusherCarryVelocity(coin, pusher, "pusher"),
            kind: "pusher"
        };
    }
    canRideElevatedSupport(coin, supportHeight) {
        const verticalExtent = this.getVerticalExtent(coin);
        const coinTopY = coin.position.y + verticalExtent;
        return coinTopY >= supportHeight - coin.thickness * 0.35;
    }
    isOnVisiblePusherSurface(coin, pusher) {
        const sideExtent = this.getSideExtent(coin);
        const depthExtent = this.getDepthExtent(coin);
        const frontRetention = this.getSupportFrontRetention(coin, pusher);
        const withinX = Math.abs(coin.position.x) <=
            pusher.width / 2 + sideExtent * this.physics.pusherCaptureSlack;
        const withinZ = coin.position.z + depthExtent * this.physics.pusherCaptureSlack >=
            pusher.frontZ - frontRetention &&
            coin.position.z - depthExtent <= pusher.backZ;
        return withinX && withinZ;
    }
    isOnHiddenRearSupportSurface(coin, pusher) {
        if (pusher.hiddenSupportBackZ <= pusher.hiddenSupportFrontZ + 0.5) {
            return false;
        }
        const sideExtent = this.getSideExtent(coin);
        const depthExtent = this.getDepthExtent(coin);
        const frontRetention = this.getSupportFrontRetention(coin, pusher);
        const withinX = Math.abs(coin.position.x) <=
            pusher.hiddenSupportWidth / 2 + sideExtent * 0.22;
        const withinZ = coin.position.z + depthExtent * this.physics.pusherCaptureSlack >=
            pusher.hiddenSupportFrontZ - frontRetention &&
            coin.position.z - depthExtent <= pusher.hiddenSupportBackZ;
        return withinX && withinZ;
    }
    getSupportSurfaceFriction(support) {
        switch (support.kind) {
            case "pusher":
                return this.physics.pusherCarry;
            case "hidden":
                return this.physics.pusherCarry * 0.84;
            case "stack":
                return this.physics.stackFriction;
            default:
                return this.physics.groundFriction;
        }
    }
    getPusherCarryVelocity(coin, pusher, supportKind) {
        if (pusher.velocityZ === 0) {
            return 0;
        }
        const baseCarryFactor = supportKind === "pusher"
            ? pusher.velocityZ < 0
                ? 0.72
                : 0.58
            : pusher.velocityZ < 0
                ? 0.54
                : 0.42;
        const edgeCarryFactor = this.getSupportEdgeCarryFactor(coin, pusher, supportKind);
        return pusher.velocityZ * baseCarryFactor * edgeCarryFactor;
    }
    getSupportEdgeCarryFactor(coin, pusher, supportKind) {
        const sideExtent = this.getSideExtent(coin);
        const depthExtent = this.getDepthExtent(coin);
        const halfWidth = supportKind === "pusher"
            ? pusher.width / 2
            : pusher.hiddenSupportWidth / 2;
        const frontRetention = this.getSupportFrontRetention(coin, pusher);
        const frontZ = (supportKind === "pusher" ? pusher.frontZ : pusher.hiddenSupportFrontZ) -
            frontRetention;
        const backZ = supportKind === "pusher" ? pusher.backZ : pusher.hiddenSupportBackZ;
        const sideMargin = halfWidth - Math.abs(coin.position.x) + sideExtent;
        const frontMargin = coin.position.z + depthExtent - frontZ;
        const backMargin = backZ - (coin.position.z - depthExtent);
        const contactMargin = Math.min(sideMargin, frontMargin, backMargin);
        return (0, math_1.clamp)(contactMargin / Math.max(1, coin.radius * 0.9), 0, 1);
    }
    getSupportFrontRetention(coin, pusher) {
        if (pusher.velocityZ <= 0) {
            return coin.radius * 0.12;
        }
        return coin.radius * 0.46;
    }
    applyContactStabilization(coin, support, deltaSeconds) {
        const relativeLinearSpeed = Math.hypot(coin.velocity.x - support.surfaceVelocityX, coin.velocity.z - support.surfaceVelocityZ);
        const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
        const isSettling = relativeLinearSpeed < this.physics.sleepLinearSpeed * 1.4 &&
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
        const angularFactor = Math.exp(-this.physics.settledAngularDamping * deltaSeconds);
        coin.angularVelocity.x *= angularFactor;
        coin.angularVelocity.y *= angularFactor;
        coin.angularVelocity.z *= angularFactor;
        if (support.kind !== "stack") {
            this.flattenCoinOnFlatSupport(coin, deltaSeconds, relativeLinearSpeed, angularSpeed);
        }
        this.clampSettledMotion(coin);
    }
    flattenCoinOnFlatSupport(coin, deltaSeconds, relativeLinearSpeed, angularSpeed) {
        const normal = this.getDisplayNormal(coin);
        const tilt = (0, math_1.clamp)(1 - normal.y, 0, 1);
        if (tilt <= 0.012) {
            return;
        }
        const settlingBlend = relativeLinearSpeed < this.physics.sleepLinearSpeed * 1.15 &&
            angularSpeed < this.physics.sleepAngularSpeed * 1.5
            ? 1 - Math.exp(-14 * deltaSeconds)
            : 1 - Math.exp(-7 * deltaSeconds);
        const flattenedNormal = (0, math3d_1.normalizeVec3)((0, math3d_1.addVec3)((0, math3d_1.scaleVec3)(normal, 1 - settlingBlend), (0, math3d_1.scaleVec3)(WORLD_UP, settlingBlend)));
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
    resolveCoinPairs(coins, deltaSeconds) {
        for (let index = 0; index < coins.length; index += 1) {
            const coinA = coins[index];
            if (coinA.isDropped) {
                continue;
            }
            for (let otherIndex = index + 1; otherIndex < coins.length; otherIndex += 1) {
                const coinB = coins[otherIndex];
                if (coinB.isDropped) {
                    continue;
                }
                const deltaX = coinB.position.x - coinA.position.x;
                const deltaZ = coinB.position.z - coinA.position.z;
                const radiusSum = coinA.radius + coinB.radius;
                const horizontalDistanceSquared = deltaX * deltaX + deltaZ * deltaZ;
                if (horizontalDistanceSquared >= radiusSum * radiusSum) {
                    continue;
                }
                const deltaY = coinB.position.y - coinA.position.y;
                const verticalOverlap = this.getVerticalExtent(coinA) +
                    this.getVerticalExtent(coinB) -
                    Math.abs(deltaY);
                if (verticalOverlap <= 0) {
                    continue;
                }
                const horizontalDistance = Math.sqrt(Math.max(horizontalDistanceSquared, 0.0001));
                const horizontalOverlap = radiusSum - horizontalDistance;
                if (verticalOverlap < horizontalOverlap * 0.9) {
                    this.resolveVerticalPair(coinA, coinB, deltaX, deltaZ, deltaY, verticalOverlap, deltaSeconds);
                    continue;
                }
                this.resolveHorizontalPair(coinA, coinB, deltaX, deltaZ, horizontalDistance, horizontalOverlap);
            }
        }
    }
    resolveVerticalPair(coinA, coinB, deltaX, deltaZ, deltaY, overlap, deltaSeconds) {
        const relativeSpeed = Math.hypot(coinA.velocity.x - coinB.velocity.x, coinA.velocity.y - coinB.velocity.y, coinA.velocity.z - coinB.velocity.z);
        const impactScale = this.getPairImpactScale(overlap, relativeSpeed);
        if (impactScale > 0) {
            this.wakeCoin(coinA);
            this.wakeCoin(coinB);
        }
        const upperCoin = deltaY >= 0 ? coinB : coinA;
        const lowerCoin = deltaY >= 0 ? coinA : coinB;
        const lowerAnchored = lowerCoin.isGrounded || lowerCoin.isSleeping || lowerCoin.velocity.y <= 0;
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
        upperCoin.velocity.x = (0, math_1.lerp)(upperCoin.velocity.x, lowerCoin.velocity.x, stackBlend * 0.7);
        upperCoin.velocity.z = (0, math_1.lerp)(upperCoin.velocity.z, lowerCoin.velocity.z, stackBlend * 0.7);
        if (lowerAnchored) {
            const stackSupport = {
                height: lowerCoin.position.y +
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
            const tipAxis = (0, math3d_1.vec3)(-deltaZ / offsetLength, 0, deltaX / offsetLength);
            this.addAngularKick(upperCoin, tipAxis, this.physics.collisionAngularKick * 0.85 * impactScale);
        }
    }
    resolveHorizontalPair(coinA, coinB, deltaX, deltaZ, horizontalDistance, overlap) {
        let normalX = deltaX / horizontalDistance;
        let normalZ = deltaZ / horizontalDistance;
        if (!Number.isFinite(normalX) || !Number.isFinite(normalZ)) {
            const fallbackAngle = (((coinA.id * 17 + coinB.id * 31) % 360) * Math.PI) / 180;
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
        const separatingSpeed = relativeVelocityX * normalX + relativeVelocityZ * normalZ;
        if (separatingSpeed < 0) {
            const impulse = -separatingSpeed * this.physics.collisionBounce;
            const impulseX = normalX * impulse;
            const impulseZ = normalZ * impulse;
            coinA.velocity.x -= impulseX;
            coinA.velocity.z -= impulseZ;
            coinB.velocity.x += impulseX;
            coinB.velocity.z += impulseZ;
        }
        const tipAxis = (0, math3d_1.vec3)(-normalZ, 0, normalX);
        if (impactScale > 0) {
            this.addAngularKick(coinA, tipAxis, -this.physics.collisionAngularKick * 0.42 * impactScale);
            this.addAngularKick(coinB, tipAxis, this.physics.collisionAngularKick * 0.42 * impactScale);
        }
    }
    resolveBounds(coins, pusher) {
        for (const coin of coins) {
            if (coin.isDropped) {
                continue;
            }
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
                this.addAngularKick(coin, (0, math3d_1.vec3)(0, 0, 1), this.physics.collisionAngularKick * 0.56);
            }
            if (coin.position.x > maxX) {
                this.wakeCoin(coin);
                coin.position.x = maxX;
                coin.velocity.x = -Math.abs(coin.velocity.x) * this.physics.wallBounce;
                this.addAngularKick(coin, (0, math3d_1.vec3)(0, 0, -1), this.physics.collisionAngularKick * 0.56);
            }
            if (coin.position.z < minZ) {
                this.wakeCoin(coin);
                coin.position.z = minZ;
                coin.velocity.z = Math.abs(coin.velocity.z) * this.physics.wallBounce;
                this.addAngularKick(coin, (0, math3d_1.vec3)(1, 0, 0), this.physics.collisionAngularKick * 0.4);
            }
            if (coin.position.z > maxZ) {
                this.wakeCoin(coin);
                coin.position.z = maxZ;
                coin.velocity.z = -Math.abs(coin.velocity.z) * this.physics.wallBounce;
                this.addAngularKick(coin, (0, math3d_1.vec3)(-1, 0, 0), this.physics.collisionAngularKick * 0.4);
            }
        }
    }
    resolvePusherFrontFaceContacts(coins, pusher, deltaSeconds) {
        if (pusher.velocityZ >= 0) {
            return;
        }
        for (const coin of coins) {
            if (coin.isDropped) {
                continue;
            }
            const sideExtent = this.getSideExtent(coin);
            const depthExtent = this.getDepthExtent(coin);
            const verticalExtent = this.getVerticalExtent(coin);
            const bottomY = coin.position.y - verticalExtent;
            const topY = coin.position.y + verticalExtent;
            const withinX = Math.abs(coin.position.x) <= pusher.width / 2 + sideExtent;
            const overlapsVertical = bottomY < pusher.topY - 0.5 && topY > pusher.baseY + 0.5;
            const overlapsFrontFace = coin.position.z < pusher.frontZ &&
                coin.position.z + depthExtent > pusher.frontZ;
            const alreadyAboveTop = bottomY >= pusher.topY - coin.thickness * 0.35;
            if (!withinX ||
                !overlapsVertical ||
                !overlapsFrontFace ||
                alreadyAboveTop) {
                continue;
            }
            this.wakeCoin(coin);
            coin.position.z = pusher.frontZ - depthExtent - 0.01;
            coin.velocity.z = (0, math_1.lerp)(coin.velocity.z, pusher.velocityZ, 0.82);
            coin.velocity.y = Math.min(coin.velocity.y, 0);
            const compression = (0, math_1.clamp)((coin.position.y - pusher.baseY) / Math.max(1, pusher.height), 0, 1);
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
    collectDroppedCoins(coins, droppedItems) {
        for (const coin of coins) {
            if (coin.isDropped || !this.shouldResolveFrontDrop(coin)) {
                continue;
            }
            coin.markDropped();
            droppedItems.push(coin.buildDropResult());
        }
    }
    shouldResolveFrontDrop(coin) {
        const depthExtent = this.getDepthExtent(coin);
        const frontReachZ = coin.position.z - depthExtent;
        const hasCrossedFrontEdge = frontReachZ <=
            this.cabinet.platformFrontZ + this.physics.frontDropTriggerSlack;
        if (!hasCrossedFrontEdge) {
            return false;
        }
        const hasDescendedIntoDropZone = coin.position.y <= -this.physics.frontDropResolveDepth;
        const hasReachedCollectorFront = coin.position.z <=
            this.physics.frontWallZ + depthExtent + this.physics.frontDropTriggerSlack;
        return hasDescendedIntoDropZone || hasReachedCollectorFront;
    }
    getRearBoundZ(coin, pusher, depthExtent) {
        const visibleRearBoundZ = this.cabinet.depth - depthExtent;
        const hiddenRearBoundZ = pusher.hiddenSupportBackZ - depthExtent;
        const sideExtent = this.getSideExtent(coin);
        const withinVisiblePusherLane = Math.abs(coin.position.x) <= pusher.width / 2 + sideExtent &&
            coin.position.z >= pusher.frontZ - depthExtent &&
            coin.position.z <= pusher.backZ + depthExtent;
        const withinRearSupportLane = Math.abs(coin.position.x) <= pusher.hiddenSupportWidth / 2 + sideExtent &&
            coin.position.z >= pusher.hiddenSupportFrontZ - depthExtent;
        return withinVisiblePusherLane || withinRearSupportLane
            ? Math.max(visibleRearBoundZ, hiddenRearBoundZ)
            : visibleRearBoundZ;
    }
    addAngularKick(coin, axis, strength) {
        coin.angularVelocity.x += axis.x * strength;
        coin.angularVelocity.y += axis.y * strength;
        coin.angularVelocity.z += axis.z * strength;
        this.limitAngularSpeed(coin);
    }
    limitAngularSpeed(coin) {
        const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
        if (angularSpeed <= this.physics.maxAngularSpeed || angularSpeed === 0) {
            return;
        }
        const scale = this.physics.maxAngularSpeed / angularSpeed;
        coin.angularVelocity.x *= scale;
        coin.angularVelocity.y *= scale;
        coin.angularVelocity.z *= scale;
    }
    updateSleepState(coin, support, deltaSeconds) {
        if (!coin.isGrounded) {
            this.wakeCoin(coin);
            return false;
        }
        if (Math.abs(support.surfaceVelocityZ) > this.physics.sleepLinearSpeed * 0.35) {
            this.wakeCoin(coin);
            return false;
        }
        const linearSpeed = Math.hypot(coin.velocity.x - support.surfaceVelocityX, coin.velocity.y, coin.velocity.z - support.surfaceVelocityZ);
        const angularSpeed = (0, math3d_1.lengthVec3)(coin.angularVelocity);
        if (support.kind !== "stack" && this.getDisplayNormal(coin).y < 0.94) {
            this.wakeCoin(coin);
            return false;
        }
        if (linearSpeed > this.physics.sleepLinearSpeed ||
            angularSpeed > this.physics.sleepAngularSpeed) {
            this.wakeCoin(coin);
            return false;
        }
        const deeplySettled = linearSpeed < this.physics.sleepLinearSpeed * 0.4 &&
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
    wakeCoin(coin) {
        coin.isSleeping = false;
        coin.sleepTimer = 0;
    }
    clampSettledMotion(coin) {
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
    getPairImpactScale(overlap, relativeSpeed) {
        if (overlap < this.physics.pairWakeOverlap &&
            relativeSpeed < this.physics.pairWakeSpeed) {
            return 0;
        }
        const speedScale = (0, math_1.clamp)(relativeSpeed / (this.physics.pairWakeSpeed * 2.2), 0, 1);
        const overlapScale = (0, math_1.clamp)(overlap / (this.physics.pairWakeOverlap * 2.2), 0, 1);
        return Math.max(speedScale, overlapScale);
    }
    getDisplayNormal(coin) {
        return coin.normal.y >= 0 ? coin.normal : (0, math3d_1.scaleVec3)(coin.normal, -1);
    }
    getVerticalExtent(coin) {
        return this.getExtentForComponent(coin, this.getDisplayNormal(coin).y);
    }
    getSideExtent(coin) {
        return this.getExtentForComponent(coin, this.getDisplayNormal(coin).x);
    }
    getDepthExtent(coin) {
        return this.getExtentForComponent(coin, this.getDisplayNormal(coin).z);
    }
    getExtentForComponent(coin, component) {
        const alignment = Math.abs(component);
        return (coin.halfThickness * alignment +
            coin.radius * Math.sqrt(Math.max(0, 1 - alignment * alignment)));
    }
}
exports.PhysicsWorld3D = PhysicsWorld3D;
