import type { MultipleSLVarBindingPath } from '@/hooks/bots/global-variables/useBotVarBinding';
import type { MultiTP } from '@/types';

export const MAX_SL_ALLOCATION = 100;
const EPSILON = 1e-6;

interface MultiSlAllocationSummary {
  totalAllocation: number;
  rawRemainingAllocation: number;
  remainingAllocation: number;
  hasAllocationOverflow: boolean;
}

export const evaluateMultiSlAllocation = (
  targets: MultiTP[] | undefined,
  maxTotal: number = MAX_SL_ALLOCATION,
  overflowTolerance: number = EPSILON
): MultiSlAllocationSummary => {
  const totalAllocation = (targets ?? []).reduce((sum, target) => {
    const amount = Number(target?.amount);
    if (!Number.isFinite(amount)) {
      return sum;
    }
    return sum + Math.max(0, amount);
  }, 0);

  const rawRemainingAllocation = maxTotal - totalAllocation;
  const remainingAllocation = Math.max(0, rawRemainingAllocation);
  const hasAllocationOverflow = rawRemainingAllocation < -overflowTolerance;

  return {
    totalAllocation,
    rawRemainingAllocation,
    remainingAllocation,
    hasAllocationOverflow,
  };
};

export const calculateSlPriceFromPercent = (
  isShort: boolean,
  percentage: string,
  latestPrice: number
): string => {
  const percentValue = Number.parseFloat(percentage) || 0;
  const price = Number.isFinite(latestPrice) ? latestPrice : 0;

  if (price <= 0) {
    return '0';
  }

  const direction = isShort ? 1 : -1;
  const multiplier = 1 + (percentValue / 100) * direction;
  const result = price * multiplier;

  return result.toFixed(8);
};

export const calculateSlPercentFromPrice = (
  isShort: boolean,
  price: string,
  latestPrice: number
): string => {
  const resolvedPrice = Number.parseFloat(price) || 0;
  const basePrice = Number.isFinite(latestPrice) ? latestPrice : 0;

  if (resolvedPrice <= 0 || basePrice <= 0) {
    return '0';
  }

  const ratio = resolvedPrice / basePrice - 1;
  const direction = isShort ? 1 : -1;
  const percent = ratio * 100 * direction;

  return percent.toFixed(3);
};

export const sanitizeSlAmountInput = (value: string | number): number => {
  const numericValue =
    typeof value === 'number' ? value : Number.parseFloat(String(value));

  if (!Number.isFinite(numericValue)) {
    return 0;
  }

  const clamped = Math.min(Math.max(numericValue, 0), MAX_SL_ALLOCATION);
  return Math.round(clamped * 1000) / 1000;
};

export const getMultiSlBindingPath = (
  targetId: string,
  field: Extract<keyof MultiTP, 'target' | 'amount' | 'fixed'>
): MultipleSLVarBindingPath => `multiSl.${targetId}.${field}`;

export const clampSlTargetsToAllocation = (
  targets: MultiTP[],
  editedIndex: number,
  maxTotal: number,
  boundAmountPaths: Set<string>
): MultiTP[] => {
  const sanitizedTargets = targets.map((target) => {
    const path = getMultiSlBindingPath(target.uuid, 'amount');
    if (boundAmountPaths.has(path)) {
      return target;
    }

    const sanitized = sanitizeSlAmountInput(target.amount);
    return {
      ...target,
      amount: sanitized.toString(),
    };
  });

  const total = sanitizedTargets.reduce((sum, entry) => {
    const next = Number.parseFloat(entry.amount as string);
    return sum + (Number.isFinite(next) ? next : 0);
  }, 0);

  if (total <= maxTotal + EPSILON) {
    return sanitizedTargets;
  }

  let excess = total - maxTotal;

  const adjustableIndexes = sanitizedTargets
    .map((entry, index) => ({ entry, index }))
    .filter(({ index, entry }) => {
      if (index === editedIndex) {
        return false;
      }
      const path = getMultiSlBindingPath(entry.uuid, 'amount');
      return !boundAmountPaths.has(path);
    });

  let iterations = 0;
  while (excess > EPSILON && iterations < 1000) {
    let adjusted = false;

    for (const { index } of adjustableIndexes) {
      if (excess <= EPSILON) {
        break;
      }

      const current = Number.parseFloat(sanitizedTargets[index].amount);
      if (!Number.isFinite(current) || current <= 0) {
        continue;
      }

      const reduction = Math.min(current, excess);
      const nextValue = Math.max(0, current - reduction);
      sanitizedTargets[index] = {
        ...sanitizedTargets[index],
        amount: Math.round(nextValue * 1000) / 1000 + '',
      };
      excess -= reduction;
      adjusted = true;
    }

    if (!adjusted) {
      break;
    }

    iterations += 1;
  }

  if (excess > EPSILON) {
    sanitizedTargets.forEach((entry, index) => {
      if (index === editedIndex) {
        return;
      }
      const path = getMultiSlBindingPath(entry.uuid, 'amount');
      if (boundAmountPaths.has(path)) {
        return;
      }
      sanitizedTargets[index] = {
        ...entry,
        amount: '0',
      };
    });
  }

  return sanitizedTargets;
};

export const hasConfiguredMultiSlTargets = (
  targets: MultiTP[] | null | undefined
): boolean => {
  if (!Array.isArray(targets)) {
    return false;
  }

  return targets.some((target) => {
    if (!target) {
      return false;
    }

    const percentage = Number(target.target);
    const amount = Number(target.amount);

    const hasPercentage =
      Number.isFinite(percentage) && Math.abs(percentage) > 1e-3;
    const hasAmount = Number.isFinite(amount) && amount > 1e-3;

    return hasPercentage || hasAmount;
  });
};
