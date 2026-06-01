/* eslint-disable spacing/no-hardcoded-font-size */
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { isWidgetTypeAvailable } from '@/components/widgets/dashboard';
import {
  getAllDashboardTemplates,
  type DashboardTemplate,
} from '@/stores/dashboardTemplates';
import { Check, LayoutDashboard, Sparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

interface CreateDashboardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingNames: string[];
  onConfirm: (args: { name: string; templateId?: string }) => void;
}

const BLANK_DEFAULT_NAME = 'New Dashboard';

const countAvailableWidgets = (template: DashboardTemplate): number =>
  template.widgets.filter((w) => isWidgetTypeAvailable(w.type)).length;

/** Append " (N)" until name doesn't collide. */
const uniquify = (base: string, existing: Set<string>): string => {
  if (!existing.has(base)) return base;
  let n = 2;
  while (existing.has(`${base} (${n})`)) n += 1;
  return `${base} (${n})`;
};

export const CreateDashboardDialog: React.FC<CreateDashboardDialogProps> = ({
  open,
  onOpenChange,
  existingNames,
  onConfirm,
}) => {
  const existingSet = useMemo(
    () => new Set(existingNames.map((n) => n.trim())),
    [existingNames]
  );

  // Default selection is Blank (templateId === undefined).
  const [selectedTemplateId, setSelectedTemplateId] = useState<
    string | undefined
  >(undefined);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  // Track whether the user has manually typed in the name field. While
  // false, picking a template overwrites the name with that template's
  // (uniquified) default. Once true, we never clobber their input.
  const userEditedName = useRef(false);

  // Live registry — cloud overlay extras are registered at boot.
  const templates = useMemo(
    () =>
      getAllDashboardTemplates()
        .map((t) => ({ template: t, count: countAvailableWidgets(t) }))
        .filter(({ count }) => count > 0),
    []
  );

  // Reset to defaults whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    userEditedName.current = false;
    setSelectedTemplateId(undefined);
    setName(uniquify(BLANK_DEFAULT_NAME, existingSet));
    setNameError(null);
  }, [open, existingSet]);

  const handlePickTemplate = (templateId: string | undefined) => {
    setSelectedTemplateId(templateId);
    if (!userEditedName.current) {
      const base =
        templateId === undefined
          ? BLANK_DEFAULT_NAME
          : (templates.find((t) => t.template.id === templateId)?.template
              .name ?? BLANK_DEFAULT_NAME);
      setName(uniquify(base, existingSet));
      setNameError(null);
    }
  };

  const validateName = (value: string): string | null => {
    const trimmed = value.trim();
    if (!trimmed) return 'Dashboard name is required';
    if (trimmed.length < 2)
      return 'Dashboard name must be at least 2 characters';
    if (trimmed.length > 50)
      return 'Dashboard name must be less than 50 characters';
    if (existingSet.has(trimmed))
      return 'A dashboard with this name already exists';
    return null;
  };

  const handleConfirm = () => {
    const err = validateName(name);
    if (err) {
      setNameError(err);
      return;
    }
    onConfirm({ name: name.trim(), templateId: selectedTemplateId });
    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleConfirm();
  };

  const cardBase =
    'relative text-left rounded-xl p-4 bg-card shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-2 h-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const cardSelected =
    'ring-2 ring-primary shadow-xl bg-primary/10 hover:bg-primary/10';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create New Dashboard</DialogTitle>
          <DialogDescription>
            Pick a template, name your dashboard, and start building.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <div className="mb-4">
            <label className="block text-xs uppercase tracking-wide text-muted-foreground mb-1.5">
              Dashboard name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                userEditedName.current = true;
                setName(e.target.value);
                setNameError(null);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Dashboard name"
              className="w-full px-3 py-2 border border-border/50 rounded-md bg-foreground/[0.04] hover:bg-foreground/[0.06] text-foreground placeholder-muted-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              autoFocus
            />
            {nameError && (
              <p className="mt-1.5 text-sm text-destructive">{nameError}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto px-1 py-1">
            <button
              type="button"
              onClick={() => handlePickTemplate(undefined)}
              className={`${cardBase} ${selectedTemplateId === undefined ? cardSelected : ''}`}
            >
              {selectedTemplateId === undefined && (
                <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
              )}
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium text-foreground">Blank</span>
              </div>
              <p className="text-xs text-muted-foreground">
                An empty dashboard — add widgets yourself.
              </p>
              <span className="mt-auto text-[11px] uppercase tracking-wide text-muted-foreground">
                0 widgets
              </span>
            </button>

            {templates.map(({ template, count }) => {
              const isSelected = selectedTemplateId === template.id;
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => handlePickTemplate(template.id)}
                  className={`${cardBase} ${isSelected ? cardSelected : ''}`}
                >
                  {isSelected && (
                    <Check className="absolute top-2 right-2 w-4 h-4 text-primary" />
                  )}
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="font-medium text-foreground">
                      {template.name}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">
                    {template.description}
                  </p>
                  <span className="mt-auto text-[11px] uppercase tracking-wide text-muted-foreground">
                    {count} widget{count === 1 ? '' : 's'}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Create Dashboard</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateDashboardDialog;
