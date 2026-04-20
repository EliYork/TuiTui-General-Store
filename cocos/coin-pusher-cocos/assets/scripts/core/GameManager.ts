import { _decorator, Component, director, Label, warn } from 'cc';
import { CoinBehaviour } from '../gameplay/CoinBehaviour';
import { CoinSpawner } from '../gameplay/CoinSpawner';

const { ccclass, property } = _decorator;
const ROUND_COIN_LIMIT = 300;
const NORMAL_COIN_SCORE = 1;

enum RoundState {
    Ready = 'Ready',
    Playing = 'Playing',
    NoCoins = 'NoCoins',
}

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

    private _state = RoundState.Ready;
    private _score = 0;
    private _droppedCoinCount = 0;
    private _spawnedCoinCount = 0;
    private _remainingCoinCount = ROUND_COIN_LIMIT;
    private _statusText = '\u51c6\u5907\u6295\u5e01';

    protected start(): void {
        this.resetRound();
    }

    public spawnCoinFromButton(): void {
        if (!this.coinSpawner) {
            warn('[GameManager] coinSpawner is not assigned.');
            this.setStatus('\u7f3a\u5c11 CoinSpawner \u5f15\u7528');
            return;
        }

        if (this._remainingCoinCount <= 0) {
            this._state = RoundState.NoCoins;
            this.setStatus('\u6ca1\u5e01\u4e86');
            return;
        }

        const spawnedCoin = this.coinSpawner.spawnCoin();
        if (!spawnedCoin) {
            this.setStatus('\u6295\u5e01\u5931\u8d25');
            return;
        }

        this._spawnedCoinCount += 1;
        this._remainingCoinCount -= 1;

        if (this._remainingCoinCount <= 0) {
            this._state = RoundState.NoCoins;
            this.setStatus('\u6295\u51fa\u6700\u540e 1 \u679a\uff0c\u6ca1\u5e01\u4e86');
            return;
        }

        this._state = RoundState.Playing;
        this.setStatus(`\u6295\u51fa\u7b2c ${this._spawnedCoinCount} \u679a`);
    }

    public resolveCoinDrop(coin: CoinBehaviour): void {
        if (!coin.tryMarkScored()) {
            return;
        }

        this._score += NORMAL_COIN_SCORE;
        this._droppedCoinCount += 1;
        this.setStatus(`\u7b2c ${coin.coinId} \u679a\u6389\u843d\uff0c\u79ef\u5206 +${NORMAL_COIN_SCORE}`);
        coin.onScored();
    }

    public restartGame(): void {
        const currentScene = director.getScene();
        if (!currentScene) {
            warn('[GameManager] restartGame failed: current scene is missing.');
            this.setStatus('\u91cd\u5f00\u5931\u8d25\uff1a\u5f53\u524d\u573a\u666f\u4e0d\u5b58\u5728');
            return;
        }

        director.loadScene(currentScene.name);
    }

    private resetRound(): void {
        this._state = RoundState.Ready;
        this._score = 0;
        this._droppedCoinCount = 0;
        this._spawnedCoinCount = 0;
        this._remainingCoinCount = ROUND_COIN_LIMIT;
        this._statusText = '\u51c6\u5907\u6295\u5e01';
        this.refreshUi();
    }

    private setStatus(statusText: string): void {
        this._statusText = statusText;
        this.refreshUi();
    }

    private refreshUi(): void {
        if (this.scoreLabel) {
            this.scoreLabel.string = `\u79ef\u5206: ${this._score}`;
        }

        if (this.dropCountLabel) {
            this.dropCountLabel.string = `\u6389\u843d: ${this._droppedCoinCount}`;
        }

        if (this.spawnCountLabel) {
            this.spawnCountLabel.string = `\u5df2\u6295: ${this._spawnedCoinCount} / \u5269\u4f59: ${this._remainingCoinCount}`;
        }

        if (this.statusLabel) {
            this.statusLabel.string = `${this.getStateText()} | ${this._statusText}`;
        }
    }

    private getStateText(): string {
        switch (this._state) {
        case RoundState.Playing:
            return '\u72b6\u6001: \u8fdb\u884c\u4e2d';
        case RoundState.NoCoins:
            return '\u72b6\u6001: \u6ca1\u5e01';
        case RoundState.Ready:
        default:
            return '\u72b6\u6001: \u51c6\u5907\u4e2d';
        }
    }
}
