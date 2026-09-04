// 研究性语义重建：来源为 UP9 a.class / J() F6 branch、a(boolean,int,int)、h(int,int)、s() 与 EN.dat。

public final class GoldenCarrotCampaign {
    private static final int GOLDEN_CARROT = 0xF6;
    private static final int EMPTY = 0xFF;

    private byte[][] objectGrid;

    /** 原版持久化 `J` / `I` / `K`。 */
    private int goldenCarrotTotal;
    private int globalBonusCoins;
    private long completionBits;

    /** 当前关内已经收集、尚未结算到 I 的 Bonus Coin 数，对应 `bX`。 */
    private int levelBonusCoins;

    private int archiveDatNumber;
    private int recordSlot;

    /**
     * J() 在 midpoint 触碰 F6 后立即结束当前特殊关：
     *
     * 1. 全局 Golden Carrot J++；
     * 2. 删除 F6；
     * 3. `a(true,bV,bU)` 标记当前 10/11/12 completion bit（其它 slot h() 返回 -1）；
     * 4. 把本关 bX Bonus Coins 一次性加入全局 I；
     * 5. persist；
     * 6. 停止 gameplay timer / presentation；
     * 7. 进入 s() special result。
     */
    void collectAndFinish(int x, int y) {
        if ((objectGrid[y][x] & 0xFF) != GOLDEN_CARROT) {
            return;
        }

        goldenCarrotTotal++;
        objectGrid[y][x] = (byte)EMPTY;
        setSpecialRecordCompleted(archiveDatNumber, recordSlot, true);
        globalBonusCoins += levelBonusCoins;
        persist();
        stopGameplayForSpecialResult();
        enterGoldenCarrotResult();
    }

    /**
     * 原版 h(archive, slot) 只给 11/12/10 三类 record 分配 bit：
     * base=(archive-1)*3；11=base，12=base+1，10=base+2。
     */
    void setSpecialRecordCompleted(int archive, int slot, boolean completed) {
        int bit = specialCompletionBit(archive, slot);
        if (bit < 0) {
            return;
        }
        if (completed) {
            completionBits |= 1L << bit;
        } else {
            completionBits &= ~(1L << bit);
        }
    }

    private int specialCompletionBit(int archive, int slot) {
        if (archive <= 0) return -1;
        int base = (archive - 1) * 3;
        if (slot == 11) return base;
        if (slot == 12) return base + 1;
        if (slot == 10) return base + 2;
        return -1;
    }

    /**
     * s() 的 EN.dat 文案明确显示新的 Golden Carrot 总数，并提示：
     * 后续乘 Night Train 前往 Cloud 9 了解 treasure。
     */
    private void enterGoldenCarrotResult() {}
    private void stopGameplayForSpecialResult() {}
    private void persist() {}
}
