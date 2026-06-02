# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.7.8] - 2026-06-02

### Added
- Hyperliquid builder fees.

## [2.7.7] - 2026-06-02

### Fixed
- Deal drawer chart opened from the Trading terminal no longer always shows "No
  chart data is available for the selected timeframe". The terminal passed the
  deal id as `botId`, breaking the bot lookup (and order/smart-order fetches);
  it now passes the real `botId`. The price chart also falls back to the deal's
  own exchange when the parent bot isn't in the live store (terminal deals,
  whose bots load with `terminal: false`), so the candlestick chart resolves.
- Exchange chip in the deal drawer truncates its label instead of overflowing
  the card when the exchange name is long.
- Bot-form investment slider now percentages off the real free balance of the
  selected asset (read from the live balance store), and never falls back to the
  exchange's total USD balance — that figure is denominated in the settlement
  asset and was wrong for a different quote asset (e.g. USDC vs USDT). A 0 now
  shows as a real 0.

## [2.7.6] - 2026-06-02

### Fixed
- Combo/DCA deal lists no longer merge live and paper deals on a trading-context
  switch. Deal queries now request the `paperContext` field (exposed by the
  backend) so each deal is scoped to its true context instead of being inferred
  from the active mode (which mis-tagged placeholder data during the switch).

### Added
- Trading-mode toggle (badge + sidebar/navbar switches) shows a spinner while
  the newly-selected context's data loads.

## [2.7.5] - 2026-06-02

### Fixed
- Base Order Size input now updates its coin icon when the currency reference
  is switched (base/quote/USD), matching the DCA order amount input. Both inputs
  share `resolveOrderSizeIconSymbol`.
- Footer "Capital required" chip now derives the whole-bot total from the same
  example-orders deal summary the DCA overview "Total Funds" tile uses (new
  `useBotDealCapital` hook), so the two agree when the order size is referenced
  in the base currency — previously the chip recomputed it standalone and
  mismatched.

## [2.7.4] - 2026-06-01

### Fixed
- Closing or canceling a deal now removes it from the active list immediately
  instead of waiting on a websocket update (there is no polling fallback):
  close/cancel/move optimistically update the deal store (cancel → canceled,
  leave/market-close → closed, move → dropped from the bot), and the deals
  list no longer resurrects a just-closed deal from its last-fetch snapshot.

### Changed
- Indicator configuration parity pass: interval-type fields filter their
  options to the selected exchange's supported candle intervals; STOCH band
  fields resolve the correct param key from `stochRange`; related bot-form
  section, indicator-dialog, and bot-card refactors.

## [2.7.3] - 2026-06-01

### Added
- Cancel button on a deal's pending DCA / add-funds / reduce-funds orders
  (parity with the legacy dashboard), with a confirmation dialog. Routes an
  add/reduce-funds order to `cancelPendingAddFundsDealOrder` and a plain
  order to `cancelTerminalDealOrder`, matching legacy.
- Deal detail is deep-linkable: opening a deal reflects `?dealId=` in the
  URL and a direct link re-opens it (one-shot, so Back/Close still work).
- Trial funnel analytics: a `trial_dialog_shown` event (with `source`)
  alongside `trial_started`, via a dedicated `trialEvents` registry.

### Fixed
- Canceling a deal order no longer fails with "Cannot access" — the cancel
  mutations now send the auth token + paper-context like every other call.
- An order canceled in another client no longer reappears — pending orders
  are re-fetched fresh and reconciled instead of restored stale from cache.

### Changed
- Deal cards in the bot drawer read clearly against the panel (elevation
  instead of blending into the glass surface).

## [2.7.2] - 2026-05-31

### Changed
- Bot form save row: cost moved out of the Create button into its own
  credits chip on the left (hover shows the per-component breakdown, now
  with decimals), added a "capital required" chip beside it (same
  token-icon-then-amount format; hover shows base orders / safety orders
  / available balance / % of available), and moved "Save as template"
  into the row's overflow (⋮) menu — so the save row now mirrors the
  backtest row's chips-left / button + menu-right layout. The capital
  chip follows the deposit side, showing the base coin + quantity for
  spot short / COIN-M futures instead of the quote amount.
- Help links across the bot form and the connect-exchange screen now
  render as `HelpArticlePill`s backed by a shared `helpUrl` parser;
  `Tooltip` was slimmed down to reuse them. Corrected/added help-article
  links on several settings rows (DCA type, smart grid orders, profit
  currency, reinvest).

