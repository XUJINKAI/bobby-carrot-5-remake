import type { AudioBackend } from "../audio/AudioBackend.js";
import type { BobbyLocomotionTimingOverride } from "../entities/player/BobbyLocomotion.js";
import type { ImageManager } from "../image/ImageManager.js";
import type { ControlBinding } from "../input/ControlBindings.js";
import type { InputControllerOptions } from "../input/InputController.js";
import type { EngineTimingOptions } from "../time/EngineTiming.js";
import type { GameplayHudOptions } from "../ui/GameplayHud.js";
import type { PresentationTuningOverride } from "../visual/tuning/PresentationTuning.js";
import type { EconomyState, ProfileCapabilities } from "../world/GlobalState.js";
import type {
  EntityInstance,
  EntityState,
} from "../world/entity/EntityInstance.js";
import type { HistoryPolicy } from "./HistoryPolicy.js";

export type RuntimeEntityStateInitializer = (
  entity: Readonly<EntityInstance>,
) => EntityState | null | undefined;

export interface GameRuntimeOptions {
  hud?: boolean | GameplayHudOptions;
  input?: InputControllerOptions;
  tuning?: PresentationTuningOverride;
  bobbyLocomotion?: BobbyLocomotionTimingOverride;
  timing?: EngineTimingOptions;
  history?: HistoryPolicy;
  /** 具体运行时绑定；调用方也可以在加载后调用 setControlBindings。 */
  controls?: readonly ControlBinding[];
  /** Map Entity 实例化后应用的宿主 Runtime state patch；不会进入序列化结果。 */
  initializeEntityState?: RuntimeEntityStateInitializer;
}

export interface GameOptions {
  canvas: HTMLCanvasElement;
  images: ImageManager;
  audio?: AudioBackend;
  debug?: boolean;
  profile?: Partial<ProfileCapabilities>;
  economy?: Partial<EconomyState>;
  runtime?: GameRuntimeOptions;
}
