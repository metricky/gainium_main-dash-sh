import type { PositionChart } from '@/types';

export type RiskPositionListener = (position: PositionChart | null) => void;

/**
 * Global in-memory store responsible for broadcasting Risk:Reward position payloads
 * across the redesigned dashboard. The store keeps track of each bot's latest
 * position payload (if any) and allows multiple widgets to subscribe without
 * requiring prop drilling or duplicated logic.
 */
class RiskRewardPositionStore {
  private positions = new Map<string, PositionChart | null>();

  private listeners = new Map<string, Set<RiskPositionListener>>();

  private globalListeners = new Set<RiskPositionListener>();

  /**
   * Persist the latest Risk:Reward position payload for a given bot id and
   * notify subscribers.
   */
  setPosition(botId: string, position: PositionChart | null): void {
    const normalizedId = this.normalizeBotId(botId);
    const previous = this.positions.get(normalizedId) ?? null;

    if (previous && position && this.isSamePosition(previous, position)) {
      return;
    }

    if (position === null) {
      if (!this.positions.has(normalizedId)) {
        return;
      }
      this.positions.delete(normalizedId);
    } else {
      this.positions.set(normalizedId, position);
    }

    this.notifyListeners(normalizedId, position ?? null);
  }

  /**
   * Convenience helper to clear a stored position, if any, for the given bot id.
   */
  clearPosition(botId: string): void {
    this.setPosition(botId, null);
  }

  /**
   * Retrieve the currently cached Risk:Reward position payload for a bot, if one exists.
   */
  getPosition(botId: string): PositionChart | null {
    const normalizedId = this.normalizeBotId(botId);
    return this.positions.get(normalizedId) ?? null;
  }

  /**
   * Subscribe to position updates for a specific bot id. The listener will be invoked immediately
   * with the current state (if any) and subsequently whenever the payload changes.
   */
  subscribe(botId: string, listener: RiskPositionListener): () => void {
    const normalizedId = this.normalizeBotId(botId);
    const botListeners =
      this.listeners.get(normalizedId) ?? new Set<RiskPositionListener>();
    botListeners.add(listener);
    this.listeners.set(normalizedId, botListeners);

    listener(this.getPosition(normalizedId));

    return () => {
      const current = this.listeners.get(normalizedId);
      if (!current) {
        return;
      }
      current.delete(listener);
      if (current.size === 0) {
        this.listeners.delete(normalizedId);
      }
    };
  }

  /**
   * Subscribe to position updates for all bots. Use sparingly—preferred workflow is to subscribe
   * per bot to avoid unnecessary renders.
   */
  subscribeAll(listener: RiskPositionListener): () => void {
    this.globalListeners.add(listener);
    listener(null);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  private notifyListeners(botId: string, position: PositionChart | null) {
    const listenersForBot = this.listeners.get(botId);
    if (listenersForBot) {
      listenersForBot.forEach((listener) => {
        try {
          listener(position);
        } catch (error) {
          console.error(
            '[RiskRewardPositionStore] Failed to deliver bot listener update',
            error
          );
        }
      });
    }

    if (this.globalListeners.size > 0) {
      this.globalListeners.forEach((listener) => {
        try {
          listener(position);
        } catch (error) {
          console.error(
            '[RiskRewardPositionStore] Failed to deliver global listener update',
            error
          );
        }
      });
    }
  }

  private normalizeBotId(botId: string): string {
    return botId?.trim().length ? botId.trim() : '__GLOBAL_RISK_REWARD__';
  }

  private isSamePosition(a: PositionChart, b: PositionChart): boolean {
    return (
      a.side === b.side &&
      a.entryPrice === b.entryPrice &&
      a.profitPrice === b.profitPrice &&
      a.stopPrice === b.stopPrice &&
      a.risk === b.risk &&
      a.accountSize === b.accountSize
    );
  }
}

export const riskRewardPositionStore = new RiskRewardPositionStore();
