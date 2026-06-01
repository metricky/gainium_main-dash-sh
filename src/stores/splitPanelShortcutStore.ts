import { logger } from '@/lib/loggerInstance';
import { create } from 'zustand';

const LOG_PREFIX = 'SplitPanelShortcuts';

/**
 * Panel state for 3-state toggle behavior
 * - 'default': Panel is at its default size
 * - 'collapsed': Panel is fully collapsed (size = 0)
 * - 'expanded': Panel is fully expanded (takes all available space)
 */
export type PanelState = 'default' | 'collapsed' | 'expanded';

/**
 * Handler for panel expand/collapse operations
 */
export interface SplitPanelHandler {
  id: string;
  direction: 'horizontal' | 'vertical';
  /** Get current panel sizes as percentages */
  getSizes: () => number[];
  /** Get default panel sizes as percentages */
  getDefaultSizes: () => number[];
  /** Set panel sizes (percentages that sum to ~100) */
  setSizes: (sizes: number[]) => void;
  /** Get which panels are collapsible (by index) */
  getCollapsiblePanels: () => number[];
  /** Priority for handling - higher = more priority */
  priority: number;
}

interface SplitPanelShortcutStoreState {
  /** Registered panel handlers, keyed by ID */
  handlers: Map<string, SplitPanelHandler>;
  /** Track the state of each panel (by handler id + panel index) */
  panelStates: Map<string, PanelState>;

  // Actions
  registerHandler: (handler: SplitPanelHandler) => void;
  unregisterHandler: (id: string) => void;
  /** Handle arrow left/right for horizontal panels */
  handleHorizontalArrow: (direction: 'left' | 'right') => void;
  /** Handle arrow up/down for vertical panels */
  handleVerticalArrow: (direction: 'up' | 'down') => void;
  /** Get the state of a specific panel */
  getPanelState: (handlerId: string, panelIndex: number) => PanelState;
  /** Set the state of a specific panel */
  setPanelState: (
    handlerId: string,
    panelIndex: number,
    state: PanelState
  ) => void;
}

const COLLAPSED_THRESHOLD = 5; // Consider panel collapsed if < 5%
const EXPANDED_THRESHOLD = 90; // Consider panel expanded if > 90%

/**
 * Determine current state of a panel based on its size relative to default
 */
function determinePanelState(
  currentSize: number,
  defaultSize: number
): PanelState {
  if (currentSize < COLLAPSED_THRESHOLD) {
    return 'collapsed';
  }
  if (currentSize > EXPANDED_THRESHOLD) {
    return 'expanded';
  }
  // Consider "default" if within ~10% of default size
  if (Math.abs(currentSize - defaultSize) < 10) {
    return 'default';
  }
  // Otherwise, consider it closer to default than collapsed/expanded
  return 'default';
}

