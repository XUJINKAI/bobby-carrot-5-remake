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
     *
     * 因此 AUTO 不是“每一关预先绑定随机结果”，而是 soundtrack resolver 的运行时选择。
     */
    private int selectedIngameMusic;

    /**
     * 对应原版 `a.I()`。
     *
     * 普通 release 关并没有 per-level soundtrack metadata。
     * 每次需要恢复 gameplay BGM 时，runtime 根据当前模式、载具、Bonus 状态与
     * 用户的 Ingame Music 设置重新解析。
     */
    String resolveGameplayMusic() {
        if (ridingMower) {
            return MOWER;
        }

        if (archiveNumber != 0) {
            if (timedBonusMap) {
                // Bonus record 在 Lock midpoint 启动倒计时以前播放 shop.mid；
                // 一旦 timedBonusRunning=true，立即切 bonus.mid。
                return timedBonusRunning ? BONUS : SHOP;
            }

            if (selectedIngameMusic == -1) {
                int maxInclusive = purchasedExtraIngameMusicCount;
                int chosen = randomInt(maxInclusive + 1);
                return ingame(chosen);
            }
            return ingame(selectedIngameMusic);
        }

        // 00.dat shared special scenes。
        switch (recordSlot) {
            case 1: // BEAVER SHOP
                return SHOP;
            case 2: // CLOUD 9
                return SANDMAN;
            case 3: // DREAM MACHINE
                return SHOP;
            case 4: // BONUS LEVEL / Dreamland reward scene
                return SANDMAN;
            case 5: // WELCOME / Dreamland intro
                return SANDMAN;
            default:
                return SHOP;
        }
    }

    /**
     * 原版明确重新调用 `I()` 的 gameplay 时刻：
     *
     * 1. `ab()` 完成关卡 reset / scene level load；
     * 2. Bobby 真正 mount Mower 后（ridingMower=true）-> mow.mid；
     * 3. Bobby 在 Mower Parking 完成 dismount 后（ridingMower=false）-> 恢复当前 scene BGM；
     * 4. Timed Bonus 的 Lock midpoint 把 timedBonusRunning 置 true -> shop.mid 切 bonus.mid；
     * 5. 从 menu / audio state 返回 gameplay 时恢复；
     * 6. 主菜单 action 32 改变 Current Music 后立刻重新解析并播放。
     *
     * 所以 Mower / Bonus music 都不是在地图 metadata 里指定，而是 runtime mode override。
     */
    void soundtrackLifecycleReferenceOnly() {
        // semantic marker only
    }

    /**
     * 原版通用 MIDI 播放方法 `a(String path, int volume, boolean loop)` 的语义：
     *
     * - `loop=true` -> `Player.setLoopCount(-1)`，无限循环；
     * - `loop=false` -> `Player.setLoopCount(1)`，只播放一次；
     * - gameplay / title / shared scene / Night Train / reward scene 的 `b(path)` 包装器都传 loop=true；
     * - level result、special result、death / alarm 直接传 loop=false，因此是 one-shot；
     * - 若 loop=true 且请求路径和当前循环曲目相同，原版直接 return，不重启同一首曲子；
     * - 切换到另一首前会停止/释放旧 Player，再创建新的 MIDI Player；
     * - `start()` 后原线程固定 `sleep(250ms)`。这是音频切换实现 quirk，不应误当成 gameplay tick。
     */
    PlaybackMode playbackModeFor(String path, boolean resultOrDeath) {
        return resultOrDeath ? PlaybackMode.ONE_SHOT : PlaybackMode.LOOP;
    }

    boolean shouldRestartLoopingTrack(String requestedPath, String currentlyPlayingPath) {
        return currentlyPlayingPath == null || !currentlyPlayingPath.equals(requestedPath);
    }

    enum PlaybackMode {
        LOOP,
        ONE_SHOT,
    }

    /** Night Train state 12。 */
    String nightTrainMusic() {
        return TRAIN;
    }

    /** Dream Code generation state 13。 */
    String dreamCodeMusic() {
        return UNIVERSE;
    }

    /** Flight reward state 14。 */
    String flightRewardMusic() {
        return FLIGHT;
    }

    /** 普通 level result 与 special result 都直接播放 cleared.mid，且是 one-shot。 */
    String resultMusic() {
        return CLEARED;
    }

    /** Bonus timeout 使用 alarm.mid，其它统一 death pipeline 使用 death.mid；两者均 one-shot。 */
    String deathMusic(boolean bonusAlarmActive) {
        return bonusAlarmActive ? ALARM : DEATH;
    }

    /**
     * Sound Test 菜单的原版映射。菜单显示的是场景名，不保证与 MIDI 文件同名。
     */
    String soundTestTrack(int item) {
        switch (item) {
            case 0: return ingame(0);
            case 1: return ingame(1);
            case 2: return ingame(2);
            case 3: return MOWER;
            case 4: return SANDMAN;
            case 5: return SHOP;      // 菜单文案 BEAVER
            case 6: return UNIVERSE;
            case 7: return FLIGHT;
            case 8: return BONUS;
            default: return CLEARED;
        }
    }

    private String ingame(int index) {
        return "/ingame" + index + ".mid";
    }

    private int randomInt(int bound) {
        throw new UnsupportedOperationException("original Random.nextInt-equivalent helper");
    }
}
