// 研究性语义重建：来源为 UP9 a.class / a.I()、关卡 reset、scene entry、death/result 与 Sound Test。
// 重点：原版普通关没有 `level -> fixed music` 表；BGM 是 runtime state resolver 的结果。

public final class MusicCatalog {
    static final String TITLE = "/title.mid";
    static final String TRAIN = "/train.mid";
    static final String DEATH = "/death.mid";
    static final String ALARM = "/alarm.mid";
    static final String CLEARED = "/cleared.mid";
    static final String MOWER = "/mow.mid";
    static final String BONUS = "/bonus.mid";
    static final String SHOP = "/shop.mid";
    static final String SANDMAN = "/sandman.mid";
    static final String UNIVERSE = "/universe.mid";
    static final String FLIGHT = "/fly.mid";

    /** 原版 `bV`：0=shared special-scene archive；>0=release DAT archive。 */
    private int archiveNumber;

    /** 原版 `bU`：archive 内 record slot。 */
    private int recordSlot;

    private boolean ridingMower;
    private boolean timedBonusMap;
    private boolean timedBonusRunning;

    /** 原版 `D[4]`：额外已购买的 ingame music 数量。初始只有 ingame0。 */
    private int purchasedExtraIngameMusicCount;

    /**
     * 原版 `H`：持久化的 Ingame Music selection。
     *
     * - 新存档初始化为 0，即固定 `ingame0.mid`；
     * - 0..D[4] = 固定 ingameN；
     * - -1 = UI 文案 `AUTO`：每次 resolver 被调用时，从 0..D[4] 随机一首。
     */
    private int selectedIngameMusic;

    String resolveGameplayMusic() {
        if (ridingMower) return MOWER;

        if (archiveNumber != 0) {
            if (timedBonusMap) return timedBonusRunning ? BONUS : SHOP;
            if (selectedIngameMusic == -1) {
                return ingame(randomInt(purchasedExtraIngameMusicCount + 1));
            }
            return ingame(selectedIngameMusic);
        }

        switch (recordSlot) {
            case 1: return SHOP;      // BEAVER SHOP
            case 2: return SANDMAN;   // CLOUD 9
            case 3: return SHOP;      // DREAM MACHINE
            case 4: return SANDMAN;   // Dreamland reward
            case 5: return SANDMAN;   // WELCOME
            default: return SHOP;
        }
    }

    /**
     * 原版明确重新调用 `I()` 的 gameplay 时刻：level reset、Mower mount/dismount、
     * Timed Bonus Lock 启动、menu/audio 返回 gameplay、Current Music 变更。
     */
    void soundtrackLifecycleReferenceOnly() {}

    /**
     * 通用 MIDI 播放：loop=true -> setLoopCount(-1)，否则 setLoopCount(1)。
     * 循环曲同路径不会重启；切曲前停止/释放旧 Player；start 后线程 sleep(250ms)。
     */
    PlaybackMode playbackModeFor(boolean resultOrDeath) {
        return resultOrDeath ? PlaybackMode.ONE_SHOT : PlaybackMode.LOOP;
    }

    boolean shouldRestartLoopingTrack(String requestedPath, String currentlyPlayingPath) {
        return currentlyPlayingPath == null || !currentlyPlayingPath.equals(requestedPath);
    }

    /**
     * 原版 volume setting `bt` 只允许 1..5，默认 3。
     * Menu action 13 循环 1→2→3→4→5→1；左右调节同样限制在 1..5。
     *
     * 传入 J2ME VolumeControl.setLevel() 前的公式：
     *   n > 0 ? n*25 - (5-n)*5 : 0
     * = 30*n - 25
     *
     * 得到：1→5、2→35、3→65、4→95、5→125。
     * 注意这是 **class 实际请求参数**；125 最终在不同 J2ME/设备上是接受、clamp 到100，
     * 还是有厂商扩展行为，静态 class 无法决定，不应把“实际声压=125%”写成事实。
     */
    int requestedJ2meVolumeLevel(int volumeSetting) {
        if (volumeSetting <= 0) return 0;
        return volumeSetting * 25 - (5 - volumeSetting) * 5;
    }

    int defaultVolumeSetting() {
        return 3;
    }

    enum PlaybackMode { LOOP, ONE_SHOT }

    String nightTrainMusic() { return TRAIN; }
    String dreamCodeMusic() { return UNIVERSE; }
    String flightRewardMusic() { return FLIGHT; }
    String resultMusic() { return CLEARED; }
    String deathMusic(boolean bonusAlarmActive) { return bonusAlarmActive ? ALARM : DEATH; }

    String soundTestTrack(int item) {
        switch (item) {
            case 0: return ingame(0);
            case 1: return ingame(1);
            case 2: return ingame(2);
            case 3: return MOWER;
            case 4: return SANDMAN;
            case 5: return SHOP;      // menu label BEAVER
            case 6: return UNIVERSE;
            case 7: return FLIGHT;
            case 8: return BONUS;
            default: return CLEARED;
        }
    }

    private String ingame(int index) { return "/ingame" + index + ".mid"; }

    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original random helper");
    }
}
