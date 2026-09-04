// 研究性语义重建：来源为 UP9 a.class / player midpoint shop branch、
// generic dialog action dispatcher、pause menu action 30/31/32 与 gameplay F()/M()。
// 本文件只表达原版持久 upgrade 状态，不作为可直接编译的产品源码。

public final class ShopUpgrades {
    private static final int SHOP_FIRST = 0x97;
    private static final int SHOP_LAST = 0x9D;
    private static final int SHOP_UNAVAILABLE = 0x9E;

    private static final int UPGRADE_DREAM = 0;
    private static final int UPGRADE_CLOUD9 = 1;
    private static final int UPGRADE_SUPER_KEY = 2;
    private static final int UPGRADE_STEREO = 3;
    private static final int UPGRADE_MUSIC = 4;
    private static final int UPGRADE_SPEED_SHOES = 5;
    private static final int UPGRADE_COIN_RADAR = 6;

    /** 对应原版 `bu`，与 terrain 0x97..0x9D 一一对应。 */
    private static final int[] PRICE = {5, 10, 30, 20, 10, 25, 10};

    private byte[][] terrainGrid;

    /** 对应持久化 `D[7]`。 */
    private byte[] purchasedUpgradeCount = new byte[7];

    /** 对应持久化 `I`。 */
    private int globalCurrency;

    /** 对应 `F` / `E`，本身也持久化。 */
    private boolean speedShoesEnabled;
    private boolean coinRadarEnabled;

    /** 对应 `H`：-1 为随机 ingame track，否则 0..D[4]。 */
    private int selectedIngameMusic = -1;

    /**
     * `J()` 对 0x97..0x9D：根据 raw byte 算 upgrade index，并用 `I >= PRICE[index]`
     * 决定是否提供确认 action。购买动作本身发生在 generic dialog accept handler。
     */
    int shopIndexForTerrain(int rawTerrain) {
        int raw = rawTerrain & 0xFF;
        if (raw < SHOP_FIRST || raw > SHOP_LAST) {
            return -1;
        }
        return raw - SHOP_FIRST;
    }

    boolean canAfford(int upgradeIndex) {
        return upgradeIndex >= 0
            && upgradeIndex < PRICE.length
            && globalCurrency >= PRICE[upgradeIndex];
    }

    /**
     * 对应 `a.a(boolean)` 的普通 shop action 0..6。
     * 成功后：扣 currency、当前 shop tile 永久改成 0x9E、D[index]++、保存。
     */
    boolean purchase(int x, int y, int upgradeIndex) {
        if (!canAfford(upgradeIndex)) {
            return false;
        }

        globalCurrency -= PRICE[upgradeIndex];
        terrainGrid[y][x] = (byte)SHOP_UNAVAILABLE;
        purchasedUpgradeCount[upgradeIndex]++;

        if (upgradeIndex == UPGRADE_MUSIC) {
            // 原版购买新的 Music 后默认切到最新购买的 track index。
            selectedIngameMusic = purchasedUpgradeCount[UPGRADE_MUSIC];
        }

        persist();
        return true;
    }

    /** `D[2]` 被 Lock collision 直接读取，不需要额外 toggle。 */
    boolean hasPermanentSuperKey() {
        return purchasedUpgradeCount[UPGRADE_SUPER_KEY] != 0;
    }

    /**
     * `D[5] > 0` 后 pause menu 才出现 action 30；action 30 只切换 `F`。
     * gameplay `M()` 对非 mower Bobby 的每次普通成功移动，在 F=true 时把 fastPixelMotion
     * 置 true，因此普通 48px movement 从 3px/step 变成 6px/step。
     */
    void toggleSpeedShoes() {
        if (purchasedUpgradeCount[UPGRADE_SPEED_SHOES] == 0) {
            return;
        }
        speedShoesEnabled = !speedShoesEnabled;
        persist();
    }

    boolean isSpeedShoesEnabled() {
        return speedShoesEnabled;
    }

    /**
     * `D[6] > 0` 后 pause menu 才出现 action 31；action 31 只切换 `E`。
     * gameplay 顶层仅在 E=true 时调用 Coin Radar update。
     */
    void toggleCoinRadar() {
        if (purchasedUpgradeCount[UPGRADE_COIN_RADAR] == 0) {
            return;
        }
        coinRadarEnabled = !coinRadarEnabled;
        persist();
    }

    boolean isCoinRadarEnabled() {
        return coinRadarEnabled;
    }

    /**
     * `D[4]` 决定 pause menu 中可轮换的 ingame music 数量。
     * action 32: H++；超过 D[4] 后回到 -1（随机曲目），并立即切歌、保存。
     */
    int cycleIngameMusicSelection() {
        selectedIngameMusic++;
        if (selectedIngameMusic > purchasedUpgradeCount[UPGRADE_MUSIC]) {
            selectedIngameMusic = -1;
        }
        persist();
        return selectedIngameMusic;
    }

    /**
     * D[0]/D[1]/D[3] 已能与原 DAT semantic 名 Dream / Cloud9 / Stereo 对齐，
     * 但其完整跨 scene 能力继续由 Campaign reverse 拆解；这里不按名字猜 runtime 后果。
     */
    int purchasedCount(int upgradeIndex) {
        return purchasedUpgradeCount[upgradeIndex] & 0xFF;
    }

    private void persist() {}
}
