/* eslint-disable @typescript-eslint/no-explicit-any */
// AI chat store stub.

export interface ChatMessage {
  message: string;
  time: number;
  id: string;
  type: 'in' | 'out';
  isToolStatus?: boolean;
  toolId?: string;
  toolName?: string;
  toolDescription?: string;
  toolStatus?:
    | 'running'
    | 'completed'
    | 'error'
    | 'permission-required'
    | 'permission-approved'
    | 'permission-rejected';
  toolResult?: string;
  toolArgs?: string;
  isPermissionRequest?: boolean;
  permissionId?: string;
  permissionMessage?: string;
  toolParameters?: any;
  requiresPermission?: boolean;
  spoilers?: { title: string; content: string; id: string }[];
}

export interface MaxGainAiMessage {
  threadId: string;
  userId: string;
  message: string;
  time: number;
  from: string;
  oaiId?: string;
  _id: string;
  isToolStatus?: boolean;
  toolId?: string;
  toolName?: string;
  toolDescription?: string;
  toolStatus?:
    | 'running'
    | 'completed'
    | 'error'
    | 'permission-required'
    | 'permission-approved'
    | 'permission-rejected';
  toolResult?: string;
  toolArgs?: string;
  permissionId?: string;
  permissionMessage?: string;
  toolParameters?: any;
}

export interface ChatState {
  open: boolean;
  /**
   * Cloud-only floating-panel state. Sh keeps them in the type for
   * cross-build parity but always reports `false` from the stub —
   * sh doesn't ship the detached Max overlay.
   */
  detached: boolean;
  detachedMinimized: boolean;
  messages: ChatMessage[];
  chatMode: 'agent' | 'help';
  draft: { message: string; spoilers?: ChatMessage['spoilers']; placeholder?: string };
  error?: string;
  chatQueries: { used: number; total: number } | null;
  selectedModel: string;
  aiCreditsBalance: number | null;
}

interface ChatStore extends ChatState {
  openChat: () => void;
  closeChat: () => void;
  toggleChat: () => void;
  addMessage: (message: ChatMessage) => void;
  upsertMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  clearMessages: () => void;
  clearChat: () => void;
  setDraft: (draft: ChatState['draft']) => void;
  clearDraft: () => void;
  setError: (error: string) => void;
  clearError: () => void;
  setChatQueries: (queries: { used: number; total: number }) => void;
  incrementQueryCount: () => void;
  setSelectedModel: (model: string) => void;
  setChatMode: (mode: 'agent' | 'help') => void;
  setAiCreditsBalance: (balance: number) => void;
}

const noopState: ChatStore = {
  open: false,
  detached: false,
  detachedMinimized: false,
  messages: [],
  chatMode: 'agent',
  draft: { message: '', spoilers: [] },
  error: '',
  chatQueries: null,
  selectedModel: '',
  aiCreditsBalance: null,
  openChat: () => {},
  closeChat: () => {},
  toggleChat: () => {},
  addMessage: () => {},
  upsertMessage: () => {},
  updateMessage: () => {},
  clearMessages: () => {},
  clearChat: () => {},
  setDraft: () => {},
  clearDraft: () => {},
  setError: () => {},
  clearError: () => {},
  setChatQueries: () => {},
  incrementQueryCount: () => {},
  setSelectedModel: () => {},
  setChatMode: () => {},
  setAiCreditsBalance: () => {},
};

export function useChatStore(): ChatStore;
export function useChatStore<T>(selector: (state: ChatStore) => T): T;
export function useChatStore<T>(
  selector?: (state: ChatStore) => T
): T | ChatStore {
  return selector ? selector(noopState) : noopState;
}

useChatStore.getState = (): ChatStore => noopState;
useChatStore.setState = (): void => {};
useChatStore.subscribe = (): (() => void) => () => {};
