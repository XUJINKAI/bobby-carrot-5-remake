// 研究性语义重建：来源为 UP9 a.class / e()、g()、h()、i() 与 RecordStore helpers。
// 原版只使用名为 BC5Data 的 RMS，且期望恰好一个 record。

public final class PersistentSaveFormat {
    static final String RECORD_STORE_NAME = "BC5Data";
    static final int RECORD_NUMBER = 1;
    static final int ARCHIVE_COUNT = 4;
    static final int UPGRADE_COUNT = 7;
    static final int RECENT_MAGIC_CODE_COUNT = 5;

    String selectedLanguageCode;
    int volumeSetting;
    byte[] archiveResumeRecordSlot = new byte[ARCHIVE_COUNT];
    boolean[] archiveCompleted = new boolean[ARCHIVE_COUNT];
    byte[] purchasedUpgradeCount = new byte[UPGRADE_COUNT];
    boolean coinRadarEnabled;
    boolean speedShoesEnabled;
    int selectedIngameMusic;
    int globalBonusCoins;
    int goldenCarrotCount;
    long specialCompletionBits;
    int magicCodeSeed;
    String[] recentMagicCodes = new String[RECENT_MAGIC_CODE_COUNT];
    boolean campaignIntroCompleted;

    /**
     * DataInput/DataOutput 的字段顺序完全对称：
     *
     * writeUTF language
     * writeByte volume
     * repeat 4: writeByte resumeSlot; writeBoolean archiveCompleted
     * repeat 7: writeByte purchasedUpgradeCount
     * writeBoolean coinRadarEnabled
     * writeBoolean speedShoesEnabled
     * writeByte selectedIngameMusic
     * writeShort globalBonusCoins
     * writeShort goldenCarrotCount
     * writeLong specialCompletionBits
     * writeInt magicCodeSeed
     * repeat 5: writeUTF recentMagicCode
     * writeBoolean campaignIntroCompleted
     *
     * 格式没有 version/header。UTF 字段为 Java DataOutput modified UTF，因此 record
     * 总长度可变，不能把后续字段当成固定 byte offset。
     */
    void binaryOrderReferenceOnly() {}

    /**
     * 新档 / RMS 重建默认值。RecordStore record 数不是 0 或 1 时原版删除并重建；
     * 读取异常也回落到同一初始化路径。
     */
    void initializeNewSave(int randomSeed) {
        selectedLanguageCode = "EN";
        volumeSetting = 3;

        for (int i = 0; i < ARCHIVE_COUNT; i++) {
            archiveResumeRecordSlot[i] = 0;
            archiveCompleted[i] = false;
        }
        for (int i = 0; i < UPGRADE_COUNT; i++) {
            purchasedUpgradeCount[i] = 0;
        }

        coinRadarEnabled = false;
        speedShoesEnabled = false;
        selectedIngameMusic = 0;
        globalBonusCoins = 0;
        goldenCarrotCount = 0;
        specialCompletionBits = 0L;
        magicCodeSeed = randomSeed;
        for (int i = 0; i < RECENT_MAGIC_CODE_COUNT; i++) {
            recentMagicCodes[i] = "";
        }
        campaignIntroCompleted = false;
    }

    /**
     * `audioEnabled (a.c)`、当前 archive/slot、关卡内 inventory、elapsed time、
     * 临时 Lock permit 与进行中的 RuntimeAction 都不在 RMS record 中。
     */
    boolean containsTransientGameplayState() {
        return false;
    }
}