### Fixed
- Saving a bot template with a hotkey no longer throws "Maximum update
  depth exceeded" — the template-shortcut sync effect no longer re-fires
  on the shortcut-store writes it triggers itself.

## [2.7.1] - 2026-05-31

### Added
- Bot events drawer: coin-pair icons and click-to-copy order/deal ID chips.

### Changed
- Bot events drawer now categorizes, searches, and paginates server-side
  (fetches a handful per tab via the `getBotEvents` `category`/`counts`
  fields). The "Recent" tab is the full activity feed; "Deals"/"Alerts" are
  filtered subsets. "Load more" is pinned at the bottom; event messages are
  click-to-expand.

### Fixed
- Bot events: order errors no longer render as completed "Sell Closed" trades;
  the event time is shown once (no longer duplicated); the year is hidden
  unless an event is over a year old.
- `copyToClipboard` falls back to `execCommand` when the async Clipboard API is
  unavailable or blocked, so copy works in more contexts.

## [2.7.0] - 2026-05-30

### Added
- Trial provider adapter (`useTrial` / `registerTrialProvider`) and an
  `exchange.trialPrompt` slot so the connect-exchange picker can offer
  premium exchanges behind a start-trial prompt for trial-eligible users.
- Error bots now surface their failure reason as a tooltip on the status
  chip (bot cards + Trading/Combo/Grid bot lists), via a new optional
  `tooltip` prop on `StatusChip`.

### Changed
- Premium exchanges are now selectable (tagged "Trial") for free users
  who still have a trial available; picking one opens the start-trial
  prompt instead of showing a disabled "(upgrade to use)" row. Once the
  trial is used up they revert to the disabled rows.
- Added `patch-package` with a `@radix-ui/react-compose-refs` patch that
  fixes ref-cleanup handling.

### Fixed
- DCA deal usage % now reads the base side for short spot / COIN-M deals
  instead of always the quote side, which made short combos and coin-m
  deals report 0% usage.

## [2.6.4] - 2026-05-30

### Added
- Top Deals widget on the Overview dashboard: ranks active deals by cost
  (default), value, unrealized PnL, PnL %, realized profit, or age, with a
  card/table view and the ranking selector in the table toolbar.

### Changed
- Login page now reads "Sign in or sign up" with a clearer subheading on
  cloud, so new users see they can create an account from the same page.
- Deal cards now surface the creation date/time as a tooltip on the
  trade-duration chip instead of a dedicated cell.

### Fixed
- Deal card hover actions are scoped per card again, so hovering one card no
  longer reveals every card's action buttons when shown inside a dashboard
  widget.

## [2.6.3] - 2026-05-29

### Added
- `isTrialAvailable` user query and an auth-store `refreshUser` action to
  re-fetch the user (subscription, balance, credits) after a plan change
  without clearing the session on a transient failure.

### Changed
- DCA "Total Funds" tile now shows base-currency funds for spot-short and
  coin-M futures bots (quote `$` figure unchanged for everything else).
- Base order section stays visible in DCA strategy settings even when
  editing a bot that has active deals.
- Error screen now includes the error stack and React component stack.

## [2.6.2] - 2026-05-29

### Changed
- Live stores hydration is now serialized through a single
  `liveStoreHydrationQueue` so the eight heavy IndexedDB-persisted
  stores (dca/combo/grid/hedge bots, transactions, deals, orders) read
  their blobs one at a time with a `requestIdleCallback` yield between
  each. Peak hydration heap drops from roughly the sum of all eight
  structured-clone payloads to roughly the largest single payload,
  which prevents the OOM tab crashes a heavy-trading user could hit on
  Windows Chrome (lower per-tab heap budget than macOS). No data or
  API change: existing stores just opt in via the new
  `createQueuedIndexedDBStorage` factory. Lightweight stores (UI
  settings, theme, etc.) keep `createIndexedDBStorage` — the queue
  overhead isn't worth it for small blobs.

## [2.6.1] - 2026-05-28

### Changed
- Bot forms: Quick / Manual toggle uses a clearly-visible primary-tinted
  pill for the selected option (matches the existing subtab pattern)
  instead of a subtle card-surface fill.
