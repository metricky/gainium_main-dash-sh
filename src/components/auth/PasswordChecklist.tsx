import { Check, X } from 'lucide-react';
import React from 'react';

export const MIN_PASSWORD_LENGTH = 6;

interface PasswordChecklistProps {
  password: string;
  confirmPassword: string;
  onChange: (isValid: boolean) => void;
}

interface Rule {
  label: string;
  passes: (password: string, confirm: string) => boolean;
}

const RULES: Rule[] = [
  {
    label: `At least ${MIN_PASSWORD_LENGTH} characters`,
    passes: (p) => p.length >= MIN_PASSWORD_LENGTH,
  },
  {
    label: 'Contains a number',
    passes: (p) => /\d/.test(p),
  },
  {
    label: 'Contains an uppercase letter',
    passes: (p) => /[A-Z]/.test(p),
  },
  {
    label: 'Passwords match',
    passes: (p, c) => p.length > 0 && p === c,
  },
];

export const PasswordChecklist: React.FC<PasswordChecklistProps> = ({
  password,
  confirmPassword,
  onChange,
}) => {
  const results = RULES.map((r) => ({
    label: r.label,
    ok: r.passes(password, confirmPassword),
  }));

  const allValid = results.every((r) => r.ok);
  React.useEffect(() => {
    onChange(allValid);
  }, [allValid, onChange]);

  return (
    <ul className="space-y-xs text-xs">
      {results.map((r) => (
        <li
          key={r.label}
          className={
            r.ok
              ? 'flex items-center gap-xs text-emerald-600 dark:text-emerald-400'
              : 'flex items-center gap-xs text-muted-foreground'
          }
        >
          {r.ok ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <X className="w-3.5 h-3.5" />
          )}
          <span>{r.label}</span>
        </li>
      ))}
    </ul>
  );
};
