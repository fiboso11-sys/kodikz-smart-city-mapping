/**
 * Survey Guidance Engine — Configuration
 *
 * All thresholds are configurable. No hardcoded magic numbers in engine logic.
 * Future admin settings panel can override these at runtime.
 */

export interface SgeCorridorConfig {
  onRouteMetres: number;
  warningMetres: number;
  offRouteMetres: number;
  gpsUnreliableAccuracyMetres: number;
}

export interface SgeTimeConfig {
  visualWarningMs: number;
  voiceWarningMs: number;
  supervisorAlertMs: number;
  hysteresisReturnMs: number;
}

export interface SgeHeadingConfig {
  correctDeg: number;
  monitorDeg: number;
  wrongDirectionDeg: number;
  wrongDirectionDurationMs: number;
  ignoreSpeedKmh: number;
}

export interface SgeSegmentConfig {
  defaultLengthMetres: number;
  minGpsSamples: number;
  minSpeedKmh: number;
  maxSpeedKmh: number;
}

export interface SgeCompletionConfig {
  notStartedPct: number;
  inProgressMaxPct: number;
  nearlyCompleteMaxPct: number;
  completionCandidatePct: number;
  completedPct: number;
}

export interface SgeVoiceConfig {
  cooldownMs: number;
  maxRepeats: number;
}

export interface SgeConfig {
  corridor: SgeCorridorConfig;
  time: SgeTimeConfig;
  heading: SgeHeadingConfig;
  segment: SgeSegmentConfig;
  completion: SgeCompletionConfig;
  voice: SgeVoiceConfig;
}

export const DEFAULT_SGE_CONFIG: SgeConfig = {
  corridor: {
    onRouteMetres: 15,
    warningMetres: 30,
    offRouteMetres: 30,
    gpsUnreliableAccuracyMetres: 40,
  },
  time: {
    visualWarningMs: 3_000,
    voiceWarningMs: 8_000,
    supervisorAlertMs: 15_000,
    hysteresisReturnMs: 3_000,
  },
  heading: {
    correctDeg: 45,
    monitorDeg: 90,
    wrongDirectionDeg: 90,
    wrongDirectionDurationMs: 5_000,
    ignoreSpeedKmh: 8,
  },
  segment: {
    defaultLengthMetres: 25,
    minGpsSamples: 2,
    minSpeedKmh: 3,
    maxSpeedKmh: 60,
  },
  completion: {
    notStartedPct: 0,
    inProgressMaxPct: 89,
    nearlyCompleteMaxPct: 97,
    completionCandidatePct: 98,
    completedPct: 100,
  },
  voice: {
    cooldownMs: 30_000,
    maxRepeats: 3,
  },
};

let _config: SgeConfig = { ...DEFAULT_SGE_CONFIG };

export function getSgeConfig(): Readonly<SgeConfig> {
  return _config;
}

export function setSgeConfig(partial: Partial<SgeConfig>): void {
  _config = {
    ..._config,
    ...partial,
    corridor: { ..._config.corridor, ...partial.corridor },
    time: { ..._config.time, ...partial.time },
    heading: { ..._config.heading, ...partial.heading },
    segment: { ..._config.segment, ...partial.segment },
    completion: { ..._config.completion, ...partial.completion },
    voice: { ..._config.voice, ...partial.voice },
  };
}

export function resetSgeConfig(): void {
  _config = { ...DEFAULT_SGE_CONFIG };
}
