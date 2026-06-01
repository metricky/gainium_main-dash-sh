// Sh stub: DCA survey is cloud-only (subscription user-research). Sh
// renders nothing; the TradingBotNew page treats the survey trigger as
// always-completed via `useSurveyStore` (also a sh stub).

import React from 'react';

interface DcaSurveyProps {
  open?: boolean;
  forceOpen?: boolean;
  onClose?: () => void;
}

export const DcaSurvey: React.FC<DcaSurveyProps> = () => null;
