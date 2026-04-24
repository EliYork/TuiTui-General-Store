import { _decorator, Component, Node, Prefab } from 'cc';

const { ccclass, property } = _decorator;

export interface ItemPrefabRuntimeConfig {
    itemId: string;
    itemName: string;
    value: number;
    weight: number;
}

@ccclass('ItemPrefabConfig')
export class ItemPrefabConfig extends Component {
    @property({
        displayName: '物品 ID',
        tooltip: '物品的逻辑 ID，需要和 GameManager.itemCatalog 中的 itemId 对应。不要使用中文 ID，避免按钮、解锁和存档匹配失败。',
    })
    public itemId = '';

    @property({
        displayName: '显示名称',
        tooltip: '玩家在 HUD、收集提示和解锁提示里看到的中文名称，例如“苹果”“香蕉”。只影响显示，不影响逻辑 ID。',
    })
    public itemName = '';

    @property({
        displayName: '结算资源',
        tooltip: '物体掉入结算区后回复的资源数量。数值越大，玩家通过掉落获得的资源越多。',
    })
    public value = 1;

    @property({
        displayName: '随机权重',
        tooltip: '世界随机掉落选择该物体的权重。权重越高出现概率越高；0 表示不会被随机掉落选中。',
    })
    public weight = 1;

    public toRuntimeConfig(fallbackItemId = '', fallbackItemName = ''): ItemPrefabRuntimeConfig {
        const resolvedItemId = normalizeText(this.itemId) || normalizeText(fallbackItemId) || this.node.name || 'item';
        const resolvedItemName = normalizeText(this.itemName) || normalizeText(fallbackItemName) || humanizeItemId(resolvedItemId);

        return {
            itemId: resolvedItemId,
            itemName: resolvedItemName,
            value: normalizeNonNegativeInteger(this.value, 1),
            weight: normalizeNonNegativeNumber(this.weight, 1),
        };
    }

    public static readFromNode(
        node: Node | null,
        fallbackItemId = '',
        fallbackItemName = '',
    ): ItemPrefabRuntimeConfig {
        const defaultItemId = normalizeText(fallbackItemId) || normalizeText(node?.name ?? '') || 'item';
        const defaultItemName = normalizeText(fallbackItemName) || humanizeItemId(defaultItemId);
        const config = node?.getComponent(ItemPrefabConfig) ?? null;

        if (!config) {
            return {
                itemId: defaultItemId,
                itemName: defaultItemName,
                value: 1,
                weight: 1,
            };
        }

        return config.toRuntimeConfig(defaultItemId, defaultItemName);
    }

    public static readFromPrefab(
        prefab: Prefab | null,
        fallbackItemId = '',
        fallbackItemName = '',
    ): ItemPrefabRuntimeConfig {
        return ItemPrefabConfig.readFromNode(prefab?.data as Node | null, fallbackItemId, fallbackItemName);
    }
}

function normalizeText(value: string): string {
    return (value || '').trim();
}

function humanizeItemId(itemId: string): string {
    const trimmed = normalizeText(itemId);
    if (!trimmed) {
        return 'Unnamed Item';
    }

    const spaced = trimmed
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/[_-]+/g, ' ');

    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function normalizeNonNegativeInteger(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, Math.round(value));
}

function normalizeNonNegativeNumber(value: number, fallback = 0): number {
    if (!Number.isFinite(value)) {
        return fallback;
    }

    return Math.max(0, value);
}
