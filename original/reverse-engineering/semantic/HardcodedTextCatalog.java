// 研究性语义索引：来源为 UP9 a.class 中不经过 EN/DE/FR/IT/SP/PG.dat 的可见字符串。
// `Decompilation failed` 是 CFR 为失败方法注入的伪源码，不属于原版 class，明确排除。

public final class HardcodedTextCatalog {
    /** Hidden cheat confirmation，Beaver Shop 输入 11337799 后出现。 */
    static final String CHEAT_ENABLE_PROMPT = "DO YOU WANT TO ENABLE THE CHEAT?";

    /** Hidden full-save reset confirmation，Beaver Shop 输入 91337 后出现。 */
    static final String FORMAT_RMS_PROMPT =
        "DO YOU WANT TO FORMAT THE RMS AND COMPLETELY RESET THE GAME?";

    /** Cheat 开启后追加到 gameplay/pause menu 的 action 99。 */
    static final String CHEAT_MENU_ITEM = "CHEAT!";

    /** Fatal Alert title；正文仍来自 localized string `a[51]`。 */
    static final String FATAL_ALERT_TITLE = "Error";

    /** 原版语言选择列表不是 EN.dat 项，而是 class 内固定表。 */
    static final String LANGUAGE_TABLE =
        "DEUTSCH=DE;ENGLISH=EN;FRANÇAIS=FR;ITALIANO=IT;ESPAÑOL=SP;PORTUGUÊS=PG;";

    /** Magic Code scene 的初始占位显示。 */
    static final String MAGIC_CODE_PLACEHOLDER = "0000 0000 0000 0000##";

    /** UP9 paint 中额外显示的 release branding。 */
    static final String RELEASE_BRANDING = "EXTRA-LEVELPACK 9";

    /**
     * 六份原版语言资源的 ID shape 已机械确认完全相同：0..122。
     * semantic 层以 EN 名称命名 ID，但运行时可以用同 ID 索引任意 locale。
     */
    static final String[] ORIGINAL_LOCALES = {"EN", "DE", "FR", "IT", "SP", "PG"};

    static boolean isDecompilerSynthetic(String value) {
        return "Decompilation failed".equals(value);
    }

    private HardcodedTextCatalog() {}
}
