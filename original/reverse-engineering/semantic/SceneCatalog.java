// 研究性语义重建：来源为 UP9 a.class / level reset、Campaign progression、Night Train、
// EN.dat title/dialog strings 与 MusicCatalog。
// 本文件只描述原版 scene identity，不是 BC5R 的现代路由设计。

public final class SceneCatalog {
    static final int SHARED_ARCHIVE = 0;

    static final int SHARED_BEAVER_SHOP = 1;
    static final int SHARED_CLOUD_9 = 2;
    static final int SHARED_DREAM_MACHINE = 3;
    static final int SHARED_REWARD = 4;
    static final int SHARED_WELCOME = 5;

    static final int RELEASE_LEVEL_FIRST = 1;
    static final int RELEASE_LEVEL_LAST = 10;
    static final int RELEASE_BONUS_AFTER_3 = 11;
    static final int RELEASE_BONUS_AFTER_6 = 12;

    static SceneDescriptor gameplayRecord(int archiveNumber, int recordSlot) {
        if (archiveNumber == SHARED_ARCHIVE) {
            switch (recordSlot) {
                case SHARED_BEAVER_SHOP:
                    return new SceneDescriptor(
                        "beaver-shop",
                        DialogCatalog.BEAVER_SHOP,
                        new int[]{DialogCatalog.BEAVER_SHOP_WELCOME_PREFIX, DialogCatalog.BONUS_COIN_SUFFIX},
                        MusicCatalog.SHOP,
                        false
                    );
                case SHARED_CLOUD_9:
                    return new SceneDescriptor(
                        "cloud-9",
                        DialogCatalog.CLOUD_9_TITLE,
                        new int[]{DialogCatalog.CLOUD9_INTRO_PREFIX, DialogCatalog.CLOUD9_MAGIC_CODE_OFFER_SUFFIX},
                        MusicCatalog.SANDMAN,
                        false
                    );
                case SHARED_DREAM_MACHINE:
                    return new SceneDescriptor(
                        "dream-machine",
                        DialogCatalog.DREAM_MACHINE_TITLE,
                        new int[]{DialogCatalog.DREAM_MACHINE_PERMISSION},
                        MusicCatalog.SHOP,
                        false
                    );
                case SHARED_REWARD:
                    return new SceneDescriptor(
                        "dreamland-reward",
                        DialogCatalog.BONUS_LEVEL_TITLE,
                        new int[]{DialogCatalog.FLIGHT_REWARD_OFFER},
                        MusicCatalog.SANDMAN,
                        false
                    );
                case SHARED_WELCOME:
                    return new SceneDescriptor(
                        "dreamland-welcome",
                        DialogCatalog.WELCOME_TITLE,
                        new int[]{DialogCatalog.DREAMLAND_WELCOME},
                        MusicCatalog.SANDMAN,
                        false
                    );
                default:
                    return SceneDescriptor.unknown();
            }
        }

        if (recordSlot >= RELEASE_LEVEL_FIRST && recordSlot <= RELEASE_LEVEL_LAST) {
            // 普通关标题是 "LEVEL " + displayRelease + '-' + recordSlot；
            // BGM 不是 per-level 固定值，必须走 MusicCatalog.resolveGameplayMusic()。
            return new SceneDescriptor(
                "release-level",
                DialogCatalog.LEVEL_PREFIX,
                new int[0],
                null,
                false
            );
        }

        if (recordSlot == RELEASE_BONUS_AFTER_3 || recordSlot == RELEASE_BONUS_AFTER_6) {
            return new SceneDescriptor(
                "timed-bonus",
                DialogCatalog.BONUS_LEVEL_TITLE,
                new int[]{DialogCatalog.BONUS_ROUND_INTRO},
                null, // pre-lock=shop.mid, running=bonus.mid; runtime dependent.
                true
            );
        }

        return SceneDescriptor.unknown();
    }

    /**
     * UP9 当前 JAR 的显示 release 映射。archive 1..4 在 HUD 标题中显示成 5..8；
     * Loader 仍然直接读取 01.dat..04.dat，不应把 display number 写回 provenance。
     */
    static int displayReleaseNumber(int archiveNumber) {
        int[] display = {5, 6, 7, 8}; // 原版 `ci`
        return archiveNumber >= 1 && archiveNumber <= display.length
            ? display[archiveNumber - 1]
            : archiveNumber;
    }

    /**
     * 顶层非 gameplay scene；它们不由 DAT record 的普通 soundtrack resolver 管理。
     */
    static String topLevelSceneMusic(int runtimeState) {
        switch (runtimeState) {
            case 4:  return MusicCatalog.TITLE;
            case 12: return MusicCatalog.TRAIN;
            case 13: return MusicCatalog.UNIVERSE; // Dream Code generation
            case 14: return MusicCatalog.FLIGHT;
            case 15: return MusicCatalog.CLEARED;  // Golden Carrot special result
            default: return null;
        }
    }

    /** Night Train 持久票据 D[0]/D[1] 对应的 destination。 */
    static int nightTrainDestinationSlot(int trainAction) {
        switch (trainAction) {
            case 1: return SHARED_DREAM_MACHINE;
            case 2: return SHARED_CLOUD_9;
            default: return -1;
        }
    }

    static final class SceneDescriptor {
        final String semanticName;
        final int titleStringId;
        final int[] primaryDialogStringIds;
        final String fixedGameplayMusic;
        final boolean runtimeMusicChanges;

        SceneDescriptor(
            String semanticName,
            int titleStringId,
            int[] primaryDialogStringIds,
            String fixedGameplayMusic,
            boolean runtimeMusicChanges
        ) {
            this.semanticName = semanticName;
            this.titleStringId = titleStringId;
            this.primaryDialogStringIds = primaryDialogStringIds;
            this.fixedGameplayMusic = fixedGameplayMusic;
            this.runtimeMusicChanges = runtimeMusicChanges;
        }

        static SceneDescriptor unknown() {
            return new SceneDescriptor("unknown", -1, new int[0], null, false);
        }
    }

    private SceneCatalog() {}
}
