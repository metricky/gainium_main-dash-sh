import type { MultiTP } from '@/types';

const MIN_POSITION_SIZE = 1;
const MAX_TOTAL = 100;

/**
 * Redistributes position sizes when one target is adjusted.
 * Maintains 100% total by adjusting other targets starting from the first,
 * respecting minimum of 1% per target.
 *
 * @param targets - Array of targets with amount field
 * @param changedIndex - Index of the target being changed
 * @param newAmount - New amount for the changed target
 * @param boundPaths - Set of paths that are bound to variables (should not be adjusted)
 * @param getBindingPath - Function to get the binding path for a target
 * @returns Updated targets array with redistributed amounts
 */
export function redistributePositionSizes(
  targets: MultiTP[],
  changedIndex: number,
  newAmount: number,
  boundPaths: Set<string>,
  getBindingPath: (targetId: string) => string
): MultiTP[] {
  // Calculate max allowed for this target based on: 100% - 1%*(targets-1)
  const unboundCount = targets.filter((t, i) => {
    const path = getBindingPath(t.uuid);
    return i !== changedIndex && !boundPaths.has(path);
  }).length;

  const maxForThisTarget = MAX_TOTAL - unboundCount * MIN_POSITION_SIZE;
  const clampedNewAmount = Math.max(
    MIN_POSITION_SIZE,
    Math.min(maxForThisTarget, newAmount)
  );

  // Create a working copy
  const updatedTargets = [...targets];

  // Update the changed target
  updatedTargets[changedIndex] = {
    ...updatedTargets[changedIndex],
    amount: clampedNewAmount.toString(),
  };

  // Calculate how much we need to redistribute
  const currentTotal = updatedTargets.reduce((sum, target, index) => {
    if (index === changedIndex) {
      return sum + clampedNewAmount;
    }
    const amount = parseFloat(target.amount);
    return sum + (Number.isFinite(amount) ? amount : 0);
  }, 0);

  const difference = currentTotal - MAX_TOTAL;

  // If we're already at or under 100%, no redistribution needed
  if (difference <= 0) {
    return updatedTargets;
  }

  // We need to reduce other targets by 'difference' amount
  // Start from the FIRST target (index 0) and cascade through, respecting 1% minimum
  let remainingToReduce = difference;

  for (let i = 0; i < updatedTargets.length && remainingToReduce > 0.01; i++) {
    // Skip the changed target and bound targets
    if (i === changedIndex) {
      continue;
    }

    const path = getBindingPath(updatedTargets[i].uuid);
    if (boundPaths.has(path)) {
      continue;
    }

    const currentAmount = parseFloat(updatedTargets[i].amount);
    if (!Number.isFinite(currentAmount)) {
      continue;
    }

    // Calculate how much we can reduce from this target (down to 1% minimum)
    const maxReduction = currentAmount - MIN_POSITION_SIZE;
    if (maxReduction <= 0) {
      continue;
    }

    const reduction = Math.min(maxReduction, remainingToReduce);
    const newTargetAmount = currentAmount - reduction;

    updatedTargets[i] = {
      ...updatedTargets[i],
      amount: newTargetAmount.toFixed(2),
    };

    remainingToReduce -= reduction;
  }

  return updatedTargets;
}

/**
 * Distributes position sizes equally when adding a new target.
 *
 * @param targets - Array of targets including the new one
 * @param boundPaths - Set of paths that are bound to variables
 * @param getBindingPath - Function to get the binding path for a target
 * @returns Updated targets array with equal distribution
 */
export function distributePositionSizesEqually(
  targets: MultiTP[],
  boundPaths: Set<string>,
  getBindingPath: (targetId: string) => string
): MultiTP[] {
  // Count unbounded targets
  const unboundedIndices: number[] = [];
  let boundedTotal = 0;

  targets.forEach((target, index) => {
    const path = getBindingPath(target.uuid);
    if (boundPaths.has(path)) {
      const amount = parseFloat(target.amount);
      boundedTotal += Number.isFinite(amount) ? amount : 0;
    } else {
      unboundedIndices.push(index);
    }
  });

  // Calculate equal distribution for unbounded targets
  const availableTotal = MAX_TOTAL - boundedTotal;
  const unboundedCount = unboundedIndices.length;

  if (unboundedCount === 0) {
    return targets;
  }

  const equalAmount = Math.floor(availableTotal / unboundedCount);
  const remainder = Math.floor(availableTotal % unboundedCount);

  const updatedTargets = [...targets];

  unboundedIndices.forEach((index, position) => {
    const amount = position < remainder ? equalAmount + 1 : equalAmount;
    updatedTargets[index] = {
      ...updatedTargets[index],
      amount: amount.toString(),
    };
  });

  return updatedTargets;
}
