const catalog = {
  "embedRuntime.won": "已完成",
  "embedRuntime.dead": "失败",
  "embedRuntime.restart": "重新开始",
  "embedRuntime.official": "前往官网",
  "embedRuntime.open": "在新窗口打开",
  "embedRuntime.mute": "关闭声音",
  "embedRuntime.unmute": "打开声音",
  "embedRuntime.joystick": "切换屏幕摇杆",
  "embedRuntime.movementHint": "WASD / 方向键移动",
  "embedRuntime.loading": "正在加载地图…",
  "embedRuntime.loadFailed": "无法加载地图",
  "embedRuntime.missingMap": "请输入地图数据或地图链接。",
  "embedRuntime.multipleInputs": "map 和 mapUrl 只能提供一个。",
  "embedRuntime.mapRequestFailed": "无法获取地图数据。",
  "embedRuntime.mapRequestHttp": "地图请求失败：HTTP {status}",
  "embedRuntime.invalidJson": "JSON 格式错误。",
  "embedRuntime.unknownRepresentation": "无法识别地图数据格式。",
  "embedRuntime.invalidPayload": "地图 Payload 编码无效。",
  "embedRuntime.damagedGzip": "压缩地图数据已损坏。",
  "embedRuntime.saveNotMap": "这是 {scope} 存档，不是地图。",
  "embedRuntime.invalidMap": "这段数据不是有效地图。",
  "embedRuntime.unknownError": "加载地图时发生错误。",
} as const;

export type EmbedRuntimeTranslationKey = keyof typeof catalog;
export default catalog;
