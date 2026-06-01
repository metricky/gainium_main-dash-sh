import { useMemo } from 'react';

import type { BotExperienceDescriptor, BotExperienceId } from './types';
import { dcaExperience } from '../modules/dcaModule';
import { comboExperience } from '../modules/comboModule';
import { gridExperience } from '../modules/gridModule';
/* import {
  hedgeExperience,
  hedgeComboExperience,
  hedgeDcaExperience,
} from '../modules/hedgeModule'; */

const catalog = new Map<BotExperienceId, BotExperienceDescriptor>();
const legacyLookup = new Map<string, BotExperienceDescriptor>();

type ExperienceLoader = () => BotExperienceDescriptor;

const EXPERIENCE_LOADERS: ExperienceLoader[] = [
  () => dcaExperience,
  () => comboExperience,
  () => gridExperience,
  /*   () => hedgeExperience,
  () => hedgeDcaExperience,
  () => hedgeComboExperience, */
];

let initialized = false;
let cachedExperiences: BotExperienceDescriptor[] = [];

function ensureCatalogInitialized() {
  if (initialized) {
    return;
  }

  const descriptors: BotExperienceDescriptor[] = [];
  for (const load of EXPERIENCE_LOADERS) {
    const descriptor = load();
    descriptors.push(descriptor);
    catalog.set(descriptor.id, descriptor);
    if (descriptor.legacyIds) {
      for (const legacyId of descriptor.legacyIds) {
        legacyLookup.set(legacyId, descriptor);
      }
    }
  }

  cachedExperiences = descriptors;
  initialized = true;
}

export const BOT_EXPERIENCE_CATALOG: ReadonlyMap<
  BotExperienceId,
  BotExperienceDescriptor
> = catalog;

function getAvailableExperienceIds(): string {
  if (!initialized) {
    ensureCatalogInitialized();
  }

  return cachedExperiences.map((descriptor) => descriptor.id).join(', ');
}

export function listBotExperiences(): BotExperienceDescriptor[] {
  ensureCatalogInitialized();
  return cachedExperiences.slice();
}

export function getBotExperience(id: BotExperienceId): BotExperienceDescriptor {
  ensureCatalogInitialized();
  const descriptor = catalog.get(id);
  if (descriptor) {
    return descriptor;
  }

  const legacy = legacyLookup.get(id);
  if (legacy) {
    return legacy;
  }

  throw new Error(
    `Unknown bot experience '${id}'. Available experiences: ${getAvailableExperienceIds()}`
  );
}

export function tryGetBotExperience(
  id: BotExperienceId | undefined
): BotExperienceDescriptor | undefined {
  ensureCatalogInitialized();
  if (!id) {
    return undefined;
  }

  return catalog.get(id) ?? legacyLookup.get(id);
}

export function useBotExperience(id: BotExperienceId): BotExperienceDescriptor {
  return useMemo(() => getBotExperience(id), [id]);
}
