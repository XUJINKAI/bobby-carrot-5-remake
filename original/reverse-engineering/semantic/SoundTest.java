// 研究性语义重建：来源为 UP9 EN.dat、menu mode 5 构造与 a.ak() javap。

public final class SoundTest {
    /** D[3] 购买后主菜单出现 "SOUND TEST"，action 16 进入 menu mode 5。 */
    private boolean unlocked;

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
            default:
                return "/cleared.mid";
        }
    }
}
