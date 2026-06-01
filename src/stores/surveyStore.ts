// Survey store stub.

export interface SurveyAnswer {
  choice?: string;
  text?: string;
  rating?: number;
  choices?: string[];
}

interface SurveyState {
  answers: Record<string, Record<number, SurveyAnswer>>;
  completedSurveys: Set<string>;
  dismissedSurveys: Set<string>;
  setAnswer: (
    surveyId: string,
    questionIndex: number,
    answer: SurveyAnswer
  ) => void;
  clearAnswers: (surveyId: string) => void;
  markSurveyCompleted: (surveyId: string) => void;
  markSurveyDismissed: (surveyId: string) => void;
  isSurveyCompletedOrDismissed: (surveyId: string) => boolean;
}

const noopState: SurveyState = {
  answers: {},
  completedSurveys: new Set<string>(),
  dismissedSurveys: new Set<string>(),
  setAnswer: () => {},
  clearAnswers: () => {},
  markSurveyCompleted: () => {},
  markSurveyDismissed: () => {},
  isSurveyCompletedOrDismissed: () => false,
};

export function useSurveyStore(): SurveyState;
export function useSurveyStore<T>(selector: (state: SurveyState) => T): T;
export function useSurveyStore<T>(
  selector?: (state: SurveyState) => T
): T | SurveyState {
  return selector ? selector(noopState) : noopState;
}

useSurveyStore.getState = (): SurveyState => noopState;
useSurveyStore.setState = (): void => {};
useSurveyStore.subscribe = (): (() => void) => () => {};
