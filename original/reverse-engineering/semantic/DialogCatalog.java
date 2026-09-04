// 研究性语义索引：来源为 UP9 EN.dat + a.class 的直接字符串使用点。
// 完整 123 条英文原文保存在 notes/up09-language-catalog.md；本文件只保留事件/用途 -> string id，
// 避免把资源文本和 runtime 控制流混在一起。

public final class DialogCatalog {
    // ---- Common UI ----
    static final int NEW_GAME = 0;
    static final int CONTINUE = 1;
    static final int MUSIC_ON_SUFFIX = 2;
    static final int MUSIC_OFF_SUFFIX = 3;
    static final int MUSIC = 4;
    static final int VOLUME = 5;
    static final int SOUND_TEST = 6;
    static final int SOUND_TEST_INGAME_1 = 7;
    static final int SOUND_TEST_INGAME_2 = 8;
    static final int SOUND_TEST_INGAME_3 = 9;
    static final int SOUND_TEST_BONUS_LEVEL = 10;
    static final int SOUND_TEST_LEVEL_COMPLETE = 11;
    static final int SOUND_TEST_LAWNMOWER = 12;
    static final int SOUND_TEST_SANDMAN = 13;
    static final int SOUND_TEST_BEAVER = 14;
    static final int SOUND_TEST_UNIVERSE = 15;
    static final int SOUND_TEST_GOLDEN_CARROT = 16;
    static final int LANGUAGE = 17;
    static final int HELP = 18;
    static final int CREDITS = 19;
    static final int EXIT_LEVEL = 20;
    static final int QUIT_GAME = 21;
    static final int BEAVER_SHOP = 22;
    static final int NIGHT_TRAIN = 23;
    static final int MAGIC_CODES = 24;
    static final int DREAM_MACHINE = 25;
    static final int CLOUD_9 = 26;
    static final int RESTART_LEVEL = 27;
    static final int MENU = 28;
    static final int BACK = 29;
    static final int OK = 30;
    static final int CONTINUE_BUTTON = 31;
    static final int YES = 32;
    static final int NO = 33;
    static final int PLEASE = 34;
    static final int BUY = 35;
    static final int DOWNLOAD = 36;
    static final int PAUSED = 37;
    static final int LOADING = 38;
    static final int LEVEL_PREFIX = 39;
    static final int CLOUD_9_TITLE = 40;
    static final int DREAM_MACHINE_TITLE = 41;
    static final int BONUS_LEVEL_TITLE = 42;
    static final int WELCOME_TITLE = 43;

    // ---- Result / confirmation / system dialog ----
    static final int FINISHED_LEVEL = 44;
    static final int RESULT_TIME = 45;
    static final int RESULT_BONUS_COINS = 46;
    static final int RESULT_TOTAL_COINS = 47;
    static final int RESULT_OF = 48;
    static final int HELP_GOAL = 49;
    static final int HELP_CONTROLS = 50;
    static final int FATAL_ERROR = 51;
    static final int CREDITS_TEXT = 52;
    static final int GAME_OVER = 53;
    static final int TIME_HAS_RUN_OUT = 54;
    static final int CONFIRM_EXIT_LEVEL = 55;
    static final int CONFIRM_QUIT_GAME = 56;
    static final int CONFIRM_ENABLE_MUSIC = 57;
    static final int HELP_CONTROL_TEXT = 58;
    static final int HELP_GAME_INTRO = 59;

    // ---- Original help pages: EN.dat itself is a second semantic source for mechanics ----
    // 60..80 are mechanism/tutorial descriptions. eD[][] chooses which raw tiles are drawn beside each page.
    static final int HELP_CARROT_AND_EGG = 60;
    static final int HELP_HIGH_GRASS = 61;
    static final int HELP_TARGET_AREA = 62;
    static final int HELP_MOWER_PARKING_AND_GAS = 63;
    static final int HELP_SPEED = 64;
    static final int HELP_CRUMBLY_ROCK = 65;
    static final int HELP_COLOR_BLOCKS = 66;
    static final int HELP_TRAPS = 67;
    static final int HELP_CAROUSEL = 68;
    static final int HELP_TIDE = 69;
    static final int HELP_LEAF = 70;
    static final int HELP_KITE = 71;
    static final int HELP_WHIRLWIND_AND_LANDING = 72;
    static final int HELP_DRAGON = 73;
    static final int HELP_MIRROR = 74;
    static final int HELP_PLANK = 75;
    static final int HELP_CLOUDS = 76;
    static final int HELP_WINDMILL = 77;
    static final int HELP_GIANT_BEAN = 78;
    static final int HELP_SHOVEL = 79;
    static final int HELP_GOLDEN_CARROT = 80;
    static final int PRESS_A_KEY = 81;

    // ---- Beaver Shop item labels ----
    static final int SHOP_TICKET_DREAM_MACHINE = 82;
    static final int SHOP_TICKET_CLOUD_9 = 83;
    static final int SHOP_SUPER_KEY = 84;
    static final int SHOP_STEREO_SYSTEM = 85; // runtime unlock is Sound Test
    static final int SHOP_EXTRA_MUSIC = 86;
    static final int SHOP_SPEED_SHOES = 87;
    static final int SHOP_COIN_RADAR = 88;
    static final int CURRENT_MUSIC = 89;
    static final int MUSIC_AUTO = 90; // runtime value H == -1