- Bot forms: when exchange/pair info loads, persisted amounts below the
  exchange minimum are now silently raised to the minimum (rounded up
  to the next valid step) instead of being shown as validation errors.
  Covers DCA base order + DCA step, Combo base + step, Grid budget,
  Terminal, and both Hedge legs. The bumped value is persisted back
  through the form's setter; values the user is editing are left
  alone. A single "Adjusted amounts to exchange minimum" info toast
  fires per bump pass.
- Info toasts trimmed across the app: removed the noisy "Downloading
  candles in background" and the per-pair "User fee for X is N%"
  notices (both fire during routine form interaction). Converted six
  user-action-with-caveat toasts from `info` to `warning`, and the
  backtest-requested confirmation to `success`. Added a Toasts policy
  section to `DESIGN_SYSTEM.md`.

## [2.6.0] - 2026-05-28

### Added
- Admin page to manage running containers, choose exchanges, and upgrade images. 

## [2.5.2] - 2026-05-28

### Fixed
- Bot forms (DCA / Terminal / Combo / Grid / Hedge): removed unintended
  auto-focus on the budget / base-order input so opening a new or edit
  page no longer jumps to that field.
- Combo bot form: restored the Backtest period / timeframe / run row
  above the Save Bot button (it had stopped rendering for combo).
- Combo bot form: budget input now shows the actual quote symbol
  instead of the literal "Quote" / "BAL 0 QUOTE" placeholder — combo
  inherits the normalized pair-key lookup from DCA's trading context.
- Combo bot form: "Combo grid strategy" section no longer introduces a
  border / extra elevation inside the parent card; matches the
  surrounding form per DESIGN_SYSTEM.md.
- Combo bot form: DCA Overview Total funds now includes the notional
  cost reserved by minigrid orders, not just the base order.
- Combo bot form: DCA Overview defaults to the orders table and hides
  the price graph — the graph rendered minigrid lines as if they were
  stop-loss / take-profit and didn't scale to combos with many grids.
  DCA and Grid forms keep their graph.

## [2.5.1] - 2026-05-28

### Changed
- Grid bot strategy settings: on futures exchanges (linear or coin-m),
  Profit Currency and Order Fixed In are now auto-set to match the
  margin asset and the corresponding rows are hidden — the user can't
  earn or denominate orders in anything other than the margin asset.
  Linear futures: `profitCurrency='quote'`, `orderFixedIn='base'`.
  Coin-m futures: `profitCurrency='quote'`, `orderFixedIn='quote'`.
- Grid bot strategy settings: replaced the broken custom Leverage input
  with the same Margin & Leverage block DCA/Combo use — Margin Type
  selector (isolated/cross), leverage NumberInput + LeverageSlider,
  per-pair max-leverage cap from `getLeverageBracket`, paper-trading +
  active-deals locking, and the standard notices. Factored the JSX into
  a shared `<MarginLeverageBlock />` component so the three bot types
  stay in sync. Fixes the `Leverage ? [object Object]` rendering that
  came from stringifying the GridLeverageState object.

### Fixed
- CoinSelect: picking a new pair via the swap (↔) icon on the trading-
  pair chip now actually updates the chart, backtest button, example
  orders, and risk-profile prices. The dialog returned a dashed
  `BTC-USDT` and the replace path wrote it straight to `formData.pair`,
  but the rest of the form keys `pairMetadata` by the undashed form
  (`BTCUSDT`) — the downstream lookup missed and every dependent panel
  stayed on the old pair. Normalize the symbol on write to match the
  regular add-pair flow.
- DCA bot view dialog (`/bot/view/<id>?tab=settings`): "DCA order
  amount" fields showed the USDT icon regardless of the bot's actual
  quote asset (e.g. a Hyperliquid BTC-USDC bot still displayed USDT).
  Root cause: `DCASettings` called `useDcaTradingContext(formData)`
  without the `bot` fallback, so when `ReadOnlyBotForm` seeded an empty
  `formData.pairMetadata` (no exchange query in readonly), the trading
  context's `quoteAsset` resolved to `undefined` → CoinIcon defaulted to
  USDT. Strategy Settings already passed `bot` for the same fallback;
  DCA Settings now matches.

## [2.5.0] - 2026-05-28

### Added
- Unified bot-list KPI strip: a shared `BotListStatsBoxes` component
  rendering Active Bots / Total P&L / Capital Deployed across DCA,
  Grid, Combo, HedgeDca, HedgeCombo, and the Trading page. Single
  source of truth via `computeBotListStats` + `combineBotListStats`
  in `useBotListStats`; each bot type passes its records through a
  small adapter into the same normalized shape.
