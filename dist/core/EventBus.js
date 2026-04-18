"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventBus = exports.GAME_EVENTS = void 0;
exports.GAME_EVENTS = {
    COIN_SPAWNED: "coin:spawned",
    REWARD_SPAWN_REQUESTED: "reward:spawn-requested"
};
class EventBus {
    constructor() {
        this.listeners = {};
    }
    on(eventName, handler) {
        if (!this.listeners[eventName]) {
            this.listeners[eventName] = [];
        }
        this.listeners[eventName].push(handler);
        return () => this.off(eventName, handler);
    }
    off(eventName, handler) {
        const handlers = this.listeners[eventName];
        if (!handlers) {
            return;
        }
        this.listeners[eventName] = handlers.filter((item) => item !== handler);
    }
    emit(eventName, payload) {
        const handlers = this.listeners[eventName];
        if (!handlers) {
            return;
        }
        handlers.forEach((handler) => handler(payload));
    }
}
exports.EventBus = EventBus;
