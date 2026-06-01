import { logger } from '@/lib/loggerInstance';
import type { ChartIndicatorConfig } from '@/types';
import {
  SUPPORTED_STUDY_NAMES,
  buildTradingViewStudyDescriptor,
} from './indicatorStudyConfig';

// Minimal chart interface to support createStudy
interface StudyCapableChart {
  createStudy?: (
    name: string,
    forceOverlay?: boolean,
    lock?: boolean,
    inputs?: Record<string, string | number | boolean>,
    overrides?: Record<string, unknown>,
    options?: Record<string, unknown>
  ) => Promise<string | null>;
  getAllStudies?: () => Array<{ id: string; name: string }>;
  removeEntity?: (entityId: string) => void;
  getStudyById?: (studyId: string) => {
    applyOverrides: (overrides: Record<string, unknown>) => Promise<void>;
  };
}

const SUPPORTED_STUDY_NAMES_LOWER = new Set(
  Array.from(SUPPORTED_STUDY_NAMES).map((name) => name.toLowerCase())
);

export async function addTradingViewIndicator(
  chart: StudyCapableChart,
  indicator: ChartIndicatorConfig
): Promise<void> {
  if (typeof chart.createStudy !== 'function') {
    logger.error('createStudy method not available on chart');
    return;
  }

  const descriptor = buildTradingViewStudyDescriptor(indicator);
  if (!descriptor) {
    logger.warn('Skipping unsupported indicator', {
      indicator,
    });
    return;
  }

  const { name, inputs, overrides, forceOverlay, options } = descriptor;

  // Custom indicators expose an `id` input that they pass to the
  // value-callback as the second arg. Stamp the source indicator's uuid
  // here so the chart's wrapper can correlate emitted values back to
  // the right indicator config (and decide whether to forward them via
  // `useCallback: true`). Mirrors legacy `getCommonConfig` which set
  // `id: config.uuid` for every callback-capable indicator.
  const inputsWithId: Record<string, string | number | boolean> = {
    ...inputs,
    id: indicator.uuid,
  };

  logger.info('[chart-indicators] About to create study', {
    name,
    forceOverlay,
    hasInputs: !!inputs,
    hasOverrides: !!overrides,
    hasOptions: !!options,
    options,
    inputs: inputsWithId,
    overrides,
  });

  try {
    const studyId = await chart.createStudy(
      name,
      forceOverlay ?? false,
      false,
      inputsWithId,
      overrides ?? {},
      options ?? {}
    );

    if (studyId) {
      logger.info('[chart-indicators] Created TradingView study', {
        studyId,
        name,
        inputs,
        overrides,
        options,
      });
    } else {
      logger.warn('[chart-indicators] TradingView returned null for study', {
        name,
      });
    }
  } catch (error) {
    logger.error(`Error creating indicator study ${name}`, error);
  }
}

export function clearCustomIndicators(chart: StudyCapableChart) {
  if (
    typeof chart.getAllStudies !== 'function' ||
    typeof chart.removeEntity !== 'function'
  ) {
    return;
  }

  try {
    const existingStudies = chart.getAllStudies() ?? [];
    existingStudies
      .filter(
        (study) =>
          study?.name &&
          SUPPORTED_STUDY_NAMES_LOWER.has(study.name.toLowerCase())
      )
      .forEach((study) => {
        try {
          chart.removeEntity?.(study.id);
          logger.info('Removed TradingView study for refresh', {
            id: study.id,
            name: study.name,
          });
        } catch (removeError) {
          logger.warn('Failed to remove TradingView study', {
            id: study.id,
            name: study.name,
            removeError,
          });
        }
      });
  } catch (error) {
    logger.warn('Failed to clear TradingView studies prior to update', error);
  }
}
