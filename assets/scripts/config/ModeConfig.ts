import { _decorator, Component } from 'cc';
import { BusinessModeConfig } from '../business/BusinessModeConfig';
import { CollectionModeConfig } from './CollectionModeConfig';
import { ModeBaseConfig } from './ModeBaseConfig';
import { SpawnConfig } from './SpawnConfig';
import {
    createDefaultNormalizedStallDetectionConfig,
    NormalizedBusinessStallDetectionConfig,
} from '../modes/business/StallDetectionConfig';

const { ccclass, property } = _decorator;

@ccclass('ModeConfig')
export class ModeConfig extends Component {
    @property({
        type: ModeBaseConfig,
        displayName: '基础模式参数',
        tooltip: '模式身份和模式开关，例如模式 ID、显示名、是否使用经营进货单。',
    })
    public baseConfig: ModeBaseConfig | null = null;

    @property({
        type: SpawnConfig,
        displayName: '投放参数',
        tooltip: '手动投放、长按投放、自动投放、随机掉落、资源回复和每日投放额度配置。',
    })
    public spawnConfig: SpawnConfig | null = null;

    @property({
        type: BusinessModeConfig,
        displayName: '经营模式参数',
        tooltip: '经营模式目标、资金、物品计分和基础收益规则。商店商品仍在 ShopConfig 中配置。',
    })
    public businessConfig: BusinessModeConfig | null = null;

    @property({
        type: CollectionModeConfig,
        displayName: '图鉴模式参数',
        tooltip: '图鉴模式专属参数入口。当前仅保存图鉴模式的身份信息。',
    })
    public collectionConfig: CollectionModeConfig | null = null;

    public getModeId(): string {
        return this.baseConfig?.getModeId()
            ?? normalizeText(this.collectionConfig?.modeId, 'business');
    }

    public getDisplayName(): string {
        return this.baseConfig?.getDisplayName()
            ?? normalizeText(this.collectionConfig?.displayName, this.getModeId());
    }

    public getRequiresStartButton(): boolean {
        return this.baseConfig?.requiresStartButton ?? false;
    }

    public getUseBusinessOrders(): boolean {
        return this.baseConfig?.useBusinessOrders ?? false;
    }

    public getUseLegacyCurrentSpawnItem(): boolean {
        return this.baseConfig?.useLegacyCurrentSpawnItem ?? true;
    }

    public getSpendLegacyResourceOnSpawn(): boolean {
        return this.baseConfig?.spendLegacyResourceOnSpawn ?? true;
    }

    public getAllowManualSpawn(): boolean {
        return this.spawnConfig?.allowManualSpawn ?? true;
    }

    public getInitialSpawnResource(): number {
        return this.spawnConfig?.initialSpawnResource ?? 300;
    }

    public getDailySpawnQuota(): number {
        return this.spawnConfig?.dailySpawnQuota ?? this.getInitialSpawnResource();
    }

    public getManualSpawnCost(): number {
        return this.spawnConfig?.manualSpawnCost ?? 1;
    }

    public getOverrideManualSpawnY(): boolean {
        return this.spawnConfig?.overrideManualSpawnY ?? true;
    }

    public getManualSpawnY(): number {
        return this.spawnConfig?.manualSpawnY ?? 1;
    }

    public getHoldSpawnInterval(): number {
        return this.spawnConfig?.holdSpawnInterval ?? 0.05;
    }

    public getEnableAutoSpawn(): boolean {
        return this.spawnConfig?.enableAutoSpawn ?? false;
    }

    public getAutoSpawnInterval(): number {
        return this.spawnConfig?.autoSpawnInterval ?? 0.5;
    }

    public getAutoSpawnX(): number {
        return this.spawnConfig?.autoSpawnX ?? 0;
    }

    public getAutoSpawnZ(): number {
        return this.spawnConfig?.autoSpawnZ ?? -0.2;
    }

    public getEnableRandomDrop(): boolean {
        return this.spawnConfig?.enableRandomDrop ?? false;
    }

    public getRandomDropInterval(): number {
        return this.spawnConfig?.randomDropInterval ?? 5;
    }

    public getRandomDropBatchCount(): number {
        return this.spawnConfig?.randomDropBatchCount ?? 1;
    }

    public getResourceRegenCap(): number {
        return this.spawnConfig?.resourceRegenCap ?? 300;
    }

    public getResourceRegenInterval(): number {
        return this.spawnConfig?.resourceRegenInterval ?? 5;
    }

    public getResourceRegenAmount(): number {
        return this.spawnConfig?.resourceRegenAmount ?? 1;
    }

    public getFirstDayTargetScore(): number {
        return this.businessConfig?.getFirstDayTargetScore() ?? 20;
    }

    public getDailyTargetScoreGrowth(): number {
        return this.businessConfig?.getDailyTargetScoreGrowth() ?? 0;
    }

    public getStallDetectionConfig(): NormalizedBusinessStallDetectionConfig {
        return this.businessConfig?.getStallDetectionConfig() ?? createDefaultNormalizedStallDetectionConfig();
    }
}

function normalizeText(value: string | undefined, fallback: string): string {
    const trimmed = (value || '').trim();
    return trimmed.length > 0 ? trimmed : fallback;
}
