// In-app survey wrapper stub.
import React from 'react';

// Loose typing to avoid pulling in SurveyQuestion.
interface SurveyWrapperProps {
  surveyId: string;
  surveyName: string;
  questions: unknown[];
  onComplete?: () => void;
  mode?: 'dialog' | 'standalone';
  display?: 'list' | 'compact' | 'stepper';
  isOpen?: boolean;
  onClose?: () => void;
}

export const SurveyWrapper: React.FC<SurveyWrapperProps> = () => null;
