// 研究性语义重建：来源为 UP9 a.class / player midpoint shop branch、
// generic dialog action dispatcher、pause menu action 30/31/32、gameplay F()/M()、
// D[] 全引用追踪与 EN.dat 精准字符串索引。
// 本文件只表达原版持久 upgrade 状态，不作为可直接编译的产品源码。

public final class ShopUpgrades {
    private static final int SHOP_FIRST = 0x97;
    private static final int SHOP_LAST = 0x9D;
    private static final int SHOP_UNAVAILABLE = 0x9E;

    private static final int UPGRADE_DREAM_MACHINE = 0;
    private static final int UPGRADE_CLOUD_9 = 1;
    private static final int UPGRADE_SUPER_KEY = 2;
    private static final int UPGRADE_SOUND_TEST = 3;
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

    boolean purchase(int x, int y, int upgradeIndex) {
        if (!canAfford(upgradeIndex)) {
            return false;
        }

        globalCurrency -= PRICE[upgradeIndex];
        terrainGrid[y][x] = (byte)SHOP_UNAVAILABLE;
        purchasedUpgradeCount[upgradeIndex]++;

        if (upgradeIndex == UPGRADE_MUSIC) {
            selectedIngameMusic = purchasedUpgradeCount[UPGRADE_MUSIC];
        }

        persist();
        return true;
    }

    boolean hasPermanentSuperKey() {
        return purchasedUpgradeCount[UPGRADE_SUPER_KEY] != 0;
    }

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

    int cycleIngameMusicSelection() {
        selectedIngameMusic++;
        if (selectedIngameMusic > purchasedUpgradeCount[UPGRADE_MUSIC]) {
            selectedIngameMusic = -1;
        }
        persist();
        return selectedIngameMusic;
    }

    /**
     * EN.dat 与菜单构造已经直接确认这三个 scene/product unlock：
     *
     * D[0] -> "DREAM MACHINE"，在 menu mode 4 中出现 action 1；
     * D[1] -> "CLOUD 9"，在 menu mode 4 中出现 action 2；
     * D[3] -> "SOUND TEST"，在主菜单出现 action 16。
     *
     * Sound Test 的 mode 5 列表原文包括 INGAME 1/2/3、BONUS LEVEL、
     * LEVEL COMPLETE、LAWNMOWER、SANDMAN、BEAVER、UNIVERSE、GOLDEN CARROT，
     * 因此 D[3] 的效果可以无歧义命名为解锁音轨试听菜单。
     */
    boolean hasDreamMachineUnlock() {
        return purchasedUpgradeCount[UPGRADE_DREAM_MACHINE] > 0;
    }

    boolean hasCloud9Unlock() {
        return purchasedUpgradeCount[UPGRADE_CLOUD_9] > 0;
    }

    boolean hasSoundTestUnlock() {
        return purchasedUpgradeCount[UPGRADE_SOUND_TEST] > 0;
    }

    int purchasedCount(int upgradeIndex) {
        return purchasedUpgradeCount[upgradeIndex] & 0xFF;
    }

    private void persist() {}
}
