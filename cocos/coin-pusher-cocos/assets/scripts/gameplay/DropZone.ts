import { _decorator, BoxCollider, Component, ITriggerEvent, Node, warn } from 'cc';
import { GameManager } from '../core/GameManager';
import { CoinBehaviour } from './CoinBehaviour';

const { ccclass, property } = _decorator;

@ccclass('DropZone')
export class DropZone extends Component {
    @property(GameManager)
    public gameManager: GameManager | null = null;

    private _collider: BoxCollider | null = null;

    protected onLoad(): void {
        this._collider = this.getComponent(BoxCollider);
        if (!this._collider) {
            warn('[DropZone] BoxCollider is required.');
        }
    }

    protected onEnable(): void {
        this._collider?.on('onTriggerEnter', this.onTriggerEvent, this);
        this._collider?.on('onTriggerStay', this.onTriggerEvent, this);
    }

    protected onDisable(): void {
        this._collider?.off('onTriggerEnter', this.onTriggerEvent, this);
        this._collider?.off('onTriggerStay', this.onTriggerEvent, this);
    }

    private onTriggerEvent(event: ITriggerEvent): void {
        if (!this.gameManager) {
            warn('[DropZone] gameManager is not assigned.');
            return;
        }

        const coin = this.findCoin(event.otherCollider.node);
        if (!coin) {
            return;
        }

        this.gameManager.resolveCoinDrop(coin);
    }

    private findCoin(startNode: Node | null): CoinBehaviour | null {
        let current = startNode;
        while (current) {
            const coin = current.getComponent(CoinBehaviour);
            if (coin) {
                return coin;
            }
            current = current.parent;
        }
        return null;
    }
}