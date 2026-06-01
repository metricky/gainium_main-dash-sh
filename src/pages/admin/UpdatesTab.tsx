import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUpCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useAdminUpdates, useAdminUpgrade } from './useAdminApi';
import type { AdminUpdate } from '@/lib/api/adminClient';
import { getMeta } from './serviceCatalog';

type Row = AdminUpdate & { groupKey: string };

// Dedupe across services that share an image (e.g. all bots-* share
// main-app). The first row keeps the canonical group key; the rest get
// deduped by repo+current so the operator clicks Upgrade once.
function groupRows(rows: AdminUpdate[]): Row[] {
  const out: Row[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    const key = r.repo ? `${r.repo}:${r.current ?? ''}` : r.containerId;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ ...r, groupKey: key });
  }
  return out;
}

export function UpdatesTab() {
  const { data, isLoading, error, refetch, isFetching } = useAdminUpdates();
  const upgrade = useAdminUpgrade();
  const [pending, setPending] = useState<string | null>(null);

  const rows = useMemo(() => groupRows(data ?? []), [data]);
  const upgradable = useMemo(() => rows.filter((r) => r.hasUpdate), [rows]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-lg text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        Checking the registry for updates…
      </div>
    );
  }

  if (error) {
    return (
      <Card compact className="p-md text-destructive">
        Failed to load updates: {(error as Error).message}
        <div className="mt-sm">
          <Button size="sm" variant="outline" onClick={() => refetch()}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  async function run(service: string, tag: string) {
    setPending(service);
    try {
      await upgrade.mutateAsync({ service, tag });
    } finally {
      setPending(null);
    }
  }

  async function runAll() {
    setPending('all');
    try {
      for (const r of upgradable) {
        if (!r.latest) continue;
        await upgrade.mutateAsync({ service: r.service, tag: r.latest });
      }
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="space-y-lg">
      <div className="flex items-center justify-between flex-wrap gap-sm">
        <p className="text-sm text-muted-foreground">
          {upgradable.length === 0
            ? `All ${rows.length} image groups are up to date.`
            : `${upgradable.length} of ${rows.length} image groups have updates.`}
        </p>
        <div className="flex items-center gap-sm">
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Refreshing
              </>
            ) : (
              'Refresh'
            )}
          </Button>
          <Button
            size="sm"
            onClick={runAll}
            disabled={!upgradable.length || pending !== null}
          >
            {pending === 'all' ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <ArrowUpCircle className="w-4 h-4 mr-2" />
            )}
            Upgrade all
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-sm">
        {rows.map((r) => {
          const meta = getMeta(r.service);
          return (
            <Card key={r.groupKey} compact className="px-md py-sm">
              <div className="flex flex-col sm:flex-row sm:items-center gap-md">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-sm flex-wrap">
                    <span className="font-semibold text-sm">
                      {meta.label ?? r.service}
                    </span>
                    {r.hasUpdate ? (
                      <Badge variant="default">update available</Badge>
                    ) : (
                      <Badge variant="secondary">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        up to date
                      </Badge>
                    )}
                  </div>
                  {meta.description ? (
                    <div className="text-xs text-muted-foreground leading-snug">
                      {meta.description}
                    </div>
                  ) : null}
                  <div className="text-xs font-mono text-muted-foreground break-all">
                    {r.repo ?? r.image}
                  </div>
                  <div className="text-xs">
                    current:{' '}
                    <span className="font-mono">{r.current ?? '?'}</span>
                    {r.latest && r.latest !== r.current ? (
                      <>
                        {' '}
                        → latest:{' '}
                        <span className="font-mono text-primary">
                          {r.latest}
                        </span>
                      </>
                    ) : null}
                  </div>
                  {r.error ? (
                    <div className="text-xs text-destructive">{r.error}</div>
                  ) : null}
                </div>
                <div className="shrink-0">
                  <Button
                    size="sm"
                    disabled={!r.hasUpdate || !r.latest || pending !== null}
                    onClick={() => r.latest && run(r.service, r.latest)}
                  >
                    {pending === r.service ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    Upgrade
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {upgrade.error ? (
        <Card compact className="p-md text-destructive text-sm">
          Last upgrade failed: {(upgrade.error as Error).message}
        </Card>
      ) : null}
    </div>
  );
}
