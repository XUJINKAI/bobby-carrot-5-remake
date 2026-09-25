/** Adventure 只声明文案身份；具体语言由加载关卡的宿主提供。 */
export const ADVENTURE_DIALOGUE_STRING_KEYS = [
  "superKeyAlreadyOwned",
  "superKeyPurchased",
  "superKeyInsufficientFunds",
  "bonusWithoutKey",
  "bonusWithKey",
  "displayDreamMachineTicket",
  "displayCloud9Ticket",
  "displayStereoSystem",
  "displayExtraMusic",
  "displaySpeedShoes",
  "displayCoinRadar",
  "dreamMachineBeaver",
  "dreamMachineMachine",
  "cloud9Sandman",
  "dreamlandSandman",
  "purchaseQuestion",
  "purchaseConfirm",
  "purchaseCancel",
] as const;

export const ADVENTURE_DIALOGUE_ARRAY_KEYS = [
  "beaverShop",
  "shopMachine",
] as const;

export type AdventureDialogueCopy =
  Readonly<Record<typeof ADVENTURE_DIALOGUE_STRING_KEYS[number], string>> &
  Readonly<Record<typeof ADVENTURE_DIALOGUE_ARRAY_KEYS[number], readonly string[]>>;
