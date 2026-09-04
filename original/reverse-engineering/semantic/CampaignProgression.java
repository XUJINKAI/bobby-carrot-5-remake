// 研究性语义重建：来源为 UP9 a.class / a.f(boolean)、menu launch、result/death callers。
// 本文件保留原版 bV/bU/A/B/K 的 progression 事实，不作为可直接编译的产品源码。

public final class CampaignProgression {
    /** 当前 release / levelpack，原版 `bV`。0 表示非 release gameplay。 */
    private int release;

    /** 当前 release 内 mode，原版 `bU`。 */
    private int mode;

    /** `bW`：离开 release 进入特殊 scene 前记住的 release。 */
    private int savedRelease;

    /** `A[4]`：每个 release 的 resume mode；0 表示不挂起。 */
    private byte[] resumeMode = new byte[4];

    /** `B[4]`：每个 release 的另一条 persistent completion flag。 */
    private boolean[] releaseFlag = new boolean[4];

    /** `K`：按 (release, kind 10/11/12) 编码的 persistent completion bitset。 */
    private long completionBits;

    /**
     * 对应 `a.f(boolean withLoadingPaint)`。
     *
     * 大多数 mode 默认进入 mode+1；少数 mode 会根据 persistent bit 插入/跳过 Bonus mode。
     */
    ProgressionResult advanceAfterMode(boolean withLoadingPaint) {
        savedRelease = release;

        int nextRelease = release;
        int nextMode = mode + 1;
        boolean reloadGameplay = true;
        boolean clearResumeMode = false;

        switch (mode) {
            case 3:
                // kind 11 未完成时，在 3 和 4 之间插入 mode 11。
                if (!isCompleted(release, 11)) {
                    nextMode = 11;
                } else {
                    nextMode = 4;
                }
                break;

            case 6:
                // kind 12 未完成时，在 6 和 7 之间插入 mode 12。
                if (!isCompleted(release, 12)) {
                    nextMode = 12;
                } else {
                    nextMode = 7;
                }
                break;

            case 11:
                nextMode = 4;
                break;

            case 12:
                nextMode = 7;
                break;

            case 10:
                releaseFlag[release - 1] = true;
                clearResumeMode = true;

                if (!isCompleted(release, 10)) {
                    // 首次到 mode 10 且 kind10 尚未完成：跳到 release=0/mode4 的特殊路径。
                    nextRelease = 0;
                    nextMode = 4;
                } else {
                    // kind10 已完成时不再 reload gameplay，而是回 Title。
                    reloadGameplay = false;
                }
                break;

            case 4:
            case 5:
            case 7:
            case 8:
            case 9:
                // 明确无额外分支，保留默认 mode+1。
                break;

            default:
                // 其它 mode 当前也保持默认 mode+1；具体 scene 名继续由入口/资源确认。
                break;
        }

        if (release > 0) {
            resumeMode[release - 1] = (byte)(clearResumeMode ? 0 : nextMode);
        }
        persist();

        if (!reloadGameplay) {
            return ProgressionResult.toTitle();
        }

        release = nextRelease;
        mode = nextMode;
        if (withLoadingPaint) {
            paintLoadingSynchronously();
        }
        reloadCurrentModeLevel();
        return ProgressionResult.toGameplay(release, mode);
    }

    /**
     * Death 的正常路径并不调用本 progression；只 `ab()` 重载当前 level。
     * 唯一已确认的 death progression 例外是 dg=true 的 Timed Bonus：调用 `f(false)`，
     * 因而 mode 11 -> 4、mode 12 -> 7。
     */
    ProgressionResult skipBonusRetryAfterFreePermitDeath() {
        if (mode != 11 && mode != 12) {
            throw new IllegalStateException("confirmed only for bonus modes 11/12");
        }
        return advanceAfterMode(false);
    }

    /**
     * 原版 `h(release, kind)`：每个 release 用 3 bit 表示 kind 11/12/10。
     * bit index = (release-1)*3 + {11:0, 12:1, 10:2}。
     */
    boolean isCompleted(int release, int kind) {
        int bit = completionBitIndex(release, kind);
        return bit >= 0 && (completionBits & (1L << bit)) != 0;
    }

    void setCompleted(int release, int kind, boolean value) {
        int bit = completionBitIndex(release, kind);
        if (bit < 0) return;
        if (value) {
            completionBits |= 1L << bit;
        } else {
            completionBits &= ~(1L << bit);
        }
    }

    private int completionBitIndex(int release, int kind) {
        int bit = (release - 1) * 3;
        if (kind == 11) return bit;
        if (kind == 12) return bit + 1;
        if (kind == 10) return bit + 2;
        return -1;
    }

    private void persist() {}
    private void paintLoadingSynchronously() {}
    private void reloadCurrentModeLevel() {}

    static final class ProgressionResult {
        final boolean title;
        final int release;
        final int mode;

        private ProgressionResult(boolean title, int release, int mode) {
            this.title = title;
            this.release = release;
            this.mode = mode;
        }

        static ProgressionResult toTitle() {
            return new ProgressionResult(true, -1, -1);
        }

        static ProgressionResult toGameplay(int release, int mode) {
            return new ProgressionResult(false, release, mode);
        }
    }
}
