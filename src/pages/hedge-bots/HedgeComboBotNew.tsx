/**
 * Hedge Combo bot — new (create) page.
 *
 * Step B.1 (current): skeleton scaffold to validate routing + provider mount.
 * Step B.2 will mount two BotFormProvider trees (combo legs) and the
 * shared-settings panel, with optional load-from-template.
 *
 * Routes: `/hedge/combo/new` (mirrors legacy convention).
 */
import { useSearchParams } from 'react-router-dom';

import { PremiumUpgrade } from '@/components/license/PremiumUpgrade';
import MainLayout from '@/components/layout/MainLayout';
import { HedgeBotFormProvider } from '@/contexts/bots/form/HedgeBotFormProvider';
import { TradingTerminalUtilsProvider } from '@/context/TradingTerminalUtilsContext';
import { useLicense } from '@/lib/license';
import { BotTypesEnum } from '@/types';
import HedgeBotEditLayout from './HedgeBotEditLayout';

const HedgeComboBotNewWidget = () => {
  // Premium gate via the license adapter.
  const { isPremium } = useLicense();
  const [searchParams] = useSearchParams();
  const loadFromBotId = searchParams.get('load') ?? undefined;

  if (!isPremium) {
    return (
      <MainLayout
        pageTitle="Hedge Combo Bot — New"
        activePage="/hedge/combo/new"
        navigationBack
      >
        <PremiumUpgrade
          feature="Hedge combo bots"
          description="Creating hedge bots requires a premium license."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Hedge Combo Bot — New"
      activePage="/hedge/combo/new"
      fullyScrollable
      navigationBack
    >
      <HedgeBotFormProvider
        mode="create"
        botType={BotTypesEnum.hedgeCombo}
        {...(loadFromBotId ? { botId: loadFromBotId } : {})}
      >
        <HedgeBotEditLayout />
      </HedgeBotFormProvider>
    </MainLayout>
  );
};

const HedgeComboBotNew = () => (
  <TradingTerminalUtilsProvider>
    <HedgeComboBotNewWidget />
  </TradingTerminalUtilsProvider>
);

export default HedgeComboBotNew;
