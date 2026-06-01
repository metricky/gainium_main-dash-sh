import logger from './loggerInstance';

/**
 * Offline Queue Manager
 * Handles queuing and retrying failed requests when offline
 */
interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string | null;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

class OfflineQueueManager {
  private static instance: OfflineQueueManager;
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  private constructor() {
    this.loadQueue();
    this.setupEventListeners();
  }

  static getInstance(): OfflineQueueManager {
    if (!OfflineQueueManager.instance) {
      OfflineQueueManager.instance = new OfflineQueueManager();
    }
    return OfflineQueueManager.instance;
  }

  private setupEventListeners(): void {
    // Listen for online/offline events
    window.addEventListener('online', () => {
      logger.info('Back online - processing queued requests');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      logger.info('Gone offline - requests will be queued');
    });

    // Process queue on app startup if online
    if (navigator.onLine) {
      setTimeout(() => this.processQueue(), 1000);
    }
  }

  private loadQueue(): void {
    try {
      const stored = localStorage.getItem('gainium-offline-queue');
      if (stored) {
        this.queue = JSON.parse(stored);
        logger.info(`Loaded ${this.queue.length} queued requests`);
      }
    } catch (error) {
      console.error('Failed to load offline queue:', error);
      this.queue = [];
    }
  }

  private saveQueue(): void {
    try {
      localStorage.setItem('gainium-offline-queue', JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to save offline queue:', error);
    }
  }

  addRequest(request: Request, maxRetries: number = this.maxRetries): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const queuedRequest: QueuedRequest = {
      id,
      url: request.url,
      method: request.method,
      headers: this.extractHeaders(request),
      body: null,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries,
    };

    // Extract body if present
    if (request.body) {
      request
        .clone()
        .text()
        .then((text) => {
          queuedRequest.body = text;
          this.queue.push(queuedRequest);
          this.saveQueue();
          logger.info(`Queued request ${id} for offline processing`);
        });
    } else {
      this.queue.push(queuedRequest);
      this.saveQueue();
      logger.info(`Queued request ${id} for offline processing`);
    }

    return id;
  }

  private extractHeaders(request: Request): Record<string, string> {
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = value;
    });
    return headers;
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    logger.info(`Processing ${this.queue.length} queued requests`);

    const processedIds: string[] = [];

    for (const queuedRequest of this.queue) {
      try {
        const success = await this.retryRequest(queuedRequest);
        if (success) {
          processedIds.push(queuedRequest.id);
          logger.info(
            `Successfully processed queued request ${queuedRequest.id}`
          );
        } else {
          queuedRequest.retryCount++;
          if (queuedRequest.retryCount >= queuedRequest.maxRetries) {
            processedIds.push(queuedRequest.id);
            logger.info(
              `Max retries reached for request ${queuedRequest.id}, removing from queue`
            );
          }
        }
      } catch (error) {
        console.error(
          `Failed to process queued request ${queuedRequest.id}:`,
          error
        );
        queuedRequest.retryCount++;
        if (queuedRequest.retryCount >= queuedRequest.maxRetries) {
          processedIds.push(queuedRequest.id);
        }
      }

      // Add delay between requests to avoid overwhelming the server
      if (this.queue.length > 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }

    // Remove processed requests from queue
    this.queue = this.queue.filter((req) => !processedIds.includes(req.id));
    this.saveQueue();

    this.isProcessing = false;

    // If there are still requests in queue, schedule another attempt
    if (this.queue.length > 0) {
      const delay = Math.min(
        this.retryDelay * Math.pow(2, this.queue[0].retryCount),
        30000
      );
      setTimeout(() => this.processQueue(), delay);
    }
  }

  private async retryRequest(queuedRequest: QueuedRequest): Promise<boolean> {
    try {
      const requestInit: RequestInit = {
        method: queuedRequest.method,
        headers: queuedRequest.headers,
        ...(queuedRequest.body && { body: queuedRequest.body }),
      };

      const response = await fetch(queuedRequest.url, requestInit);

      if (response.ok) {
        // Notify the app about successful request
        this.notifySuccess(queuedRequest);
        return true;
      } else {
        console.warn(
          `Queued request ${queuedRequest.id} failed with status ${response.status}`
        );
        return false;
      }
    } catch (error) {
      console.error(`Error retrying request ${queuedRequest.id}:`, error);
      return false;
    }
  }

  private notifySuccess(request: QueuedRequest): void {
    // Dispatch custom event to notify the app
    window.dispatchEvent(
      new CustomEvent('offlineRequestSuccess', {
        detail: {
          id: request.id,
          url: request.url,
          method: request.method,
        },
      })
    );
  }

  getQueueStatus(): { count: number; processing: boolean } {
    return {
      count: this.queue.length,
      processing: this.isProcessing,
    };
  }

  clearQueue(): void {
    this.queue = [];
    this.saveQueue();
    logger.info('Offline queue cleared');
  }

  removeRequest(id: string): boolean {
    const index = this.queue.findIndex((req) => req.id === id);
    if (index !== -1) {
      this.queue.splice(index, 1);
      this.saveQueue();
      return true;
    }
    return false;
  }

  getQueuedRequests(): QueuedRequest[] {
    return [...this.queue];
  }
}

// Enhanced fetch wrapper that automatically queues failed requests
export async function enhancedFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
  options?: { queueOnFailure?: boolean; maxRetries?: number }
): Promise<Response> {
  const { queueOnFailure = true, maxRetries = 3 } = options || {};

  try {
    const request = new Request(input, init);
    const response = await fetch(request);

    if (!response.ok && queueOnFailure && !navigator.onLine) {
      // Queue the request for later if we're offline and it failed
      const queueManager = OfflineQueueManager.getInstance();
      queueManager.addRequest(request.clone(), maxRetries);
    }

    return response;
  } catch (error) {
    // If fetch fails and we're offline, queue the request
    if (queueOnFailure && !navigator.onLine) {
      const request = new Request(input, init);
      const queueManager = OfflineQueueManager.getInstance();
      queueManager.addRequest(request, maxRetries);
    }

    throw error;
  }
}

export default OfflineQueueManager;
