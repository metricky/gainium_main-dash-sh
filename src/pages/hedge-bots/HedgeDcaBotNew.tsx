/**
 * Hedge DCA bot — new (create) page.
 *
 * Step B.1 (current): skeleton scaffold to validate routing + provider mount.
 * Step B.2 will mount two BotFormProvider trees and the shared-settings
 * panel, with optional load-from-template via getHedgeDCABotSettings.
 *
 * Routes: `/hedge/bot/new` (mirrors legacy convention).
 */
import { useSearchParams } from 'react-router-dom';

import { PremiumUpgrade } from '@/components/license/PremiumUpgrade';
import MainLayout from '@/components/layout/MainLayout';
import { HedgeBotFormProvider } from '@/contexts/bots/form/HedgeBotFormProvider';
import { TradingTerminalUtilsProvider } from '@/context/TradingTerminalUtilsContext';
import { useLicense } from '@/lib/license';
import { BotTypesEnum } from '@/types';
import HedgeBotEditLayout from './HedgeBotEditLayout';

const HedgeDcaBotNewWidget = () => {
  // Premium gate via the license adapter.
  const { isPremium } = useLicense();
  const [searchParams] = useSearchParams();
  // The legacy "load from template" flow used `?load=<botId>` to seed defaults.
  // We honor the same shape so existing share/template links keep working.
  const loadFromBotId = searchParams.get('load') ?? undefined;

  if (!isPremium) {
    return (
      <MainLayout pageTitle="Hedge DCA Bot — New" activePage="/hedge/bot/new" navigationBack>
        <PremiumUpgrade
          feature="Hedge DCA bots"
          description="Creating hedge bots requires a premium license."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Hedge DCA Bot — New"
      activePage="/hedge/bot/new"
      fullyScrollable
      navigationBack
    >
      <HedgeBotFormProvider
        mode="create"
        botType={BotTypesEnum.hedgeDca}
        {...(loadFromBotId ? { botId: loadFromBotId } : {})}
      >
        <HedgeBotEditLayout />
      </HedgeBotFormProvider>
    </MainLayout>
  );
};

const HedgeDcaBotNew = () => (
  <TradingTerminalUtilsProvider>
    <HedgeDcaBotNewWidget />
  </TradingTerminalUtilsProvider>
);

export default HedgeDcaBotNew;
