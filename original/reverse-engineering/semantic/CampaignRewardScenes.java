// 研究性语义重建：来源为 UP9 a.class / dialog action 9/10、u/v/w/x、p/q/r/s/t。
// 本文件记录原版跨关奖励场景事实，不作为可直接编译的产品源码。

public final class CampaignRewardScenes {
    private static final int ACTION_DREAM_CODE = 9;
    private static final int ACTION_FLIGHT_REWARD = 10;

    /** 对应原版 `J`。 */
    private int goldenCarrotCount;

    /** 对应 `M[5]`：最近生成的 code。 */
    private String[] recentDreamCodes = new String[5];

    /** 对应 `L`：持久化随机 seed / account token 的组成部分。 */
    private int persistentCodeSeed;

    /** 对应当前 release `bV`，action 10 前保存为 `bW`。 */
    private int release;

    /**
     * action 9 -> `u()`：进入 Dream Code 场景。
     *
     * 原版一次最多消耗 100 个 Golden Carrot。进入后：
     * - amount = min(J, 100)；
     * - 显示 sleep.png；
     * - 播放 universe.mid；
     * - 16 个字符持续随机变化；
     * - countdown = 256 gameplay step。
     */
    DreamCodeSession startDreamCodeScene() {
        DreamCodeSession session = new DreamCodeSession();
        session.amount = Math.min(goldenCarrotCount, 100);
        session.remainingSteps = 256;
        session.displayCode = randomDisplayCode();
        return session;
    }

    /**
     * `w()`：256 step 归零时固定最终 code，推入最近 5 条历史，扣除对应 Golden Carrot。
     * 256 gameplay step 按稳态约 31ms/step，约 7.9s。
     */
    void finishDreamCodeScene(DreamCodeSession session, long currentTimeMillis) {
        String code = encodeDreamCode(session.amount, currentTimeMillis);

        for (int i = recentDreamCodes.length - 1; i > 0; i--) {
            recentDreamCodes[i] = recentDreamCodes[i - 1];
        }
        recentDreamCodes[0] = code;
        goldenCarrotCount -= session.amount;
        persistCampaignState();
    }

    /**
     * `x()` 的 code payload：10 byte -> base32-ish 16 char -> `XXXX XXXX XXXX XXXX`。
     *
     * byte layout：
     * - [0..3] persistentCodeSeed，大端序；
     * - [4] checksum；
     * - [5] 本次消耗的 Golden Carrot 数；
     * - [6..9] 当前时间毫秒低 32 位，大端序。
     *
     * checksum 从常量 76 开始，跳过 byte[4] 自身，把其它 byte 与 index 混合后累加。
     */
    String encodeDreamCode(int amount, long currentTimeMillis) {
        byte[] payload = new byte[10];
        writeIntBigEndian(payload, 0, persistentCodeSeed);
        payload[5] = (byte)amount;
        writeIntBigEndian(payload, 6, (int)currentTimeMillis);

        int checksum = 76;
        for (int i = 0; i < payload.length; i++) {
            if (i == 4) continue;
            checksum = (byte)(checksum + ~((byte)(payload[i] + i)));
        }
        payload[4] = (byte)checksum;

        String raw = encodeFiveBitCharacters(payload, 80);
        return raw.substring(0, 4)
            + " " + raw.substring(4, 8)
            + " " + raw.substring(8, 12)
            + " " + raw.substring(12);
    }

    /**
     * action 10 -> `p()`：进入 Flight reward scene。
     *
     * 原版先把 Bobby 切到 airborne presentation，播放 fly.mid，逐段显示当前 release DAT
     * header 中以 `#` 分隔的文本。每段固定 192 gameplay step 后切下一段。
     */
    FlightRewardSession startFlightRewardScene(String releaseText) {
        FlightRewardSession session = new FlightRewardSession();
        session.release = release;
        session.text = releaseText;
        session.nextTextOffset = 0;
        loadNextFlightText(session);
        return session;
    }

    /**
     * 文本全部播放完后，Bobby 从屏幕右侧以 3px/gameplay step 飞入目标位置。
     * 到达后：
     * - `J++`：Golden Carrot 总数增加 1；
     * - 写入 persistent completion bit `(release, 10)`；
     * - 保存；
     * - 进入 special result scene。
     */
    void completeFlightRewardScene(FlightRewardSession session) {
        goldenCarrotCount++;
        setPersistentCompletion(session.release, 10, true);
        persistCampaignState();
    }

    private void loadNextFlightText(FlightRewardSession session) {
        int end = session.text.indexOf('#', session.nextTextOffset);
        if (end < 0) end = session.text.length();
        session.currentText = session.text.substring(session.nextTextOffset, end);
        session.nextTextOffset = end + 1;
        session.remainingTextSteps = 192;
    }

    private String randomDisplayCode() {
        // 原版 v()：16 次 Random(32)，0..9 -> '0'..'9'，10..31 -> 'A'..'V'。
        throw new UnsupportedOperationException();
    }

    private void writeIntBigEndian(byte[] out, int offset, int value) {}
    private String encodeFiveBitCharacters(byte[] payload, int bitCount) { return ""; }
    private void persistCampaignState() {}
    private void setPersistentCompletion(int release, int kind, boolean value) {}

    static final class DreamCodeSession {
        int amount;
        int remainingSteps;
        String displayCode;
    }

    static final class FlightRewardSession {
        int release;
        String text;
        int nextTextOffset;
        int remainingTextSteps;
        String currentText;
    }
}
