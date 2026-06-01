/**
 * WebSocket Update Debouncer
 *
 * Batches rapid WebSocket updates to reduce CPU usage and unnecessary re-renders.
 * Instead of processing 5 updates in 1 second (5 state changes), accumulates them
 * and applies all at once (1 state change).
 *
 * Each bot ID has its own queue and timer for independent batching.
 */

type UpdateCallback<T> = (updates: T[]) => void;

export class WebSocketDebouncer<T> {
  private updatesByBotId: Map<string, T[]> = new Map();
  private timersByBotId: Map<string, NodeJS.Timeout> = new Map();
  private readonly delay: number;
  private readonly callback: UpdateCallback<T>;
  private readonly getBotId: (update: T) => string;

  /**
   * @param callback - Function to call with batched updates
   * @param getBotId - Function to extract bot ID from update (for per-bot batching)
   * @param delay - Debounce delay in milliseconds (default: 50ms)
   */
  constructor(
    callback: UpdateCallback<T>,
    getBotId: (update: T) => string,
    delay: number = 50
  ) {
    this.callback = callback;
    this.getBotId = getBotId;
    this.delay = delay;
  }

  /**
   * Add an update to the batch queue for its bot
   */
  public enqueue(update: T): void {
    const botId = this.getBotId(update);

    // Get or create queue for this bot
    if (!this.updatesByBotId.has(botId)) {
      this.updatesByBotId.set(botId, []);
    }
    const queue = this.updatesByBotId.get(botId);
    queue?.push(update);

    // Clear existing timer for this bot
    const existingTimer = this.timersByBotId.get(botId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Schedule flush for this bot
    const timer = setTimeout(() => {
      this.flushBot(botId);
    }, this.delay);

    this.timersByBotId.set(botId, timer);
  }

  /**
   * Flush pending updates for a specific bot
   */
  private flushBot(botId: string): void {
    const updates = this.updatesByBotId.get(botId);
    if (!updates || updates.length === 0) return;

    // Remove from maps
    this.updatesByBotId.delete(botId);

    const timer = this.timersByBotId.get(botId);
    if (timer) {
      clearTimeout(timer);
      this.timersByBotId.delete(botId);
    }

    // Execute callback with bot's accumulated updates
    this.callback([...updates]);
  }

  /**
   * Immediately flush all pending updates for all bots
   */
  public flush(): void {
    const botIds = Array.from(this.updatesByBotId.keys());
    botIds.forEach((botId) => this.flushBot(botId));
  }

  /**
   * Clear all pending updates without processing
   */
  public clear(): void {
    this.updatesByBotId.clear();

    this.timersByBotId.forEach((timer) => clearTimeout(timer));
    this.timersByBotId.clear();
  }
}
