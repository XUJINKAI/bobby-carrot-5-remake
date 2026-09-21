import type { AudioBackend } from "../audio/AudioBackend.js";
import type { OutcomeMusicOptions } from "../audio/LevelMusicController.js";
import type { BobbyLocomotionTimingOverride } from "../entities/player/BobbyLocomotion.js";
import type { ImageManager } from "../image/ImageManager.js";
import type { ControlBinding } from "../input/ControlBindings.js";
import type { InputControllerOptions } from "../input/InputController.js";
import type { CameraOptions } from "../render/Camera.js";
import type { EngineTimingOptions } from "../time/EngineTiming.js";
import type { GameplayHudOptions } from "../ui/GameplayHud.js";
import type { GameplayDialogControllerOptions } from "../ui/GameplayDialogController.js";
import type { PresentationTuningOverride } from "../visual/tuning/PresentationTuning.js";
import type { HistoryPolicy } from "./HistoryPolicy.js";
import type { EngineEnvironment } from "../environment/EngineEnvironment.js";
import type { AmbientVisualOptions } from "../visual/ambient/AmbientVisualRuntime.js";

export interface GameRuntimeOptions {
  camera?: CameraOptions;
  ambient?: AmbientVisualOptions;
  /** 宿主页面可覆盖地图基础音乐；null 表示基础曲目静音。 */
  levelMusicOverride?: string | null;
  /** 宿主页面可以分别关闭获胜或死亡终局音乐。 */
  outcomeMusic?: OutcomeMusicOptions;
  hud?: boolean | GameplayHudOptions;
  /** Engine 内建与宿主显式调用共用的 gameplay dialogue controller。 */
  dialog?: boolean | GameplayDialogControllerOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  timing?: EngineTimingOptions;
  history?: HistoryPolicy;
  /** 具体运行时绑定；调用方也可以在加载后调用 setControlBindings。 */
  controls?: readonly ControlBinding[];
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
