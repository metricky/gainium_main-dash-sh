// Onboarding prompt pill stub.
import React from 'react';

interface PromptPillProps {
  open: boolean;
  text: string;
  onStart?: () => void;
  onDismiss?: () => void;
  buttonLabel?: string;
}

export const PromptPill: React.FC<PromptPillProps> = () => null;