    // Shop long descriptions; terrain 0x97..0x9D index directly into these descriptions.
    static final int SHOP_DESC_DREAM_MACHINE_TICKET = 91;
    static final int SHOP_DESC_CLOUD_9_TICKET = 92;
    static final int SHOP_DESC_SUPER_KEY = 93;
    static final int SHOP_DESC_STEREO = 94;
    static final int SHOP_DESC_EXTRA_MUSIC = 95;
    static final int SHOP_DESC_SPEED_SHOES = 96;
    static final int SHOP_DESC_COIN_RADAR = 97;
    static final int SHOP_CANNOT_AFFORD = 98;
    static final int SHOP_CONFIRM_BUY = 99;

    // ---- Shared scene / campaign dialog ----
    static final int BEAVER_SHOP_WELCOME_PREFIX = 100;
    static final int BONUS_COIN_SUFFIX = 101;

    static final int CLOUD9_INTRO_PREFIX = 102;
    static final int CLOUD9_MAGIC_CODE_OFFER_SUFFIX = 103;
    static final int CLOUD9_NO_GOLDEN_CARROTS = 104;
    static final int MAGIC_CODE_GENERATING = 105;
    static final int MAGIC_CODE_WEB_PROMPT = 106;
    static final int FIRST_MAGIC_CODE_PREFIX = 107;
    static final int FIRST_MAGIC_CODE_SUFFIX = 108;

    static final int DREAM_MACHINE_PERMISSION = 109;
    static final int DREAMLAND_WELCOME = 110;
    static final int LEVEL_DOWNLOADS_UNSUPPORTED = 111;
    static final int FLIGHT_REWARD_OFFER = 112;

    static final int BONUS_ROUND_INTRO = 113;
    static final int BONUS_HAS_SUPER_KEY = 114;
    static final int BONUS_BUY_ONE_TIME_KEY_PREFIX = 115;
    static final int BONUS_BUY_ONE_TIME_KEY_SUFFIX = 116;
    static final int BONUS_FREE_KEY_FALLBACK = 117;
    static final int BONUS_GO_GET_GOLDEN_CARROT = 118;

    static final int NIGHT_TRAIN_NO_TICKET = 119;
    static final int GOLDEN_CARROT_RESULT_PREFIX = 120;
    static final int GOLDEN_CARROT_RESULT_SUFFIX = 121;
    static final int LAST_MAGIC_CODES = 122;

    /** Normal level result screen is assembled from these fragments, not one precomposed string. */
    static int[] normalLevelResultFragments() {
        return new int[]{FINISHED_LEVEL, RESULT_TIME, RESULT_BONUS_COINS, RESULT_OF, RESULT_TOTAL_COINS};
    }

    static int confirmationDialogForAction(int kind) {
        switch (kind) {
            case 0: return CONFIRM_EXIT_LEVEL;
            case 1: return CONFIRM_QUIT_GAME;
            case 2: return CONFIRM_ENABLE_MUSIC;
            default: return -1;
        }
    }

    /**
     * Shared-character Body handler (`0xEA` Sandman body / `0xF7` Beaver body) 的 bU 语义。
     * archive 0 时 bU 1..5 是 shared special scene；archive>0 的 1..10 则是普通关 record，不能混用。
     */
    static int[] dialogForSharedScene(int sharedSceneSlot) {
        switch (sharedSceneSlot) {
            case 1: // BEAVER SHOP
                return new int[]{BEAVER_SHOP_WELCOME_PREFIX, BONUS_COIN_SUFFIX};
            case 2: // CLOUD 9
                return new int[]{CLOUD9_INTRO_PREFIX, CLOUD9_MAGIC_CODE_OFFER_SUFFIX};
            case 3: // DREAM MACHINE
                return new int[]{DREAM_MACHINE_PERMISSION};
            case 4: // Reward / flight offer
                return new int[]{FLIGHT_REWARD_OFFER};
            case 5: // Dreamland intro
                return new int[]{DREAMLAND_WELCOME};
            default:
                return new int[0];
        }
    }

    static int shopDescriptionForUpgradeIndex(int upgradeIndex) {
        return upgradeIndex >= 0 && upgradeIndex <= 6
            ? SHOP_DESC_DREAM_MACHINE_TICKET + upgradeIndex
            : -1;
    }

    /** Timed Bonus 根据持久 Super Key / 临时 permit / currency 走不同文案。 */
    static int[] timedBonusDialog(
        boolean timerRunning,
        boolean hasPermanentSuperKey,
        boolean alreadyHasTemporaryPermit,
        int globalBonusCoins
    ) {
        if (timerRunning || alreadyHasTemporaryPermit) {
            return new int[]{BONUS_GO_GET_GOLDEN_CARROT};
        }
        if (hasPermanentSuperKey) {
            return new int[]{BONUS_ROUND_INTRO, BONUS_HAS_SUPER_KEY};
        }
        if (globalBonusCoins >= 3) {
            return new int[]{BONUS_ROUND_INTRO, BONUS_BUY_ONE_TIME_KEY_PREFIX, BONUS_COIN_SUFFIX, BONUS_BUY_ONE_TIME_KEY_SUFFIX};
        }
        return new int[]{BONUS_ROUND_INTRO, BONUS_FREE_KEY_FALLBACK};
    }

    /** Dream Machine Body 0xEB 在 UP9 直接进入 state 16，显示“不支持关卡下载”。 */
    static int dreamMachineBodyNotice() {
        return LEVEL_DOWNLOADS_UNSUPPORTED;
    }

    private DialogCatalog() {}
}
