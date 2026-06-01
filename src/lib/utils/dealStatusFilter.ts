import { DCADealStatusEnum, type GridFilterItem } from '@/types';

// The backend `dcaDealList` / `comboDealList` resolvers IGNORE a top-level
// `status` argument — they only read `dataGridInput`. A status filter therefore
// has to be expressed as a `filterModel` item, which the resolver merges over
// its active-only default (`status $in [open, error, start]`).
//
// These groups mirror the backend's `getBotDeals` split so the list-level
// queries agree with the per-bot drawer:
//   open   => open / start / error
//   closed => closed / canceled
const OPEN_GROUP: string[] = [
  DCADealStatusEnum.open,
  DCADealStatusEnum.start,
  DCADealStatusEnum.error,
];
const CLOSED_GROUP: string[] = [
  DCADealStatusEnum.closed,
  DCADealStatusEnum.canceled,
];

/** The set of raw status strings that make up the requested open/closed view. */
export function dealStatusGroup(
  status?: DCADealStatusEnum
): string[] | undefined {
  if (!status) return undefined;
  return status === DCADealStatusEnum.closed ? CLOSED_GROUP : OPEN_GROUP;
}

/** A `filterModel` item the backend honors for the requested status, or
 *  undefined when no status filter is requested. */
export function statusFilterItem(
  status?: DCADealStatusEnum
): GridFilterItem | undefined {
  const group = dealStatusGroup(status);
  if (!group) return undefined;
  return { field: 'status', id: 'status', operator: 'isAnyOf', value: group };
}
