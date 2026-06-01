// Journal tags store stub.

export interface TagUsage {
  id: string;
  tag: string;
  count: number;
  lastUsed: number;
  color?: string;
}

interface JournalTagsState {
  tags: TagUsage[];
  initializeFromJournalTrades: () => void;
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  deleteTag: (tag: string) => void;
  updateTagsFromTrade: (oldTags?: string[], newTags?: string[]) => void;
  getTagSuggestions: () => TagUsage[];
  clearUnusedTags: () => void;
  updateTag: (oldTag: string, newTag: string, color?: string) => void;
}

const noopState: JournalTagsState = {
  tags: [],
  initializeFromJournalTrades: () => {},
  addTag: () => {},
  removeTag: () => {},
  deleteTag: () => {},
  updateTagsFromTrade: () => {},
  getTagSuggestions: () => [],
  clearUnusedTags: () => {},
  updateTag: () => {},
};

export function useJournalTagsStore(): JournalTagsState;
export function useJournalTagsStore<T>(
  selector: (state: JournalTagsState) => T
): T;
export function useJournalTagsStore<T>(
  selector?: (state: JournalTagsState) => T
): T | JournalTagsState {
  return selector ? selector(noopState) : noopState;
}

useJournalTagsStore.getState = (): JournalTagsState => noopState;
useJournalTagsStore.setState = (): void => {};
useJournalTagsStore.subscribe = (): (() => void) => () => {};