export const useSplitPanelShortcutStore = create<SplitPanelShortcutStoreState>(
  (set, get) => ({
    handlers: new Map(),
    panelStates: new Map(),

    registerHandler: (handler: SplitPanelHandler) => {
      set((state) => {
        const newHandlers = new Map(state.handlers);
        newHandlers.set(handler.id, handler);
        logger.debug(`[${LOG_PREFIX}] Registered handler`, {
          id: handler.id,
          direction: handler.direction,
        });
        return { handlers: newHandlers };
      });
    },

    unregisterHandler: (id: string) => {
      set((state) => {
        const newHandlers = new Map(state.handlers);
        newHandlers.delete(id);
        // Also clean up panel states for this handler
        const newPanelStates = new Map(state.panelStates);
        for (const key of newPanelStates.keys()) {
          if (key.startsWith(`${id}:`)) {
            newPanelStates.delete(key);
          }
        }
        logger.debug(`[${LOG_PREFIX}] Unregistered handler`, { id });
        return { handlers: newHandlers, panelStates: newPanelStates };
      });
    },

    getPanelState: (handlerId: string, panelIndex: number): PanelState => {
      const key = `${handlerId}:${panelIndex}`;
      return get().panelStates.get(key) || 'default';
    },

    setPanelState: (
      handlerId: string,
      panelIndex: number,
      state: PanelState
    ) => {
      set((prev) => {
        const key = `${handlerId}:${panelIndex}`;
        const newPanelStates = new Map(prev.panelStates);
        newPanelStates.set(key, state);
        return { panelStates: newPanelStates };
      });
    },

    handleHorizontalArrow: (direction: 'left' | 'right') => {
      const { handlers } = get();

      // Find all horizontal handlers sorted by priority
      const horizontalHandlers = Array.from(handlers.values())
        .filter((h) => h.direction === 'horizontal')
        .sort((a, b) => b.priority - a.priority);

      if (horizontalHandlers.length === 0) {
        logger.debug(`[${LOG_PREFIX}] No horizontal handlers registered`);
        return;
      }

      // Use the highest priority handler
      const handler = horizontalHandlers[0];
      const currentSizes = handler.getSizes();
      const defaultSizes = handler.getDefaultSizes();
      const collapsiblePanels = handler.getCollapsiblePanels();

      if (currentSizes.length < 2) {
        logger.debug(`[${LOG_PREFIX}] Not enough panels for horizontal split`);
        return;
      }

      logger.debug(`[${LOG_PREFIX}] Handling horizontal arrow`, {
        direction,
        currentSizes,
        defaultSizes,
        collapsiblePanels,
      });

      // For horizontal splits (unidirectional movement):
      // - ArrowLeft: moves content left (expands right panel progressively)
      //   collapsed → default → fully expanded → no effect
      // - ArrowRight: moves content right (collapses right panel progressively)
      //   fully expanded → default → collapsed → no effect

      const rightIndex = currentSizes.length - 1;

      const rightSize = currentSizes[rightIndex];
      const rightDefault = defaultSizes[rightIndex] ?? 50;

      const rightState = determinePanelState(rightSize, rightDefault);

      let newSizes: number[] | null = null;

      if (direction === 'left') {
        // Arrow left: progressively expand right panel (collapse left)
        if (rightState === 'collapsed') {
          // Move from collapsed to default
          newSizes = [...defaultSizes];
          logger.debug(`[${LOG_PREFIX}] Left arrow: restoring to default`);
        } else if (rightState === 'default') {
          // Move from default to fully expanded
          newSizes = [0, 100];
          logger.debug(
            `[${LOG_PREFIX}] Left arrow: fully expanding right panel`
          );
        } else if (rightState === 'expanded') {
          // Already fully expanded, do nothing
          logger.debug(`[${LOG_PREFIX}] Left arrow: already at max, no effect`);
          return;
        }
      } else {
        // direction === 'right': progressively collapse right panel (expand left)
        if (rightState === 'expanded') {
          // Move from expanded to default
          newSizes = [...defaultSizes];
          logger.debug(`[${LOG_PREFIX}] Right arrow: restoring to default`);
        } else if (rightState === 'default') {
          // Move from default to fully collapsed
          newSizes = [100, 0];
          logger.debug(
            `[${LOG_PREFIX}] Right arrow: fully collapsing right panel`
          );
        } else if (rightState === 'collapsed') {
          // Already fully collapsed, do nothing
          logger.debug(
            `[${LOG_PREFIX}] Right arrow: already collapsed, no effect`
          );
          return;
        }
      }

      if (newSizes) {
        handler.setSizes(newSizes);
      }
    },

    handleVerticalArrow: (direction: 'up' | 'down') => {
      const { handlers } = get();

      // Find all vertical handlers sorted by priority
      const verticalHandlers = Array.from(handlers.values())
        .filter((h) => h.direction === 'vertical')
        .sort((a, b) => b.priority - a.priority);

      if (verticalHandlers.length === 0) {
        logger.debug(`[${LOG_PREFIX}] No vertical handlers registered`);
        return;
      }

      // Use the highest priority handler
      const handler = verticalHandlers[0];
      const currentSizes = handler.getSizes();
      const defaultSizes = handler.getDefaultSizes();

      if (currentSizes.length < 2) {
        logger.debug(`[${LOG_PREFIX}] Not enough panels for vertical split`);
        return;
      }

      logger.debug(`[${LOG_PREFIX}] Handling vertical arrow`, {
        direction,
        currentSizes,
        defaultSizes,
      });

      // For vertical splits (unidirectional movement):
      // - ArrowUp: moves content up (expands bottom panel progressively)
      //   collapsed → default → fully expanded → no effect
      // - ArrowDown: moves content down (collapses bottom panel progressively)
      //   fully expanded → default → collapsed → no effect

      const bottomIndex = currentSizes.length - 1;

      const bottomSize = currentSizes[bottomIndex];
      const bottomDefault = defaultSizes[bottomIndex] ?? 50;

      const bottomState = determinePanelState(bottomSize, bottomDefault);

      let newSizes: number[] | null = null;

      if (direction === 'up') {
        // Arrow up: progressively expand bottom panel (collapse top)
        if (bottomState === 'collapsed') {
          // Move from collapsed to default
          newSizes = [...defaultSizes];
          logger.debug(`[${LOG_PREFIX}] Up arrow: restoring to default`);
        } else if (bottomState === 'default') {
          // Move from default to fully expanded (set top to minimum to allow bottom to be maximum)
          const minTopSize = 0;
          newSizes = [minTopSize, 100 - minTopSize];
          logger.debug(
            `[${LOG_PREFIX}] Up arrow: fully expanding bottom panel to ${100 - minTopSize}%`
          );
        } else if (bottomState === 'expanded') {
          // Already fully expanded, do nothing
          logger.debug(`[${LOG_PREFIX}] Up arrow: already at max, no effect`);
          return;
        }
      } else {
        // direction === 'down': progressively collapse bottom panel (expand top)
        if (bottomState === 'expanded') {
          // Move from expanded to default
          newSizes = [...defaultSizes];
          logger.debug(`[${LOG_PREFIX}] Down arrow: restoring to default`);
        } else if (bottomState === 'default') {
          // Move from default to fully collapsed (set bottom to minimum to allow top to be maximum)
          const minBottomSize = 0;
          newSizes = [100 - minBottomSize, minBottomSize];
          logger.debug(
            `[${LOG_PREFIX}] Down arrow: fully collapsing bottom panel, top at ${100 - minBottomSize}%`
          );
        } else if (bottomState === 'collapsed') {
          // Already fully collapsed, do nothing
          logger.debug(
            `[${LOG_PREFIX}] Down arrow: already collapsed, no effect`
          );
          return;
        }
      }

      if (newSizes) {
        handler.setSizes(newSizes);
      }
    },
  })
);
