// 研究性语义重建：来源为 UP9 a.class / Shop 购买、D[] 引用、EN.dat、
// menu mode 4/5、Night Train A()/B() 与 gameplay F()/M()。
// 本文件只表达原版持久 upgrade 状态，不作为可直接编译的产品源码。

public final class ShopUpgrades {
    private static final int SHOP_FIRST = 0x97;
    private static final int SHOP_LAST = 0x9D;
    private static final int SHOP_EMPTY = 0x9E;

    private static final int TICKET_DREAM_MACHINE = 0;
    private static final int TICKET_CLOUD_9 = 1;
    private static final int UPGRADE_SUPER_KEY = 2;
    private static final int UPGRADE_SOUND_TEST = 3;
    private static final int UPGRADE_MUSIC = 4;
    private static final int UPGRADE_SPEED_SHOES = 5;
    private static final int UPGRADE_COIN_RADAR = 6;

    /** 对应原版 `bu`，与 terrain 0x97..0x9D 一一对应。 */
    private static final int[] PRICE = {5, 10, 30, 20, 10, 25, 10};

    private byte[][] terrainGrid;
    private byte[] purchasedUpgradeCount = new byte[7];
    private int globalCurrency;
    private boolean speedShoesEnabled;
    private boolean coinRadarEnabled;
    private int selectedIngameMusic = -1;

    int shopIndexForTerrain(int rawTerrain) {
        int raw = rawTerrain & 0xFF;
        return raw >= SHOP_FIRST && raw <= SHOP_LAST ? raw - SHOP_FIRST : -1;
    }

    boolean canAfford(int upgradeIndex) {
        return upgradeIndex >= 0
            && upgradeIndex < PRICE.length
            && globalCurrency >= PRICE[upgradeIndex];
    }

    boolean purchase(int x, int y, int upgradeIndex) {
        if (!canAfford(upgradeIndex)) return false;

        globalCurrency -= PRICE[upgradeIndex];
        terrainGrid[y][x] = (byte)SHOP_EMPTY;
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
        if (purchasedUpgradeCount[UPGRADE_SPEED_SHOES] == 0) return;
        speedShoesEnabled = !speedShoesEnabled;
        persist();
    }

    boolean isSpeedShoesEnabled() {
        return speedShoesEnabled;
    }

    void toggleCoinRadar() {
        if (purchasedUpgradeCount[UPGRADE_COIN_RADAR] == 0) return;
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
     * D[0]/D[1] 是 Beaver Shop 出售的 Night Train destination tickets。
     *
     * 三条证据闭环：
     * 1. EN.dat mode-4 条目分别为 "DREAM MACHINE" / "CLOUD 9"；
     * 2. Night Train A() 在没有任何 mode-4 目的地时显示 a[119]：需要 Ticket，
     *    并明确要求去 Beaver Shop 购买；
     * 3. Night Train B() 选择 action 1 后进入 bV=0,bU=3 Dream Machine，
     *    action 2 后进入 bV=0,bU=2 Cloud 9。
     */
    boolean hasDreamMachineTrainTicket() {
        return purchasedUpgradeCount[TICKET_DREAM_MACHINE] > 0;
    }

    boolean hasCloud9TrainTicket() {
        return purchasedUpgradeCount[TICKET_CLOUD_9] > 0;
    }

    /** D[3] 的 action 16 与 mode 5 bytecode 已完整确认是 Sound Test。 */
    boolean hasSoundTestUnlock() {
        return purchasedUpgradeCount[UPGRADE_SOUND_TEST] > 0;
    }

    int purchasedCount(int upgradeIndex) {
        return purchasedUpgradeCount[upgradeIndex] & 0xFF;
    }

    private void persist() {}
}
