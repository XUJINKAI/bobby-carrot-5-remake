# 地图编辑器

Editor 是 Bobby Web 的玩家功能，不是独立的调试 IDE。

## 地图格式

导入/导出 JSON 只包含：

```json
{
  "schemaVersion": 1,
  "name": "My Level",
  "author": "optional",
  "width": 20,
  "height": 16,
  "terrain": [[144]],
  "objects": [{"id": 202, "x": 4, "y": 8}]
}
```

DAT record length、SHA-256、UP 发行 metadata 等档案字段不进入自定义地图。

## Play Test

Editor 永远不把 Draft 本体交给 Runtime。点击 Play 会生成并克隆标准 Engine LevelData；Stop 直接销毁 Runtime，因此游戏中的所有状态变化不会污染编辑结果。

## URL 分享

分享数据放在 URL Fragment：

```text
/play#map=...
/edit#map=...
```

Fragment 不需要发送给服务器。编码前先把 Terrain 做 RLE、Object 压成三元组，再优先使用浏览器 `CompressionStream('deflate-raw')`，最后 base64url。浏览器不支持该压缩格式时回退到 compact JSON + base64url。

当链接超过约 8KB 时 Editor 不再建议 URL 分享，而提示导出 JSON。
