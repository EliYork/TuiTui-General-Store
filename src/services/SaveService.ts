import { GameStateSnapshot } from "../core/GameState";

export function saveGame(snapshot: GameStateSnapshot): void {
  void snapshot;
  // 阶段一先预留，第二阶段可替换为 wx.setStorageSync。
}

export function loadGame(): Partial<GameStateSnapshot> | null {
  // 阶段一先返回空数据，保留后续接入本地存档的位置。
  return null;
}
