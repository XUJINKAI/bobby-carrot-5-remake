export const DEFAULT_WORLD_HZ = 16;
export const DEFAULT_PRESENTATION_HZ = 60;
export const DEFAULT_WORLD_SPEED = 1;
export const DEFAULT_PRESENTATION_SPEED = 1;

export interface EngineTimingOptions {
  /** Gameplay / World 固定逻辑频率。改变它只改变逻辑采样精度，不改变以 ms 表达的游戏时长。 */
  worldHz?: number;
  /** 表现层采样频率。可独立于 World，例如 modern=60、retro=16。 */
  presentationHz?: number;
  /** World gameplay 时间相对真实时间的推进倍率。 */
  worldSpeed?: number;
  /** Presentation 时间相对真实时间的推进倍率。 */
  presentationSpeed?: number;
}

export interface EngineTiming {
  worldHz: number;
  worldStepMs: number;
  presentationHz: number;
  presentationStepMs: number;
  worldSpeed: number;
  presentationSpeed: number;
}

export function resolveEngineTiming(
  options: EngineTimingOptions = {},
): EngineTiming {
  const worldHz = normalizeHz(options.worldHz, DEFAULT_WORLD_HZ);
  const presentationHz = normalizeHz(
    options.presentationHz,
    DEFAULT_PRESENTATION_HZ,
  );
  return {
    worldHz,
    worldStepMs: 1000 / worldHz,
    presentationHz,
    presentationStepMs: 1000 / presentationHz,
    worldSpeed: normalizeSpeed(options.worldSpeed, DEFAULT_WORLD_SPEED),
    presentationSpeed: normalizeSpeed(
      options.presentationSpeed,
      DEFAULT_PRESENTATION_SPEED,
    ),
  };
}

function normalizeHz(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? value! : fallback;
}

function normalizeSpeed(value: number | undefined, fallback: number): number {
  return Number.isFinite(value) && (value ?? 0) > 0 ? value! : fallback;
}
