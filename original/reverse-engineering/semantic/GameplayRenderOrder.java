// 研究性语义重建：来源为 UP9 a.class / gameplay paint a(Graphics) 与子绘制方法。
// 本文件只记录原版层级顺序，不作为可直接编译的产品源码。

public final class GameplayRenderOrder {
    /**
     * 对应原版 gameplay `a(Graphics)` 的真实调用顺序。
     *
     * 这里最重要的边界：所有 static terrain/object 已经合成在 tile cache 中，整个 cache
     * 永远先于 Bobby 绘制。因此 Ice Block / Dragon / Fence 等普通 grid object 不会因为
     * 所在行更靠下就覆盖 Bobby 的耳朵；原版没有对 Bobby 与 static object 做 Y-sort。
     */
    void paintGameplay() {
        // 1. 静态地图 tile cache：terrain + object。
        drawCachedTerrainAndObjects();

        // 2. 星空背景的 16x16 transient sparkle（ae/ac/ad），仍在实体下方。
        drawBackgroundStarSparkles();

        // 3. Coin Radar 对隐藏 F8 的闪烁提示，仍在 moving entity / Bobby 下方。
        drawCoinRadarIndicator();

        // 4. Cloud / Leaf moving entities。
        drawMovingEntities();

        // 5. Windmill 开启后的三段 wind effect。
        // 注意：风带在 moving entity 之后、Bobby 之前。
        drawWindEffects();

        // 6. Bobby（含普通、mower、kite airborne、shovel 等角色 sprite）。
        drawBobby();

        // 7. Dragon Fireball。
        drawFireball();

        // 8. Bobby 上方/下方的缺少道具提示 bubble。
        drawContextHintBubble();

        // 9. 前景环境粒子：
        //    - 雪地关（cW=true）：5 个雪花粒子；
        //    - 非雪地：bf.png butterfly。
        // 这些明确在 Bobby / fireball / hint 之后。
        drawForegroundSnowOrButterfly();

        // 10. HUD：计时、目标数、inventory 等；精确条件与布局见 GameplayHud。
        drawHud();

        // 11. Timed Bonus alarm overlay。
        drawAlarmOverlay();

        // 12. screen transition mask / pause overlay / transient text / death text。
        drawScreenTransitionAndMessages();
    }

    /**
     * 原版 tile cache 本身在 `c(gridX,gridY,cacheX,cacheY)` 中按：
     * terrain -> object
     * 的顺序重绘一个格。terrain/object 改动后 `f(cameraX,cameraY)` 刷新可见缓存。
     */
    void redrawCachedTile(int x, int y) {
        drawTerrain(x, y);
        drawObject(x, y);
    }

    private void drawCachedTerrainAndObjects() {}
    private void drawBackgroundStarSparkles() {}
    private void drawCoinRadarIndicator() {}
    private void drawMovingEntities() {}
    private void drawWindEffects() {}
    private void drawBobby() {}
    private void drawFireball() {}
    private void drawContextHintBubble() {}
    private void drawForegroundSnowOrButterfly() {}
    private void drawHud() {}
    private void drawAlarmOverlay() {}
    private void drawScreenTransitionAndMessages() {}
    private void drawTerrain(int x, int y) {}
    private void drawObject(int x, int y) {}
}
