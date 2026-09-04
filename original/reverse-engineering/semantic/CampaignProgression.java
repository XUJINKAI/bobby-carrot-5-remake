// 研究性语义重建：来源为 UP9 a.class / a.f(boolean)、a.e(int,int)、ab()、
// Night Train 与 result/death callers。
// 本文件保留原版 bV/bU/A/B/K 的 progression 事实，不作为可直接编译的产品源码。

public final class CampaignProgression {
    /**
     * 原版 `bV`：DAT archive number。
     * - 0 -> `00.dat` shared Special Scenes；
     * - >0 -> 直接读取同号 `01.dat / 02.dat / ...`。
     *
     * 这是 archive provenance，不等同现代 Campaign chapter identity。
     */
    private int archiveDatNumber;

    /**
     * 原版 `bU`：当前 DAT 内 record slot。
     * - archive 0: slot 1..5 为 shared Special Scenes；
     * - archive >0: slot 1..10 为普通 progression records，11/12 为插入 Bonus records。
     */
    private int recordSlot;

    /** `bW`：离开 archive progression 进入特殊 scene 前记住的 archive。 */
    private int savedArchiveDatNumber;

    /** `A[4]`：每个当前可选 archive 的 resume record slot；0 表示不挂起。 */
    private byte[] resumeRecordSlot = new byte[4];

    /** `B[4]`：每个当前可选 archive 的另一条 persistent completion flag。 */
    private boolean[] archiveFlag = new boolean[4];

    /** `K`：按 (archive, kind 10/11/12) 编码的 persistent completion bitset。 */
    private long completionBits;

    /**
     * UP9 还硬编码 `ci={5,6,7,8}`，只用于把当前可选 archive 1..4 的 HUD 标题
     * 显示为玩家编号 5..8。Loader 本身仍读取 01.dat..04.dat。
     */
    private final int[] visibleArchiveNumber = {5, 6, 7, 8};

    ProgressionResult advanceAfterRecord(boolean withLoadingPaint) {
        savedArchiveDatNumber = archiveDatNumber;

        int nextArchive = archiveDatNumber;
        int nextSlot = recordSlot + 1;
        boolean reloadGameplay = true;
        boolean clearResumeSlot = false;

        switch (recordSlot) {
            case 3:
                // kind 11 未完成时，在普通 slot 3 和 4 之间插入 Bonus slot 11。
                nextSlot = isCompleted(archiveDatNumber, 11) ? 4 : 11;
                break;

            case 6:
                // kind 12 未完成时，在普通 slot 6 和 7 之间插入 Bonus slot 12。
                nextSlot = isCompleted(archiveDatNumber, 12) ? 7 : 12;
                break;

            case 11:
                nextSlot = 4;
                break;

            case 12:
                nextSlot = 7;
                break;

            case 10:
                archiveFlag[archiveDatNumber - 1] = true;
                clearResumeSlot = true;

                if (!isCompleted(archiveDatNumber, 10)) {
                    // 首次完成 slot 10 后进入 archive 0 / shared scene slot 4 的奖励路径。
                    nextArchive = 0;
                    nextSlot = 4;
                } else {
                    reloadGameplay = false;
                }
                break;

            default:
                break;
        }

        if (archiveDatNumber > 0) {
            resumeRecordSlot[archiveDatNumber - 1] = (byte)(clearResumeSlot ? 0 : nextSlot);
        }
        persist();

        if (!reloadGameplay) {
            return ProgressionResult.toTitle();
        }

        archiveDatNumber = nextArchive;
        recordSlot = nextSlot;
        if (withLoadingPaint) {
            paintLoadingSynchronously();
        }
        reloadCurrentRecord();
        return ProgressionResult.toGameplay(archiveDatNumber, recordSlot);
    }

    /**
     * dg=true 的 Timed Bonus 死亡是 progression 例外：slot 11->4、12->7，
     * 而不是重载当前 Bonus record。
     */
    ProgressionResult skipBonusRetryAfterFreePermitDeath() {
        if (recordSlot != 11 && recordSlot != 12) {
            throw new IllegalStateException("confirmed only for bonus slots 11/12");
        }
        return advanceAfterRecord(false);
    }

    boolean isCompleted(int archive, int kind) {
        int bit = completionBitIndex(archive, kind);
        return bit >= 0 && (completionBits & (1L << bit)) != 0;
    }

    void setCompleted(int archive, int kind, boolean value) {
        int bit = completionBitIndex(archive, kind);
        if (bit < 0) return;
        if (value) {
            completionBits |= 1L << bit;
        } else {
            completionBits &= ~(1L << bit);
        }
    }

    int visibleNumberForCurrentArchive() {
        if (archiveDatNumber <= 0 || archiveDatNumber > visibleArchiveNumber.length) {
            return archiveDatNumber;
        }
        return visibleArchiveNumber[archiveDatNumber - 1];
    }

    private int completionBitIndex(int archive, int kind) {
        int bit = (archive - 1) * 3;
        if (kind == 11) return bit;
        if (kind == 12) return bit + 1;
        if (kind == 10) return bit + 2;
        return -1;
    }

    private void persist() {}
    private void paintLoadingSynchronously() {}
    private void reloadCurrentRecord() {}

    static final class ProgressionResult {
        final boolean title;
        final int archiveDatNumber;
        final int recordSlot;

        private ProgressionResult(boolean title, int archiveDatNumber, int recordSlot) {
            this.title = title;
            this.archiveDatNumber = archiveDatNumber;
            this.recordSlot = recordSlot;
        }

        static ProgressionResult toTitle() {
            return new ProgressionResult(true, -1, -1);
        }

        static ProgressionResult toGameplay(int archiveDatNumber, int recordSlot) {
            return new ProgressionResult(false, archiveDatNumber, recordSlot);
        }
    }
}