- Hedge DCA / Hedge Combo bot list pages: KPI stats strip in the
  header (was previously stats-less). Sums per-leg `profit/assets/
  dealsInBot` since the hedge wrapper doesn't aggregate those.
- IndicatorConfigurationModal / InlineIndicatorConfig: per-field
  global-variable binding via `FieldVariableBinding` — bind indicator
  parameters to global variables instead of hard-coding values.
- DetailDrawer body: bottom spacer on mobile so the last item clears
  the floating bottom-nav and remains scrollable into view.

### Changed
- VariableChip: more compact layout (smaller padding, rounded-lg, no
  Link2 icon prefix) to fit denser indicator/setting rows.
- EmptyState placement on TradingBots / GridBots / ComboBots /
  HedgeDcaBots / HedgeComboBots: hoisted above the DataTable instead
  of being passed via `emptyContent`, matching the page-level
  empty-state pattern used elsewhere.
- DrawerDealsTable: trade-row clicks no longer force-open the detail
  drawer; respects the user's previously-selected drawer state.
- Exchanges page: `WidgetContainer layout="grid"` → `"flex"`; lets
  the inner exchange cards / table choose their own width without
  being stretched by an outer grid.

### Fixed
- ComboBots stats: "Accumulated Profit" and "Profit By Day" were both
  showing the same value as "Total Profit". Replaced with the unified
  KPI strip; the duplicate-value placeholders are gone.
- GridBots stats: "Accumulated Profit" duplicated "Total Profit", and
  "Profit By Day / Recent daily" was actually today's profit, not a
  daily average. Replaced with the unified KPI strip.
- DCA bot stats `activeBots` only counted `status === 'open'` — bots
  in `error/range/monitoring` were missing. Now uses canonical
  `isBotActive` from `botStatusUtils.ts`.
- Trading page stats aggregator: missing `'error'` from the active
  status list when fetching DCA/Combo/Grid bots — error-state bots
  were excluded from Total P&L and capital totals.
- Trading page Total Profit no longer drops Grid bots' unrealized
  PnL on the floor (the per-deal aggregator hardcoded `0` for Grid).
  Replaced with the bot-list aggregator that sums Grid profits in
  full.

## [2.4.2] - 2026-05-27

### Added
- NavigationSidebar: third "hidden" mode in addition to pinned /
  unpinned. Drag the right-edge handle further left from collapsed to
  fully hide; the sidebar reappears as an overlay when the cursor
  hovers the left viewport edge. Persisted via
  `navigationSidebarHidden` in `uiStore`. Short rightward drag from
  hidden restores hover-mode; long drag re-pins.
- OpenOrdersWidget: totals row footer for Realized P&L, Unrealized
  P&L, Net P&L, Cost, and Notional Value columns. Color-coded P&L
  totals (success/destructive) and respects privacy mode.
- BotForm: reset scroll to top when toggling between Quick and Manual
  modes so the scroll-spy doesn't promote whichever section happened
  to be visible at the previous offset.

