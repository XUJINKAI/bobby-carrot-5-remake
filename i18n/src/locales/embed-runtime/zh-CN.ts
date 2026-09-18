const catalog = {
  "embedRuntime.won": "通关",
  "embedRuntime.dead": "失败",
  "embedRuntime.restart": "重新开始",
  "embedRuntime.official": "前往官网",
  "embedRuntime.open": "在新窗口打开",
  "embedRuntime.mute": "关闭声音",
  "embedRuntime.unmute": "打开声音",
  "embedRuntime.joystick": "切换屏幕摇杆",
  "embedRuntime.movementHint": "WASD / 方向键移动",
} as const;

export type EmbedRuntimeTranslationKey = keyof typeof catalog;
export default catalog;
