import type { AudioBackend } from "../audio/AudioBackend.js";
import type { BobbyLocomotionTimingOverride } from "../entities/player/BobbyLocomotion.js";
import type { ImageManager } from "../image/ImageManager.js";
import type { ControlBinding } from "../input/ControlBindings.js";
import type { InputControllerOptions } from "../input/InputController.js";
import type { CameraOptions } from "../render/Camera.js";
import type { EngineTimingOptions } from "../time/EngineTiming.js";
import type { GameplayHudOptions } from "../ui/GameplayHud.js";
import type { PresentationTuningOverride } from "../visual/tuning/PresentationTuning.js";
import type { InitialActorIntent } from "../world/movement/WorldIntent.js";
import type { HistoryPolicy } from "./HistoryPolicy.js";
import type { EngineEnvironment } from "../environment/EngineEnvironment.js";

export interface GameRuntimeOptions {
  camera?: CameraOptions;
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  timing?: EngineTimingOptions;
  history?: HistoryPolicy;
  /** 具体运行时绑定；调用方也可以在加载后调用 setControlBindings。 */
  controls?: readonly ControlBinding[];
  /** 每次从 LevelMap 起点创建 World 时应用，并以稳定位置引用进入 Replay。 */
  initialActorIntents?: readonly InitialActorIntent[];
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  images: ImageManager;
  /** World、表现层、校验和 Replay 必须共享同一份能力组合。 */
  environment?: EngineEnvironment;
  audio?: AudioBackend;
  debug?: boolean;
  runtime?: GameRuntimeOptions;
}
