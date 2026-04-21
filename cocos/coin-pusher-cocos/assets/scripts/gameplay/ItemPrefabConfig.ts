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
    @property({ tooltip: 'Should match the logic-layer itemId used in GameManager.itemCatalog.' })
    public itemId = '';

    @property({ tooltip: 'Display name shown in HUD and unlock messages.' })
    public itemName = '';

    @property({ tooltip: 'How much resource this item restores after it is collected by DropZone.' })
    public value = 1;

    @property({ tooltip: 'Relative share used only by the world random-drop pool. Higher means more likely.' })
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
