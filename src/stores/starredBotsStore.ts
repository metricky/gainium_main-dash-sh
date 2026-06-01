import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StarredBotsState {
  starredBotIds: Set<string>;
  toggleStarred: (botId: string) => void;
  isStarred: (botId: string) => boolean;
}

export const useStarredBotsStore = create<StarredBotsState>()(
  persist(
    (set, get) => ({
      starredBotIds: new Set<string>(),

      toggleStarred: (botId: string) => {
        set((state) => {
          const next = new Set(state.starredBotIds);
          if (next.has(botId)) {
            next.delete(botId);
          } else {
            next.add(botId);
          }
          return { starredBotIds: next };
        });
      },

      isStarred: (botId: string) => {
        return get().starredBotIds.has(botId);
      },
    }),
    {
      name: 'gainium:starredBots',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const parsed = JSON.parse(str);
          return {
            state: {
              ...parsed.state,
              starredBotIds: new Set(parsed.state.starredBotIds || []),
            },
          };
        },
        setItem: (name, value) => {
          const toStore = {
            state: {
              ...value.state,
              starredBotIds: Array.from(value.state.starredBotIds),
            },
          };
          localStorage.setItem(name, JSON.stringify(toStore));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
