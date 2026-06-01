/**
 * Hedge DCA bot — edit page.
 *
 * Step B.1 (current): skeleton scaffold to validate routing + provider mount.
 * Step B.2 will mount two BotFormProvider trees (long + short legs) inside
 * HedgeBotFormProvider, plus a shared-settings panel.
 *
 * Routes: `/hedge/bot/edit/:id` (mirrors legacy convention).
 */
import { useParams } from 'react-router-dom';

import { PremiumUpgrade } from '@/components/license/PremiumUpgrade';
import MainLayout from '@/components/layout/MainLayout';
import { HedgeBotFormProvider } from '@/contexts/bots/form/HedgeBotFormProvider';
import { TradingTerminalUtilsProvider } from '@/context/TradingTerminalUtilsContext';
import { useLicense } from '@/lib/license';
import { BotTypesEnum } from '@/types';
import HedgeBotEditLayout from './HedgeBotEditLayout';

const HedgeDcaBotEditWidget = () => {
  // Premium gate via the license adapter.
  const { isPremium } = useLicense();
  const { id } = useParams<{ id: string }>();
  const hasBotId = !!id;

  if (!isPremium) {
    return (
      <MainLayout pageTitle="Hedge DCA Bot — Edit" activePage="/hedge/bot/edit" navigationBack>
        <PremiumUpgrade
          feature="Hedge DCA bots"
          description="Editing hedge bots requires a premium license."
        />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      pageTitle="Hedge DCA Bot — Edit"
      activePage="/hedge/bot/edit"
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
          botType={BotTypesEnum.hedgeDca}
          botId={id}
        >
          <HedgeBotEditLayout />
        </HedgeBotFormProvider>
      )}
    </MainLayout>
  );
};

const HedgeDcaBotEdit = () => (
  <TradingTerminalUtilsProvider>
    <HedgeDcaBotEditWidget />
  </TradingTerminalUtilsProvider>
);

export default HedgeDcaBotEdit;
