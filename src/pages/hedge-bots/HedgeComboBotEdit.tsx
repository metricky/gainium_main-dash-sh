/**
 * Hedge Combo bot — edit page.
 *
 * Step B.1 (current): skeleton scaffold to validate routing + provider mount.
 * Step B.2 will mount two BotFormProvider trees (long + short combo legs).
 *
 * Routes: `/hedge/combo/edit/:id` (mirrors legacy convention).
 */
import { useParams } from 'react-router-dom';

import { PremiumUpgrade } from '@/components/license/PremiumUpgrade';
import MainLayout from '@/components/layout/MainLayout';
import { HedgeBotFormProvider } from '@/contexts/bots/form/HedgeBotFormProvider';
import { TradingTerminalUtilsProvider } from '@/context/TradingTerminalUtilsContext';
import { useLicense } from '@/lib/license';
import { BotTypesEnum } from '@/types';
import HedgeBotEditLayout from './HedgeBotEditLayout';

const HedgeComboBotEditWidget = () => {
  // Premium gate via the license adapter.
  const { isPremium } = useLicense();
  const { id } = useParams<{ id: string }>();
  const hasBotId = !!id;

  if (!isPremium) {
    return (
      <MainLayout
        pageTitle="Hedge Combo Bot — Edit"
        activePage="/hedge/combo/edit"
        navigationBack
      >
        <PremiumUpgrade
          feature="Hedge combo bots"
          description="Editing hedge bots requires a premium license."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Hedge Combo Bot — Edit"
      activePage="/hedge/combo/edit"
      fullyScrollable
      navigationBack
    >
      {!hasBotId ? (
        <div className="p-lg">
          <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 px-md py-md text-amber-900">
            No hedge bot ID provided.
          </div>
        </div>
      ) : (
        <HedgeBotFormProvider
          mode="edit"
          botType={BotTypesEnum.hedgeCombo}
          botId={id}
        >
          <HedgeBotEditLayout />
        </HedgeBotFormProvider>
      )}
    </MainLayout>
  );
};

const HedgeComboBotEdit = () => (
  <TradingTerminalUtilsProvider>
    <HedgeComboBotEditWidget />
  </TradingTerminalUtilsProvider>
);

export default HedgeComboBotEdit;
