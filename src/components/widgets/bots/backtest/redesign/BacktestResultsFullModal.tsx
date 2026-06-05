/**
 * BacktestResultsFullModal.tsx — full-screen DCA backtest results modal.
 *
 * Recreates the chrome of the prototype `modalShell.jsx` (header with close
 * X, "Backtest results" title, pair + direction·strategy chips, an
 * exchange · interval · date-range subline, a Share affordance, and a
 * segmented Overview / Stats / Deals / Analysis tab bar) using the REAL
 * design tokens and the core `Dialog` primitive — no prototype CSS vars,
 * no inline-style soup.
 *
 * The body switches on the active tab:
 *  - Overview → RedesignOverviewTab  (new, ./tabs)
 *  - Deals    → RedesignDealsTab      (new, ./tabs)
 *  - Stats    → BacktestStatsTab      (existing, reused as-is)
 *  - Analysis → BacktestAnalysisTab   (existing, reused as-is)
 *
 * Stats/Analysis take a single `{ backtest: DCABacktestingResultHistory }`
 * prop, satisfied by `vm.raw` (the adapter always synthesizes a History
 * wrapper — see viewModel.ts::toHistory).
 *
 * The modal renders ONLY against the `BacktestViewModel`; nothing here
 * touches the raw engine result directly except through `vm.raw`.
 */

import { useState } from 'react';
import { Share2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import {
  BacktestAnalysisTab,
  BacktestStatsTab,
} from '@/components/widgets/bots/backtest';

import { RedesignOverviewTab } from './tabs/RedesignOverviewTab';
import { RedesignDealsTab } from './tabs/RedesignDealsTab';
import type { BacktestViewModel } from './viewModel';

const TABS = ['Overview', 'Stats', 'Deals', 'Analysis'] as const;
type TabKey = (typeof TABS)[number];

export interface BacktestResultsFullModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The adapted view model (built via `buildBacktestViewModel`). */
  vm: BacktestViewModel;
  /** Optional bot name, shown after the pair chip when provided. */
  botName?: string;
}

/** "Jun 5, 2026" — matches the prototype's GX.fmtDate. */
function fmtDate(t: number): string {
  if (!Number.isFinite(t) || t <= 0) return '—';
  return new Date(t).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Segmented tab bar — the prototype's `.g-tab` group: a `bg-muted`
 * container with the active item lifted to `bg-popover` (surface-2). No
 * borders, no underline (DESIGN_SYSTEM §3).
 */
function TabBar({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (t: TabKey) => void;
}) {
  return (
    <div
      role="tablist"
      aria-label="Backtest result sections"
      className="flex items-center gap-1 rounded-lg bg-muted p-1"
    >
      {TABS.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(t)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              'cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
              isActive
                ? 'bg-popover text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

export function BacktestResultsFullModal({
  open,
  onOpenChange,
  vm,
  botName,
}: BacktestResultsFullModalProps) {
  // Default to "Deals" per the prototype's ModalShell default active tab.
  const [active, setActive] = useState<TabKey>('Deals');

  // Analysis tab gating — mirror the host page: enable when there are deals
  // or periodic stats to chew on; the tab also self-handles the empty case.
  const analysisEnabled =
    (vm.raw.deals?.length ?? 0) > 0 ||
    (vm.raw.periodicStats?.length ?? 0) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="w-[96vw] max-w-[1400px] h-[92vh] max-h-[92vh] overflow-hidden flex flex-col p-0 bg-card"
      >
        {/* ── header (peer-surface separator → the one allowed hairline) ── */}
        <div className="flex flex-shrink-0 items-center gap-md border-b border-border/60 px-md py-sm">
          {/* close */}
          <button
            type="button"
            aria-label="Close"
            onClick={() => onOpenChange(false)}
            className="grid h-8 w-8 flex-shrink-0 cursor-pointer place-items-center rounded-lg bg-muted text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          {/* title + identity */}
          <div className="flex min-w-0 flex-col gap-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="text-base font-extrabold tracking-tight text-foreground">
                Backtest results
              </span>
              {vm.pair && (
                <Badge variant="secondary" className="font-medium">
                  {vm.pair}
                </Badge>
              )}
              <Badge variant="default" className="font-medium">
                {vm.direction} · {vm.strategy}
              </Badge>
              {botName && (
                <span className="truncate text-xs text-muted-foreground">
                  {botName}
                </span>
              )}
            </div>
            <div className="truncate text-xs text-muted-foreground/80">
              {[vm.exchange, vm.interval].filter(Boolean).join(' · ')}
              {(vm.exchange || vm.interval) && ' · '}
              {fmtDate(vm.from)} → {fmtDate(vm.to)}
            </div>
          </div>

          {/* right rail: tabs + share */}
          <div className="ml-auto flex flex-shrink-0 items-center gap-md">
            <TabBar active={active} onChange={setActive} />
            {/*
              Share placeholder: the fresh in-memory VM has no persisted
              backtest id / owner check yet, so the live ShareBacktestButton
              (which needs `backtestId` + `canShare`) can't be wired here.
              Render a quiet ghost affordance to preserve the prototype's
              header shape; once the result is persisted with an id this can
              swap to <ShareBacktestButton …/>.
              TODO(share): wire ShareBacktestButton when a persisted
              backtestId is threaded into the VM.
            */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled
              title="Share (available after the result is saved)"
            >
              <Share2 className="mr-1.5 h-3.5 w-3.5" />
              Share
            </Button>
          </div>
        </div>

        {/* ── body ── */}
        <div className="min-h-0 flex-1 overflow-auto p-md">
          {active === 'Overview' && <RedesignOverviewTab vm={vm} />}
          {active === 'Deals' && <RedesignDealsTab vm={vm} />}
          {active === 'Stats' && <BacktestStatsTab backtest={vm.raw} />}
          {active === 'Analysis' &&
            (analysisEnabled ? (
              <BacktestAnalysisTab backtest={vm.raw} />
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">
                No analysis data for this backtest.
              </div>
            ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BacktestResultsFullModal;
