# 001 — Engine 与 Web UI 分离

**决定：** 游戏逻辑位于独立 TypeScript Engine，并提供自己的浏览器 Playground；产品页面只消费 Engine 公共 API。

**原因：** 逆向工程需要快速、隔离地测试机关，而产品 UI 会独立演进。

**结果：** WebUI 可以整体重做，而无需重写游戏世界和机关逻辑。
