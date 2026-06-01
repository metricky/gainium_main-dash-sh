import React, {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { Search, Loader2 } from 'lucide-react';
import type { GlobalVariable } from '@/types/globalVariables';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

export type VarToSearchType = 'text' | 'int' | 'float' | 'number';

interface VariablesSearchProps {
  onSelect: (variable: GlobalVariable) => void;
  variable?: GlobalVariable | null;
  varType: VarToSearchType;
  availableVariables: GlobalVariable[];
  onSearchChange?: (search: string) => void;
  loading?: boolean;
}

export const VariablesSearch: React.FC<VariablesSearchProps> = ({
  onSelect,
  variable,
  varType,
  availableVariables,
  onSearchChange,
  loading = false,
}) => {
  const [search, setSearch] = useState(variable?.name || '');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when component mounts
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search callback
  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => {
      onSearchChange?.(search);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [search, onSearchChange]);

  // Filter variables based on type and search
  const filteredVariables = useMemo(() => {
    let filtered = availableVariables;

    // Filter by type
    if (varType === 'float') {
      filtered = filtered.filter((v) => v.type === 'float');
    } else if (varType === 'int') {
      filtered = filtered.filter((v) => v.type === 'int');
    } else if (varType === 'number') {
      filtered = filtered.filter((v) => v.type === 'float' || v.type === 'int');
    }

    // Filter by search text
    if (search) {
      filtered = filtered.filter((v) =>
        v.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    return filtered.sort((a, b) => b.id.localeCompare(a.id));
  }, [availableVariables, varType, search]);

  const handleSelect = useCallback(
    (v: GlobalVariable) => {
      onSelect(v);
    },
    [onSelect]
  );

  return (
    <div className="flex flex-col h-full">
      {/* Search Input */}
      <div className="px-3 py-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search variables..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {/* Variables List */}
      <ScrollArea className="flex-1">
        <div className="p-xs">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filteredVariables.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              {search ? 'No variables found' : 'No variables available'}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredVariables.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => handleSelect(v)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md',
                    'hover:bg-accent hover:text-accent-foreground',
                    'focus:bg-accent focus:text-accent-foreground',
                    'focus:outline-none transition-colors',
                    variable?.id === v.id && 'bg-accent/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {v.type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Value: {v.value}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Info */}
      {filteredVariables.length > 0 && !loading && (
        <div className="px-3 py-2 border-t border-border text-xs text-muted-foreground">
          {filteredVariables.length} variable
          {filteredVariables.length !== 1 ? 's' : ''} found
        </div>
      )}
    </div>
  );
};
