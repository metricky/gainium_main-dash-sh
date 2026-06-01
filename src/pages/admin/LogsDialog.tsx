import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  getAdminBaseUrl,
  isAdminApiConfigured,
} from '@/lib/api/adminClient';
import { useAuthStore } from '@/stores/authStore';
import { Download, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getMeta } from './serviceCatalog';

const TAIL_OPTIONS = [
  { value: 500, label: '500 lines' },
  { value: 1000, label: '1k lines' },
  { value: 2500, label: '2.5k lines' },
  { value: 5000, label: '5k lines' },
] as const;

const DEFAULT_TAIL = 500;

interface LogEntry {
  /** Monotonic id for React keys. */
  id: number;
  level: 'log' | 'error';
  text: string;
}

interface LogsDialogProps {
  open: boolean;
  service: string | null;
  onOpenChange: (open: boolean) => void;
}

export function LogsDialog({ open, service, onOpenChange }: LogsDialogProps) {
  const [lines, setLines] = useState<LogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [tail, setTail] = useState<number>(DEFAULT_TAIL);
  // Goes true once we get the first event (or end/error) — surfaces a
  // "connecting…" state in the empty view.
  const [connected, setConnected] = useState(false);

  // Tracks whether the user is "pinned" to the bottom of the log view.
  // If they scroll up, we stop auto-scrolling so we don't yank their
  // reading position.
  const containerRef = useRef<HTMLDivElement | null>(null);
  const pinnedRef = useRef(true);
  const esRef = useRef<EventSource | null>(null);
  const idRef = useRef(0);

  function maybeAutoScroll() {
    if (!pinnedRef.current) return;
    const el = containerRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }

  function onScroll() {
    const el = containerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    pinnedRef.current = distanceFromBottom < 32;
  }

  const pushLines = useCallback((level: 'log' | 'error', text: string) => {
    // A single SSE event can carry many newlines; split so each row
    // gets its own monospace line with its own color.
    const parts = text.split('\n');
    setLines((prev) => {
      const next = prev.slice();
      for (const part of parts) {
        if (!part) continue;
        idRef.current += 1;
        next.push({ id: idRef.current, level, text: part });
      }
      return next;
    });
    setConnected(true);
    requestAnimationFrame(maybeAutoScroll);
  }, []);

  function closeStream() {
    esRef.current?.close();
    esRef.current = null;
  }

  // Open an SSE stream — admin-sh seeds it with the last `tailN` lines
  // (history) and then follows live. EventSource handles auto-reconnect
  // on transient drops. Token rides on the query param because
  // EventSource can't carry custom headers; admin-sh's authMiddleware
  // accepts either Bearer or ?token=.
  const startStream = useCallback(
    (svc: string, tailN: number) => {
      closeStream();
      setError(null);
      setLines([]);
      setConnected(false);
      idRef.current = 0;

      const baseUrl = getAdminBaseUrl();
      if (!baseUrl) {
        setError('Admin API not configured');
        return;
      }
      const token = useAuthStore.getState().tokens?.accessToken ?? '';
      const url =
        `${baseUrl}/api/containers/${encodeURIComponent(svc)}/logs/stream` +
        `?tail=${tailN}&token=${encodeURIComponent(token)}`;
      const es = new EventSource(url);
      esRef.current = es;

      es.addEventListener('log', (ev) => {
        try {
          pushLines('log', JSON.parse((ev as MessageEvent).data));
        } catch {
          pushLines('log', String((ev as MessageEvent).data));
        }
      });

      es.addEventListener('error', (ev) => {
        // Two error shapes:
        //  - SSE-level transport error (no MessageEvent.data) — let
        //    EventSource try to reconnect on its own; only surface a
        //    note if the connection is permanently closed.
        //  - Server-sent `event: error` payload — inline as an error row.
        const msg = (ev as MessageEvent).data;
        if (typeof msg === 'string' && msg.length > 0) {
          try {
            pushLines('error', JSON.parse(msg));
          } catch {
            pushLines('error', msg);
          }
        } else if (es.readyState === EventSource.CLOSED) {
          setError('Connection closed.');
          setConnected(false);
        }
      });

      es.addEventListener('end', () => {
        closeStream();
        setConnected(false);
      });
    },
    [pushLines]
  );

  // Open the stream whenever the dialog opens or the service / tail
  // changes. Close it on close.
  useEffect(() => {
    if (!open || !service || !isAdminApiConfigured()) {
      closeStream();
      return;
    }
    startStream(service, tail);
    return () => {
      closeStream();
    };
  }, [open, service, tail, startStream]);

  // Reset transient state when the dialog closes so the next open starts
  // clean. Belt-and-suspenders: also close the stream here in case the
  // dialog hides content without unmounting it (some Dialog primitives
  // do that for exit animations).
  useEffect(() => {
    if (!open) {
      closeStream();
      setLines([]);
      setError(null);
      setConnected(false);
      idRef.current = 0;
    }
  }, [open]);

  // Final safety net: tear down the EventSource on unmount no matter
  // what other effects ran. EventSource leaks block HTTP/1.1 connection
  // slots, so we don't want to rely on the deps array alone.
  useEffect(() => {
    return () => {
      closeStream();
    };
  }, []);

  function onExport() {
    if (!service) return;
    const text = lines.map((l) => l.text).join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const ts = new Date().toISOString().replace(/[:.]/g, '-');
    a.href = url;
    a.download = `${service}-logs-${ts}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function onClear() {
    setLines([]);
    idRef.current = 0;
    pinnedRef.current = true;
  }

  const meta = service ? getMeta(service) : null;
  const lineCount = lines.length;
  const streaming = esRef.current !== null && open;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Logs · {meta?.label ?? service ?? ''}</span>
            {service ? (
              <span className="text-xs font-mono text-muted-foreground">
                {service}
              </span>
            ) : null}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-sm">
          <div className="flex items-center gap-sm flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-xs text-muted-foreground">Tail:</span>
              <Select
                value={String(tail)}
                onValueChange={(v) => setTail(Number(v))}
              >
                <SelectTrigger className="h-8 w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAIL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={String(o.value)}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onClear}
              disabled={!lineCount}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear view
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={onExport}
              disabled={!lineCount}
            >
              <Download className="w-4 h-4 mr-2" />
              Export .txt
            </Button>

            {error ? (
              <span className="text-xs text-destructive">{error}</span>
            ) : null}
          </div>

          <div
            ref={containerRef}
            onScroll={onScroll}
            className="h-[60vh] overflow-auto rounded-md border bg-black/90 font-mono text-xs leading-relaxed p-3"
          >
            {lineCount === 0 ? (
              <span className="text-muted-foreground italic">
                {streaming && !connected
                  ? 'Connecting…'
                  : streaming
                    ? 'Waiting for log output…'
                    : 'No logs.'}
              </span>
            ) : (
              lines.map((l) => (
                <div
                  key={l.id}
                  className={
                    l.level === 'error'
                      ? 'text-rose-300 whitespace-pre-wrap'
                      : 'text-emerald-100 whitespace-pre-wrap'
                  }
                >
                  {l.text}
                </div>
              ))
            )}
          </div>

          <div className="text-xs text-muted-foreground flex items-center justify-between">
            <span>
              {lineCount ? `${lineCount.toLocaleString()} lines` : '—'}
            </span>
            {streaming ? (
              <span className="inline-flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Streaming
              </span>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
