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
     * -1 = RANDOM；0..D[4] = 固定 ingameN。
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
                // Bonus record 在拿到/打开 Lock 前播放 shop.mid；
                // Lock midpoint 启动 60 秒计时后立即切 bonus.mid。
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

    /** 普通 level result 与 special result 都直接播放 cleared.mid。 */
    String resultMusic() {
        return CLEARED;
    }

    /** Bonus timeout 使用 alarm.mid，其它统一 death pipeline 使用 death.mid。 */
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
