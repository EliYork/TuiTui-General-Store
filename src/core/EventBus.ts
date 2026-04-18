export const GAME_EVENTS = {
  COIN_SPAWNED: "coin:spawned",
  REWARD_SPAWN_REQUESTED: "reward:spawn-requested"
} as const;

export type EventHandler = (payload?: unknown) => void;

export class EventBus {
  private readonly listeners: Record<string, EventHandler[]> = {};

  on(eventName: string, handler: EventHandler): () => void {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }

    this.listeners[eventName].push(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName: string, handler: EventHandler): void {
    const handlers = this.listeners[eventName];
    if (!handlers) {
      return;
    }

    this.listeners[eventName] = handlers.filter((item) => item !== handler);
  }

  emit(eventName: string, payload?: unknown): void {
    const handlers = this.listeners[eventName];
    if (!handlers) {
      return;
    }

    handlers.forEach((handler) => handler(payload));
  }
}
