import { _decorator, AudioClip, AudioSource, Component, warn } from 'cc';

const { ccclass, property } = _decorator;

export type GameSoundId =
    | 'coin-drop'
    | 'item-drop'
    | 'button-click'
    | 'unlock'
    | 'error';

interface GameSoundSlot {
    id: GameSoundId;
    propertyName: 'coinDropClip' | 'itemDropClip' | 'buttonClickClip' | 'unlockClip' | 'errorClip';
    recommendedFileName: string;
    maxDurationSeconds: number;
    maxFileSizeKb: number;
    usage: string;
}

export const GAME_SOUND_SLOTS: readonly GameSoundSlot[] = [
    {
        id: 'coin-drop',
        propertyName: 'coinDropClip',
        recommendedFileName: 'coin-drop.mp3',
        maxDurationSeconds: 0.25,
        maxFileSizeKb: 40,
        usage: '玩家主动投放物体成功生成时播放。',
    },
    {
        id: 'item-drop',
        propertyName: 'itemDropClip',
        recommendedFileName: 'item-drop.mp3',
        maxDurationSeconds: 0.35,
        maxFileSizeKb: 50,
        usage: '物体进入结算区、随机掉落生成等普通奖励反馈时播放。',
    },
    {
        id: 'button-click',
        propertyName: 'buttonClickClip',
        recommendedFileName: 'button-click.mp3',
        maxDurationSeconds: 0.2,
        maxFileSizeKb: 30,
        usage: '按钮点击、重新开始等轻量 UI 操作时播放。',
    },
    {
        id: 'unlock',
        propertyName: 'unlockClip',
        recommendedFileName: 'unlock.mp3',
        maxDurationSeconds: 0.6,
        maxFileSizeKb: 80,
        usage: '解锁新可投放物品时播放。',
    },
    {
        id: 'error',
        propertyName: 'errorClip',
        recommendedFileName: 'error.mp3',
        maxDurationSeconds: 0.25,
        maxFileSizeKb: 40,
        usage: '资源不足、未解锁、缺少配置等失败反馈时播放。',
    },
];

@ccclass('AudioService')
export class AudioService extends Component {
    private static _instance: AudioService | null = null;

    @property({
        type: AudioSource,
        displayName: '音频播放器',
        tooltip: '用于播放短音效的 AudioSource。可以手动拖本节点上的 AudioSource；为空时运行时会自动复用或创建一个，不需要在场景文件里预先绑定。',
    })
    public audioSource: AudioSource | null = null;

    @property({
        displayName: '启用音效',
        tooltip: '总开关。关闭后所有音效调用都会静默跳过，适合临时禁用或排查问题。',
    })
    public soundEnabled = true;

    @property({
        displayName: '音效音量',
        tooltip: '所有短音效的统一音量，范围建议 0 到 1。数值越大越响，太大可能刺耳或削波。',
        min: 0,
        max: 1,
    })
    public effectVolume = 0.8;

    @property({
        type: AudioClip,
        displayName: '投放音效',
        tooltip: '玩家主动投放物体成功生成时播放。建议文件名 coin-drop.mp3，时长 0.10-0.25 秒，单声道 mp3。',
    })
    public coinDropClip: AudioClip | null = null;

    @property({
        type: AudioClip,
        displayName: '物品掉落音效',
        tooltip: '物体进入结算区、随机掉落生成等普通奖励反馈时播放。建议文件名 item-drop.mp3，时长 0.15-0.35 秒。',
    })
    public itemDropClip: AudioClip | null = null;

    @property({
        type: AudioClip,
        displayName: '按钮点击音效',
        tooltip: '按钮点击、重新开始等轻量 UI 操作时播放。建议文件名 button-click.mp3，时长 0.05-0.20 秒，声音不要太尖。',
    })
    public buttonClickClip: AudioClip | null = null;

    @property({
        type: AudioClip,
        displayName: '解锁音效',
        tooltip: '解锁新可投放物品时播放。建议文件名 unlock.mp3，时长 0.25-0.60 秒，音量应比普通反馈略明显但不要刺耳。',
    })
    public unlockClip: AudioClip | null = null;

    @property({
        type: AudioClip,
        displayName: '错误音效',
        tooltip: '资源不足、未解锁、缺少配置等失败反馈时播放。建议文件名 error.mp3，时长 0.10-0.25 秒，尽量柔和。',
    })
    public errorClip: AudioClip | null = null;

    protected onLoad(): void {
        AudioService._instance = this;
        this.audioSource = this.audioSource ?? this.getComponent(AudioSource) ?? this.node.addComponent(AudioSource);
    }

    protected onDestroy(): void {
        if (AudioService._instance === this) {
            AudioService._instance = null;
        }
    }

    public static getInstance(): AudioService | null {
        return AudioService._instance;
    }

    public static play(soundId: GameSoundId): void {
        AudioService._instance?.play(soundId);
    }

    public play(soundId: GameSoundId): void {
        if (!this.soundEnabled) {
            return;
        }

        const clip = this.getClip(soundId);
        if (!clip) {
            return;
        }

        const source = this.audioSource ?? this.getComponent(AudioSource);
        if (!source) {
            warn('[AudioService] AudioSource is missing.');
            return;
        }

        source.playOneShot(clip, this.getSafeVolume());
    }

    private getClip(soundId: GameSoundId): AudioClip | null {
        switch (soundId) {
        case 'coin-drop':
            return this.coinDropClip;
        case 'item-drop':
            return this.itemDropClip;
        case 'button-click':
            return this.buttonClickClip;
        case 'unlock':
            return this.unlockClip;
        case 'error':
            return this.errorClip;
        default:
            return null;
        }
    }

    private getSafeVolume(): number {
        if (!Number.isFinite(this.effectVolume)) {
            return 0.8;
        }

        return Math.max(0, Math.min(1, this.effectVolume));
    }
}

export function playGameSound(audioService: AudioService | null | undefined, name: GameSoundId): void {
    (audioService ?? AudioService.getInstance())?.play(name);
}
