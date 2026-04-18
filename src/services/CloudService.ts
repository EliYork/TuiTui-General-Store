import { GameStateSnapshot } from "../core/GameState";

export function syncToCloud(snapshot?: Partial<GameStateSnapshot>): void {
  void snapshot;
  // 阶段一先预留，后续可接云开发或自定义后端同步。
}
