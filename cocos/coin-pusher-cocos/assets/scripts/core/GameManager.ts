import { _decorator, Component, Label, warn } from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner } from '../gameplay/CoinSpawner';

const { ccclass, property } = _decorator;

@ccclass('GameManager')
export class GameManager extends Component {
    @property(CoinSpawner)
    public coinSpawner: CoinSpawner | null = null;

    @property(Label)
    public scoreLabel: Label | null = null;

    @property(Label)
    public dropCountLabel: Label | null = null;

    @property(Label)
    public spawnCountLabel: Label | null = null;

    @property(Label)
    public statusLabel: Label | null = null;

    private _score = 0;
    private _droppedCoinCount = 0;
    private _spawnedCoinCount = 0;

    protected start(): void {
        this.refreshUi('Ready to spawn coins');
    }

    public spawnCoinFromButton(): void {
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.refreshUi('Missing CoinSpawner reference');
            return;
        }

        const spawnedCoin = this.coinSpawner.spawnCoin();
        if (!spawnedCoin) {
            this.refreshUi('Spawn failed');
            return;
        }

        this._spawnedCoinCount += 1;
        this.refreshUi(`Spawned coin #${this._spawnedCoinCount}`);
    }

    public resolveCoinDrop(coin: CoinBehaviour): void {
        if (!coin.tryMarkScored()) {
            return;
        }

        this._score += coin.coinValue;
        this._droppedCoinCount += 1;
        this.refreshUi(`Coin #${coin.coinId} +${coin.coinValue}`);
        coin.onScored();
    }

    private refreshUi(statusText?: string): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `Score: ${this._score}`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `Drops: ${this._droppedCoinCount}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `Spawned: ${this._spawnedCoinCount}`;
        }

        if (this.statusLabel && statusText) {
            this.statusLabel.string = statusText;
        }
    }
}
