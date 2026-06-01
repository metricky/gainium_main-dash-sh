import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/lib/loggerInstance';
import { useSurveyStore } from '@/stores/surveyStore';
import { Bell, CheckCircle2, PlayCircle, Sparkles } from 'lucide-react';
import React, { useCallback, useState } from 'react';
import { OnboardingSurvey } from '../survey/OnboardingSurvey';
import { SurveyWrapper } from '../survey/SurveyWrapper';

export const TriggersContent: React.FC = () => {
  const surveyStore = useSurveyStore();
  const [isSurveyOpen, setIsSurveyOpen] = useState(false);
  const [isOnboardingSurveyOpen, setIsOnboardingSurveyOpen] = useState(false);
  const [surveyDisplay, setSurveyDisplay] = useState<
    'list' | 'compact' | 'stepper'
  >('stepper');

  const handleResetSurveyState = useCallback(() => {
    // Clear survey storage to reset survey state
    localStorage.removeItem('survey-storage');
    // Reset the store state
    surveyStore.completedSurveys.clear();
    surveyStore.dismissedSurveys.clear();
    logger.info('[TriggersContent] Reset survey state');
    // Force a page reload to reinitialize the store
    window.location.reload();
  }, [surveyStore]);

  const handleMarkSurveyCompleted = useCallback(() => {
    surveyStore.markSurveyCompleted('onboardingSurvey');
    logger.info('[TriggersContent] Marked survey as completed');
  }, [surveyStore]);

  const handleTriggerTourPrompt = useCallback(() => {
    // Dispatch event to trigger tour prompt pill
    window.dispatchEvent(new CustomEvent('dev:trigger-tour-prompt'));
    logger.info('[TriggersContent] Triggered tour prompt pill');
  }, []);

  const handleTriggerMaxGainAiHelpTooltip = useCallback(() => {
    window.dispatchEvent(
      new CustomEvent('dev:trigger-max-gain-ai-help-tooltip')
    );
    logger.info('[TriggersContent] Triggered Max Gain AI help tooltip');
  }, []);

  const handleTriggerOrderFilled = useCallback(() => {
    logger.info('[TriggersContent] Triggering order filled notification');
    // Dispatch custom event that Socket component will listen to
    window.dispatchEvent(
      new CustomEvent('dev:trigger-order-filled', {
        detail: {
          pair: 'BTC/USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchangeUUID: 'test-exchange',
          isPaperTrading: false,
          side: 'BUY',
          price: 50000,
          executedQty: 0.1,
          total: 5000,
          amount: 0.1,
          timestamp: new Date(),
        },
      })
    );
  }, []);

  const handleTriggerDealStarted = useCallback(() => {
    logger.info('[TriggersContent] Triggering deal opened notification');
    window.dispatchEvent(
      new CustomEvent('dev:trigger-deal-opened', {
        detail: {
          botName: 'Test Bot',
          pair: 'BTC/USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchangeUUID: 'test-exchange',
          isPaperTrading: false,
          timestamp: new Date(),
        },
      })
    );
  }, []);

  const handleTriggerDealCompleted = useCallback(() => {
    logger.info('[TriggersContent] Triggering deal closed notification');
    window.dispatchEvent(
      new CustomEvent('dev:trigger-deal-closed', {
        detail: {
          botName: 'Test Bot',
          pair: 'BTC/USDT',
          baseAsset: 'BTC',
          quoteAsset: 'USDT',
          exchangeUUID: 'test-exchange',
          isPaperTrading: false,
          profit: 200,
          profitPercentage: 4,
          timestamp: new Date(),
        },
      })
    );
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <ScrollArea className="h-full">
        <div className="p-md space-y-md">
          {/* Onboarding Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-xs text-base">
                <Sparkles className="h-4 w-4" />
                Onboarding & Tours
              </CardTitle>
              <CardDescription className="text-xs">
                Trigger onboarding flows and site tours
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-xs">
              <Button
                onClick={handleResetSurveyState}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Reset Survey State (Reload Page)
              </Button>
              <Button
                onClick={handleMarkSurveyCompleted}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Mark Survey as Completed (Test)
              </Button>
              <Button
                onClick={handleTriggerTourPrompt}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Trigger Tour Prompt Pill (Test)
              </Button>
              <Button
                onClick={handleTriggerMaxGainAiHelpTooltip}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Trigger Max Gain AI Help Popup
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                This will navigate to the dashboard and start the interactive
                tour.
              </p>
              <Button
                onClick={() => {
                  logger.info(
                    '[TriggersContent] Dispatching dev:toggle-onboarding-steps'
                  );
                  // MainLayout listens for this event and calls
                  // toggleOnboardingStepsVisible() — don't call it here too
                  // or the two toggles cancel out.
                  window.dispatchEvent(
                    new CustomEvent('dev:toggle-onboarding-steps')
                  );
                }}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Toggle Onboarding Steps List
              </Button>
              <Button
                onClick={() => {
                  logger.info(
                    '[TriggersContent] Dispatching dev:start-max-walkthrough'
                  );
                  // Cloud-only MaxDetachedPanel listens for this and calls
                  // openDetached() + startWalkthrough(). Custom event keeps
                  // core/ unaware of the cloud-only walkthrough state.
                  window.dispatchEvent(
                    new CustomEvent('dev:start-max-walkthrough')
                  );
                }}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Start Max Walkthrough
              </Button>
              <Button
                onClick={() => {
                  logger.info(
                    '[TriggersContent] Resetting maxWalkthroughSeen and reloading'
                  );
                  localStorage.removeItem('maxWalkthroughSeen');
                  window.location.reload();
                }}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Reset Max Walkthrough Seen
              </Button>
            </CardContent>
          </Card>

          {/* Trading Event Triggers */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-xs text-base">
                <Bell className="h-4 w-4" />
                Trading Events
              </CardTitle>
              <CardDescription className="text-xs">
                Simulate trading events for testing notifications and UI updates
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-xs">
              <Button
                onClick={handleTriggerOrderFilled}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Trigger Order Filled
              </Button>
              <Button
                onClick={handleTriggerDealStarted}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Trigger Deal Started
              </Button>
              <Button
                onClick={handleTriggerDealCompleted}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Trigger Deal Completed
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                These events are dispatched as custom window events. Listen
                with:
                <code className="block mt-1 p-1 bg-muted rounded text-xs">
                  window.addEventListener('dev:order-filled', handler)
                </code>
              </p>
            </CardContent>
          </Card>

          {/* Survey Mockup */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-xs text-base">
                <Sparkles className="h-4 w-4" />
                Survey Mockup
              </CardTitle>
              <CardDescription className="text-xs">
                Test the survey component and webhook integration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-md">
              <div className="flex flex-col gap-xs">
                <label className="text-sm font-medium">Display Mode</label>
                <div className="flex gap-xs">
                  {(['list', 'compact', 'stepper'] as const).map((mode) => (
                    <Button
                      key={mode}
                      variant={surveyDisplay === mode ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSurveyDisplay(mode)}
                      className="flex-1 capitalize"
                    >
                      {mode}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => setIsSurveyOpen(true)}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Trigger Survey Dialog
              </Button>
              <SurveyWrapper
                surveyId="dev-test-survey"
                mode="dialog"
                display={surveyDisplay}
                isOpen={isSurveyOpen}
                onClose={() => setIsSurveyOpen(false)}
                surveyName="Test Survey"
                questions={[
                  {
                    question: 'How likely are you to recommend us?',
                    type: 'rating',
                    lowestValueText: 'Not likely',
                    highestValueText: 'Very likely',
                  },
                  {
                    question: 'How do you like our service?',
                    type: 'choice',
                    options: ['Good', 'Bad', 'Okay'],
                  },
                  {
                    question: 'Any feedback?',
                    type: 'text',
                  },
                  {
                    question: 'Feature request?',
                    type: 'both',
                    options: ['New Bot', 'UI Improvement', 'Other'],
                  },
                ]}
              />
              <Button
                onClick={() => setIsOnboardingSurveyOpen(true)}
                className="w-full justify-start"
                variant="outline"
                size="sm"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Trigger Onboarding Survey
              </Button>
              <OnboardingSurvey
                forceOpen={isOnboardingSurveyOpen}
                onClose={() => setIsOnboardingSurveyOpen(false)}
              />
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950">
            <CardContent className="pt-4">
              <p className="text-xs text-blue-900 dark:text-blue-100">
                <strong>Note:</strong> These triggers are for development and
                testing only. They simulate events without making actual API
                calls or changing real data.
              </p>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
};
