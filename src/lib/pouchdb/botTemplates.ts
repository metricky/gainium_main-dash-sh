// Stub for self-hosted: bot-template PouchDB sync is disabled.
import type { BotTemplate } from '@/stores/botTemplatesStore';

export class BotTemplatesPouchDB {
  async syncFromStore(_templates: BotTemplate[]): Promise<void> {}

  async loadToStore(
    _setTemplates: (templates: BotTemplate[]) => void
  ): Promise<void> {}

  setupSync(_onSyncNeeded: () => void): () => void {
    return () => {};
  }
}

let instance: BotTemplatesPouchDB | null = null;

export function getBotTemplatesPouchDB(): BotTemplatesPouchDB {
  if (!instance) {
    instance = new BotTemplatesPouchDB();
  }
  return instance;
}
