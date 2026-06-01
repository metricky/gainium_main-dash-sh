import { create } from 'zustand';
import { logger } from '../lib/loggerInstance';

interface SiteTourState {
  shouldShowTour: boolean;
  tourCompleted: boolean;
  tourPillDismissed: boolean;
  onboardingCompleted: boolean;
  forceStartTour: () => void;
  markOnboardingCompleted: () => void;
  startSiteTour: () => void;
  completeSiteTour: () => void;
  cancelSiteTour: () => void;
  dismissTourPill: () => void;
  resetTour: () => void;
}

const SITE_TOUR_STORAGE_KEY = 'gainium-site-tour-state';

const getStoredState = () => {
  try {
    const stored = localStorage.getItem(SITE_TOUR_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        // Never restore an open tour across reloads
        shouldShowTour: false,
        tourCompleted: Boolean(parsed.tourCompleted),
        tourPillDismissed: Boolean(parsed.tourPillDismissed),
        onboardingCompleted: Boolean(parsed.onboardingCompleted),
      };
    }
  } catch (error) {
    logger.error('Failed to parse site tour state from localStorage:', error);
  }

  return {
    shouldShowTour: false,
    tourCompleted: false,
    tourPillDismissed: false,
    onboardingCompleted: false,
  };
};

const setStoredState = (
  state: Pick<
    SiteTourState,
    'tourCompleted' | 'tourPillDismissed' | 'onboardingCompleted'
  >
) => {
  try {
    // Persist only durable flags (not transient visibility)
    localStorage.setItem(
      SITE_TOUR_STORAGE_KEY,
      JSON.stringify({
        tourCompleted: state.tourCompleted,
        tourPillDismissed: state.tourPillDismissed,
        onboardingCompleted: state.onboardingCompleted,
      })
    );
  } catch (error) {
    logger.error('Failed to save site tour state to localStorage:', error);
  }
};

// Create a Zustand store for shared state across components
const useSiteTourStore = create<SiteTourState>((set, _get) => ({
  ...getStoredState(),

  forceStartTour: () => {
    logger.info('[onboard-tour] forceStartTour called');
    set((state) => {
      const newState = {
        ...state,
        shouldShowTour: true,
        tourCompleted: false,
      };
      logger.info('[onboard-tour] forceStartTour state updated', newState);
      setStoredState(newState);
      return newState;
    });
  },

  markOnboardingCompleted: () => {
    logger.info('[onboard-tour] markOnboardingCompleted called');
    set((state) => {
      const newState = {
        ...state,
        onboardingCompleted: true,
        shouldShowTour: false, // Don't auto-start tour on onboarding completion
      };
      logger.info('[onboard-tour] onboarding marked as completed', newState);
      setStoredState(newState);
      return newState;
    });
  },

  startSiteTour: () => {
    set((state) => {
      const newState = {
        ...state,
        shouldShowTour: true,
      };
      return newState;
    });
  },

  completeSiteTour: () => {
    set((state) => {
      const newState = {
        ...state,
        shouldShowTour: false,
        tourCompleted: true,
      };
      setStoredState(newState);
      return newState;
    });
  },

  cancelSiteTour: () => {
    set((state) => ({
      ...state,
      shouldShowTour: false,
    }));
  },

  dismissTourPill: () => {
    set((state) => {
      const newState = {
        ...state,
        tourPillDismissed: true,
      };
      setStoredState(newState);
      return newState;
    });
  },

  resetTour: () => {
    logger.info('[SiteTour Debug] Resetting tour');
    const newState = {
      shouldShowTour: false,
      tourCompleted: false,
      tourPillDismissed: false,
      onboardingCompleted: false,
    };
    logger.info('[SiteTour Debug] New state after resetTour:', newState);

    set((state) => ({
      ...state,
      ...newState,
    }));

    // Also clear localStorage
    try {
      localStorage.removeItem(SITE_TOUR_STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear tour state from localStorage:', error);
    }
  },
}));

export const useSiteTour = () => {
  const store = useSiteTourStore();

  return {
    shouldShowTour: store.shouldShowTour,
    tourCompleted: store.tourCompleted,
    tourPillDismissed: store.tourPillDismissed,
    onboardingCompleted: store.onboardingCompleted,
    markOnboardingCompleted: store.markOnboardingCompleted,
    startSiteTour: store.startSiteTour,
    forceStartTour: store.forceStartTour,
    completeSiteTour: store.completeSiteTour,
    cancelSiteTour: store.cancelSiteTour,
    dismissTourPill: store.dismissTourPill,
    resetTour: store.resetTour,
  };
};
