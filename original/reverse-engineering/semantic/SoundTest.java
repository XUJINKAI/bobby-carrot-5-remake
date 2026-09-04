// 研究性语义重建：来源为 UP9 EN.dat、menu mode 5 构造与 a.ak() javap。

public final class SoundTest {
    /** D[3] 购买后主菜单出现 "SOUND TEST"，action 16 进入 menu mode 5。 */
    private boolean unlocked;

    /** mode 5 按此顺序构造 10 个菜单项；ID 顺序不是连续区间。 */
    static final int[] LABEL_STRING_IDS = {
        DialogCatalog.SOUND_TEST_INGAME_1,
        DialogCatalog.SOUND_TEST_INGAME_2,
        DialogCatalog.SOUND_TEST_INGAME_3,
        DialogCatalog.SOUND_TEST_LAWNMOWER,
        DialogCatalog.SOUND_TEST_SANDMAN,
        DialogCatalog.SOUND_TEST_BEAVER,
        DialogCatalog.SOUND_TEST_UNIVERSE,
        DialogCatalog.SOUND_TEST_GOLDEN_CARROT,
        DialogCatalog.SOUND_TEST_BONUS_LEVEL,
        DialogCatalog.SOUND_TEST_LEVEL_COMPLETE,
    };

    static final String[] LABELS = {
        "INGAME 1",
        "INGAME 2",
        "INGAME 3",
        "LAWNMOWER",
        "SANDMAN",
        "BEAVER",
        "UNIVERSE",
        "GOLDEN CARROT",
        "BONUS LEVEL",
        "LEVEL COMPLETE",
    };

    /**
     * a.ak() 对 ea=5 的 bytecode 直接确认播放映射。
     * 菜单文案表达场景名，不保证 MIDI 文件与场景同名，例如 BEAVER 使用 shop.mid。
     */
    String midiForSelection(int index) {
        switch (index) {
            case 0:
            case 1:
            case 2:
                return "/ingame" + index + ".mid";
            case 3:
                return "/mow.mid";
            case 4:
                return "/sandman.mid";
            case 5:
                return "/shop.mid";
            case 6:
                return "/universe.mid";
            case 7:
                return "/fly.mid";
            case 8:
                return "/bonus.mid";
            case 9:
                return "/cleared.mid";
            default:
                return null;
        }
    }
}