### Fixed
- BotFormAlertSummary: long validation chips (e.g. "Base order amount
  must be more than 10 USDC") now truncate inside their parent row.
  Previous SettingsAlert-only fix didn't help because the chip lived
  inside a content-sized button → div chain where `max-w-full` had
  nothing definite to reference. Propagate `w-full min-w-0` down the
  alert summary's wrapper and trigger button so the chip's `max-w-full`
  resolves to the actual alerts-row width.

## [2.4.1] - 2026-05-27

### Fixed
- SettingsAlert: long warning/error chips (e.g. "Base order amount
  must be more than 10 USDC") now actually truncate inside their
  parent. Previous fix used `inline-flex max-w-full`, which doesn't
  reliably constrain when the parent has no explicit width — switched
  to `flex w-fit max-w-full` so the chip stays content-sized but is
  firmly capped at the parent's resolved width, and the inner span's
  `truncate` kicks in with an ellipsis.

## [2.4.0] - 2026-05-27

### Changed
- Single-bot Duplicate (DCA / Grid / Combo) now navigates to
  `/<route>/new?load=<id>` and opens the new-bot form pre-seeded from
  the source, matching the hedge clone flow. Previously the non-hedge
  flows silently created a new bot via API and only fired a toast.
  Bulk-clone paths (where they exist) keep the API-only behavior.

### Fixed
- DCA bot details "Clone" button navigated to `/bot/new?clone=<id>`,
  a param nothing read; switched to the `?load=` convention so it
  actually seeds the form.

## [2.3.0] - 2026-05-27

### Added
- `firstToolbarActionsCompact`, `customToolbarActionsCompact`,
  `finalToolbarActionsCompact` on DataTable — caller supplies a narrow
  variant of any toolbar action. When provided the responsive row swaps
  to the compact content under pressure instead of moving the action to
  the overflow menu, so caller-supplied buttons stay visible at any
  width.
- ResponsiveButtonRow publishes `onLayoutMetrics` with the actual width
  it needs to render every visible button at full size, letting the
  data-table size the inline search dynamically — no hard-coded width
  threshold.

### Changed
- ResponsiveButtonRow overflow algorithm simplified back to pure
  priority-based progression: compact lowest-priority buttons first,
  overflow lowest-priority first only after full compaction. The
  "smart single removal" heuristic was hiding caller-passed actions
  too eagerly; pure priority respects the caller's importance order.
- All custom toolbar actions across pages now share the ghost+labeled
  style with icon-only compact fallbacks: TradingBots / ComboBots /
  GridBots Archive toggles, GlobalVariables Refresh / Save / Cancel /
  Import / Add Variable, Exchanges Add Exchange, OpenOrdersWidget /
  DrawerDealsTable status filter and Open Deal button.

## [2.2.1] - 2026-05-27

### Changed
- Toolbar custom actions (Archive toggle on Trading/Combo/Grid bots,
  Refresh on Global Variables) now use the same ghost+labeled style
  as the standard toolbar buttons. Cards-mode Filters button on the
  bot listings switches to ghost too.
- Inline-search expansion threshold lowered from 900px to 400px so
  most tables show the expanded input by default; the icon-only fallback
  is reserved for genuinely cramped toolbars.

## [2.2.0] - 2026-05-27

### Added
- DataTable toolbar buttons now show icon + label (Resize, Filters,
  Columns, Cards) when there's room; compactContent stays icon-only
  for narrow widths.
- Search input collapses to a magnifying-glass button below a high
  toolbar-width threshold and expands as an absolute overlay on tap
  — overlay has rounded corners and ring border so it reads as a
  distinct element on any surface.

### Changed
- ResponsiveButtonRow overflow algorithm: progressive compaction is
  now interleaved with a single-button overflow probe. After each
  compaction step we re-check whether overflowing one wide hidable
  button alone would now fit — so labels drop one at a time and a
  wide caller-provided action overflows before utility icons.
- Responsive container switched to `flex-nowrap` + `min-w-0` so
  the row no longer briefly wraps to two lines during resize.
- All DataTable toolbar + pagination buttons use `variant="ghost"`
  (filter still uses `default` when active).
- DataTable toolbar button priorities reshuffled so card/list-view
  toggle sits just below column-visibility (which is neverOverflow).

### Fixed
- ResponsiveButtonRow no longer reserves overflow-menu space
  preemptively when there are no custom menu items; reservation
  happens only when a button actually needs to overflow.

## [2.1.3] - 2026-05-27

### Fixed
- Notifications: bot rows now mark-as-read server-side via
  `deleteBotMessage` (parity with legacy). Previously the single-row
  action sent `NaN` to `readPlatformNotificationByUser` and the bulk
  action only wrote to localStorage, leaving read state per-device
  and out of sync with the server.

### Removed
- `localStorage["readBotNotifications"]` client-side read tracking
  for bot notifications; bot read state is now backend-owned. The
  stale key is purged once on load.

## [2.1.2] - 2026-05-27

### Added
- Hedge bot tables (DCA + Combo): Name, Cost, Max cost, Avg daily,
  Annualized columns — closes the remaining gap with the standalone
  trading-bots table.

## [2.1.1] - 2026-05-27

### Changed
- Card primitive: no default border (surface contrast separates cards
  from the page background per DESIGN_SYSTEM.md §3); padding now uses
  spacing tokens (`py-md md:py-lg`, `px-md md:px-lg`) so it tracks
  compact / comfortable density.

### Fixed
- Card primitive: `min-w-0` so wide children (tables) shrink within
  constrained parents — their own `overflow-x-auto` actually scrolls
  instead of blowing out the layout.
- Settings page: horizontal-scroll bug on tablet / mobile when the
  API-keys or notification tables were visible.
- Settings page: spacing now matches Overview's density-toggle
  convention (`xs` compact ↔ `md` comfortable), outer page padding
  comes from `WidgetContainer` instead of being double-applied.
- Settings sidebar nav: rounded corners and outer margins on mobile.

## [2.1.0] - 2026-05-27

### Added
- Hedge bot card: full info parity with the standalone trading-bots
  card — Cost (current / max), Avg Daily, Annualized, total Deals; per
  leg now also shows Usage, Cost, Deals, Profit, and Unrealized PnL.
- Hedge bot card menu: full action set (Star, Start/Stop, Restart,
  Edit, Clone, View Backtests, Share Configuration, Duplicate, Archive,
  Delete) via the shared BotActionsMenuItems.
- Hedge bot tables (DCA + Combo): Long exchange, Short exchange, and
  Deals columns, plus a per-row actions cell mirroring the card menu.
- Hedge bot Clone: list-page Clone navigates to `/hedge/{bot|combo}/new?load=<id>`,
  the new-bot form fetches the source hedge bot, seeds both legs, and
  appends "(copy)" to each leg's name — matches the legacy duplicate
  flow.

### Changed
- Hedge bot card: leg tiles now use `bg-card` over the outer `bg-muted`
  (no border) per the surface ladder, replacing the previous
  border-heavy inset.
- HedgeBotFormProvider: `?load=<botId>` works in create mode too (the
  fetch was previously gated on edit mode, so clone-from-template was
  silently a no-op).
- useBotDelete: removes hedge bots from the hedge live stores so the
  list updates immediately on delete instead of waiting for a websocket
  refresh.
- computeHedgeUnPnl: also returns combined avgDaily / avgDailyPerc /
  annualizedReturn and per-leg cost, max cost, unrealized PnL, and
  utilisation so the card can render them without re-deriving.

## [2.0.2] - 2026-05-26

### Fixed
- SettingsAlert: long warning/error chips now truncate inside their
  container instead of overflowing the parent.
- NavigationSidebar: stop the hover-elevated sidebar from flickering on
  top of an open drawer/dialog while it is being resized — CSS
  `:has([role="dialog"][aria-modal="true"])` rule keeps the sidebar
  below the drawer whenever a modal is open.
- Bot drawer sticky tab nav: bumped z-index above the section content
  so inner Tabs labels (deal-start modes, take-profit type) no longer
  bleed through the translucent sticky bar.
- CoinSelect: drop the redesign-only quote/base filter that hid valid
  pairs when replacing the only configured pair.

### Changed
- SettingsRow: transparent by default. Stacked rows now rely on
  spacing/typography instead of an extra `bg-card` surface.
- Bot form sub-nav (`ScrollableFormTabNavigation`): square pill tabs
  (`rounded-md`) with `border-primary/60 bg-primary/10` active state;
  removed the double bottom-border and tightened padding/height.
- Read-only bot form sticky nav: floating rounded bar with translucent
  `bg-background/80` + `backdrop-blur` (matches the edit form pattern).
- DealStartSettings: shortened pair-prioritization descriptions to
  match the cleaner row spacing.

## [2.0.1] - 2026-05-26

### Fixed
- DataTable: actions column now renders last and stays pinned to the right
  edge. Two underlying bugs are addressed: `defaultColumnOrder` was emitting
  `accessorKey` strings react-table couldn't resolve (so it auto-appended
  mismatched columns past any right-pin), and the effective `state.columnOrder`
  did not reorder pinned columns. Pinned-right columns are also merged with
  defaults so stale persisted preferences no longer suppress a newly declared
  default pin.

## [2.0.0] - 2026-05-26

### Added
- First release of the v2 dashboard as `@gainium/main-dash-sh`. Vite/React SPA
  replacing the previous Next.js `main-dash` build (now shipped as the
  `frontend-legacy` image).
- Hedge bots: full Quick + Manual editor, local backtesting (no SSB variant),
  history table with bulk Delete + Export-as-JSON, Combined / Long / Short
  active view, DataTable-driven Backtests insights tab with count badge.
- Risk:Reward runtime: chart indicator callback wired through
  `RiskRewardRuntimeContext` so indicator-driven SL/TP updates land in the form.
- Backtest UX parity with DCA/Combo: footer inline progress, dialog progress,
  candle caching, profit-currency derived from `futures/coinm/profitCurrency`.
- TradingView chart: `iframe_loading_same_origin` enabled (load-bearing for
  v28 chunk loading); custom indicator value callback plumbed through
  `custom_indicators_getter`.
