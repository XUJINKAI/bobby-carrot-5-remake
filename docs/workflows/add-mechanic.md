# 逆向 / 新增一个机关

1. 选择一个尚未完整支持的 terrain/object 行为；
2. 找到包含该原始 ID 的一个或多个关卡；
3. 用 `?level=NNN&debug=1` 在 Engine Playground 定位坐标和 ID；
4. 能运行原版时先观察原版；
5. 追踪对应 `a.class` 字节码；
6. 只把已确认事实写入 `docs/reference/`；
7. 在 `engine/src/mechanics/` 或对应 World System 实现；
8. 为恢复出的规则增加最小、针对性的测试；
9. 先在 Engine Playground 验证，再考虑 Web UI；
10. 执行 `npm run verify`。

如果行为仍有歧义，就明确保留为 partial/unknown；禁止在 Web UI 里写补偿逻辑掩盖 Engine 错误。
