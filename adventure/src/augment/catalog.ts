import { MapEntityTypeId, type LevelPatch } from "@bobby/model";
import { parseAdventureLevelId } from "../campaign.js";
import { hasAdventureItem, type AdventureSave } from "../save.js";
import { purchaseAdventureItem } from "./interactions.js";
import type { AdventureDialogueCopy } from "./dialogueCopy.js";
import type {
  AdventureAugmentation,
  AdventureInteractionContext,
} from "./types.js";

const EMPTY_AUGMENTATION: AdventureAugmentation = Object.freeze({
  levelPatches: Object.freeze([]),
});

const BONUS_DEATH_COUNTDOWN_SECONDS = 60;

function beaverShop(copy: AdventureDialogueCopy): AdventureAugmentation {
  return {
    levelPatches: [
      dialoguePatch(MapEntityTypeId.BEAVER, copy.beaverShop),
      dialoguePatch(MapEntityTypeId.SHOP_DREAM_MACHINE_TICKET, copy.displayDreamMachineTicket),
      dialoguePatch(MapEntityTypeId.SHOP_CLOUD9_TICKET, copy.displayCloud9Ticket),
      dialoguePatch(MapEntityTypeId.SHOP_STEREO_SYSTEM, copy.displayStereoSystem),
      dialoguePatch(MapEntityTypeId.SHOP_EXTRA_MUSIC, copy.displayExtraMusic),
      dialoguePatch(MapEntityTypeId.SHOP_SPEED_SHOES, copy.displaySpeedShoes),
      dialoguePatch(MapEntityTypeId.SHOP_COIN_RADAR, copy.displayCoinRadar),
      {
        operation: "add",
        entity: {
          type: MapEntityTypeId.PORTAL,
          x: 9,
          y: 13,
          channel: "beaver-shop-shortcut",
          color: "#54e8ff",
        },
      },
      {
        operation: "add",
        entity: {
          type: MapEntityTypeId.PORTAL,
          x: 17,
          y: 8,
          channel: "beaver-shop-shortcut",
          color: "#54e8ff",
        },
      },
      {
        operation: "set-fields",
        selector: { type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 },
        fields: { collectible: false },
      },
      {
        operation: "add",
        entity: {
          type: MapEntityTypeId.DREAM_MACHINE,
          x: 21,
          y: 8,
          dialogue: copy.shopMachine,
        },
      },
    ],
    levelPatchesFunction: createBeaverShopLevelPatches,
    interaction: (context) => interactWithBeaverShop(context, copy),
  };
}

function specialScenes(
  copy: AdventureDialogueCopy,
): Readonly<Record<string, AdventureAugmentation>> {
  return {
    "beaver-shop": beaverShop(copy),
    "dream-machine": {
      levelPatches: [
        dialoguePatch(MapEntityTypeId.BEAVER, copy.dreamMachineBeaver),
        dialoguePatch(
          MapEntityTypeId.DREAM_MACHINE,
          copy.dreamMachineMachine,
        ),
      ],
    },
    "cloud-9": {
      levelPatches: [
        dialoguePatch(
          MapEntityTypeId.SANDMAN,
          copy.cloud9Sandman,
        ),
      ],
    },
    "dreamland-reward": {
      levelPatches: [
        dialoguePatch(
          MapEntityTypeId.SANDMAN,
          copy.dreamlandSandman,
        ),
      ],
    },
  };
}

/** 每张 Adventure 内容的地图补丁与可选交互回调都从此目录读取。 */
export function adventureAugmentationFor(
  contentId: string,
  copy: AdventureDialogueCopy,
): AdventureAugmentation {
  const scene = specialScenes(copy)[contentId];
  if (scene) return scene;
  if (parseAdventureLevelId(contentId)?.kind === "bonus")
    return {
      levelPatches: [],
      levelPatchesFunction: (save) => createBonusLevelPatches(save, copy),
    };
  return EMPTY_AUGMENTATION;
}

function dialoguePatch(
  type: string,
  dialogue: string | readonly string[],
): LevelPatch {
  return {
    operation: "set-fields",
    selector: { type },
    fields: { dialogue },
  };
}

function createBeaverShopLevelPatches(
  save: AdventureSave,
): readonly LevelPatch[] {
  if (!hasAdventureItem(save, "golden-key")) return [];
  return [{
    operation: "replace-type",
    selector: { type: MapEntityTypeId.LOCK_KEY, x: 21, y: 6 },
    type: MapEntityTypeId.SHOP_EMPTY,
  }];
}

function createBonusLevelPatches(
  save: AdventureSave,
  copy: AdventureDialogueCopy,
): readonly LevelPatch[] {
  const ownsPermanentKey = hasAdventureItem(save, "golden-key");
  return [
    dialoguePatch(
      MapEntityTypeId.BEAVER,
      ownsPermanentKey
        ? copy.bonusWithKey
        : copy.bonusWithoutKey,
    ),
    {
      operation: "set-fields",
      selector: { type: MapEntityTypeId.LOCK },
      fields: {
        requireKey: !ownsPermanentKey,
        deathCountdownSeconds: BONUS_DEATH_COUNTDOWN_SECONDS,
      },
    },
  ];
}

async function interactWithBeaverShop(
  context: AdventureInteractionContext,
  copy: AdventureDialogueCopy,
): Promise<void> {
  if (
    context.request.objectType !== MapEntityTypeId.LOCK_KEY ||
    context.request.action !== "touch" ||
    context.request.x !== 21 ||
    context.request.y !== 6
  ) {
    return;
  }
  const selection = await context.presentDialogue({
    message: copy.purchaseQuestion,
    options: [
      { id: "purchase", label: copy.purchaseConfirm },
      { id: "cancel", label: copy.purchaseCancel },
    ],
  });
  if (selection.type !== "selected" || selection.optionId !== "purchase")
    return;
  const purchase = purchaseAdventureItem(
    context.save,
    "golden-key",
    "bonus-coins",
    1,
  );
  if (purchase.outcome === "purchased") {
    context.commitSave(purchase.save);
    context.replaceInteractedEntity(MapEntityTypeId.SHOP_EMPTY);
  }
  const outcome = {
    "already-owned": copy.superKeyAlreadyOwned,
    purchased: copy.superKeyPurchased,
    "insufficient-funds": copy.superKeyInsufficientFunds,
  }[purchase.outcome];
  await context.showDialogue(outcome);
}
