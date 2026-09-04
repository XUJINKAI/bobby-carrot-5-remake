// 研究性语义重建：来源为 UP9 a.class / a.J()。
// 本文件重点保留原版 midpoint interaction 的真实优先级，不作为可直接编译的产品源码。

public final class MidpointInteractionDispatcher {
    private static final int EMPTY = 0xFF;

    // object
    private static final int CARROT = 0xCA;
    private static final int EGG_NEST_EMPTY = 0xCB;
    private static final int EGG_NEST_FILLED = 0xCC;
    private static final int LOCK = 0xCD;
    private static final int BEANSTALK_TIP = 0xCE;
    private static final int BEAN = 0xCF;
    private static final int PLANK = 0xD4;
    private static final int PLANK_CRUMBLING = 0xD5;
    private static final int DRAGON_TAIL = 0xD9;
    private static final int MOWER = 0xDC;
    private static final int GAS = 0xDD;
    private static final int BEANSTALK_MID = 0xDE;
    private static final int BEAN_FIELD = 0xDF;
    private static final int BEANSTALK_BASE = 0xEE;
    private static final int KITE = 0xF3;
    private static final int WHIRLWIND = 0xF4;
    private static final int LANDING = 0xF5;
    private static final int GOLDEN_CARROT = 0xF6;
    private static final int BONUS_COIN = 0xF8;

    // terrain
    private static final int EXIT = 0x96;
    private static final int SHOVEL_PICKUP = 0x9F;
    private static final int MOWER_PARKING = 0xA0;
    private static final int SPEED_SWITCH_TRIGGERABLE = 0xA2;
    private static final int CAROUSEL_SWITCH_TRIGGERABLE = 0xA4;
    private static final int TIDE_SWITCH_TRIGGERABLE = 0xA6;
    private static final int WIND_SWITCH_UP_ON = 0xA7;
    private static final int WIND_SWITCH_UP_OFF = 0xA8;
    private static final int WIND_SWITCH_DOWN_ON = 0xA9;
    private static final int WIND_SWITCH_DOWN_OFF = 0xAA;
    private static final int WIND_SWITCH_LEFT_ON = 0xAB;
    private static final int WIND_SWITCH_LEFT_OFF = 0xAC;
    private static final int WIND_SWITCH_RIGHT_ON = 0xAD;
    private static final int WIND_SWITCH_RIGHT_OFF = 0xAE;
    private static final int TRAP_ACTIVE = 0xAF;
    private static final int TRAP_INACTIVE = 0xB0;
    private static final int MIRROR_MIN = 0xB1;
    private static final int MIRROR_MAX = 0xB4;
    private static final int CAROUSEL_MIN = 0xB9;
    private static final int CAROUSEL_MAX = 0xBE;
    private static final int COLOR_SWITCH_MIN = 0xBF;
    private static final int COLOR_SWITCH_MAX = 0xC2;
    private static final int ICE = 0x94;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int playerX;
    private int playerY;
    private boolean ridingMower;
    private boolean airborne;

    private int remainingObjectives;
    private int beanCount;
    private boolean hasGas;
    private boolean hasKite;
    private boolean hasShovel;
    private boolean climbingBeanstalk;
    private boolean slidingOnIce;

    // previous-tile leave markers
    private int pendingTrapX = -1;
    private int pendingTrapY = -1;
    private int pendingCarouselX = -1;
    private int pendingCarouselY = -1;
    private int pendingMirrorX = -1;
    private int pendingMirrorY = -1;
    private int pendingPlankX = -1;
    private int pendingPlankY = -1;
    private int pendingEggNestX = -1;
    private int pendingEggNestY = -1;

    /**
     * 对应原版 `a.J()`。
     *
     * 该方法在 Bobby 一格视觉运动跨过中线时执行，而不是完全抵达后执行。
     * 原版顺序必须保留：previous leave -> flight gate -> current object -> current terrain。
     */
    void dispatch() {
        int terrain = terrainGrid[playerY][playerX] & 0xFF;
        int object = objectGrid[playerY][playerX] & 0xFF;

        settleOnePreviousLeaveTrigger();

        // Airborne 时普通 object/terrain interaction 整体跳过，只识别 Landing。
        if (airborne) {
            if (object == LANDING) {
                beginLanding();
            }
            return;
        }

        // Whirlwind 优先于其它普通 object，并立即返回。
        if (object == WHIRLWIND) {
            beginTakeoff();
            return;
        }

        // Plank 只登记 leave marker，并立即返回；当前格其余 interaction 不继续执行。
        if (object == PLANK) {
            pendingPlankX = playerX;
            pendingPlankY = playerY;
            return;
        }

        // Dragon Tail 可启动 Head preparation，但不会阻止后续当前格规则继续执行。
        if (object == DRAGON_TAIL && dragonHeadExists() && fireballIdle()) {
            beginDragonAttackPreparation();
        }

        climbingBeanstalk = false;

        if (!ridingMower) {
            switch (object) {
                case LOCK:
                    consumeLockAndMaybeStartTimedChallenge();
                    break;

                case BONUS_COIN:
                    collectBonusCoin();
                    objectGrid[playerY][playerX] = (byte)EMPTY;
                    break;

                case GAS:
                    hasGas = true;
                    objectGrid[playerY][playerX] = (byte)EMPTY;
                    break;

                case KITE:
                    hasKite = true;
                    objectGrid[playerY][playerX] = (byte)EMPTY;
                    break;

                case BEAN:
                    beanCount++;
                    objectGrid[playerY][playerX] = (byte)EMPTY;
                    break;

                case CARROT:
                    remainingObjectives--;
                    objectGrid[playerY][playerX] = (byte)0xC9; // consumed carrot hole
                    break;

                case EGG_NEST_EMPTY:
                    // 很关键：原版不是 midpoint 当场填充，而是登记到下一次 J() 开头。
                    pendingEggNestX = playerX;
                    pendingEggNestY = playerY;
                    break;

                case BEAN_FIELD:
                    if (beanCount > 0) {
                        beanCount--;
                        startBeanGrowth(playerX, playerY);
                    } else {
                        showMissingBeanHint();
                    }
                    break;

                case BEANSTALK_TIP:
                case BEANSTALK_MID:
                case BEANSTALK_BASE:
                    climbingBeanstalk = true;
                    break;

                case MOWER:
                    // 真正 ridingMower=true 在本格视觉移动完成 ay==0 时才设置。
                    markMowerMountPending();
                    break;

                case GOLDEN_CARROT:
                    collectGoldenCarrotAndFinishSpecialLevel();
                    return;

                default:
                    break;
            }
        }

        // object 处理之后才进入 terrain dispatcher。
        switch (terrain) {
            case CAROUSEL_SWITCH_TRIGGERABLE:
                rotateAllCarouselsAndSwitchStates();
                return;

            case SPEED_SWITCH_TRIGGERABLE:
                toggleAllSpeedDirectionsAndSwitchStates();
                return;

            case ICE:
                slidingOnIce = true;
                forceIcePresentationFrame();
                return;

            case TIDE_SWITCH_TRIGGERABLE:
                toggleAllTideDirectionsAndSwitchStates();
                return;

            case TRAP_INACTIVE:
                pendingTrapX = playerX;
                pendingTrapY = playerY;
                return;

            case SHOVEL_PICKUP:
                if (!ridingMower) {
                    hasShovel = true;
                    replaceTerrainWithClearedGround();
                }
                return;

            case TRAP_ACTIVE:
                if (!ridingMower) {
                    startDeath();
                }
                return;

            case EXIT:
                if (!ridingMower && remainingObjectives == 0) {
                    beginLevelCompletion();
                }
                return;

            case MOWER_PARKING:
                if (ridingMower) {
                    markMowerDismountPending();
                }
                return;

            default:
                break;
        }

        if (terrain >= COLOR_SWITCH_MIN && terrain <= COLOR_SWITCH_MAX) {
            toggleColorGroup(terrain);
            return;
        }

        if (!ridingMower && terrain >= CAROUSEL_MIN && terrain <= CAROUSEL_MAX) {
            pendingCarouselX = playerX;
            pendingCarouselY = playerY;
            return;
        }

        if (!ridingMower && terrain >= MIRROR_MIN && terrain <= MIRROR_MAX) {
            pendingMirrorX = playerX;
            pendingMirrorY = playerY;
            return;
        }

        if (terrain >= WIND_SWITCH_UP_ON && terrain <= WIND_SWITCH_RIGHT_OFF) {
            handleWindSwitch(terrain);
            return;
        }

        if (terrain >= 0x97 && terrain <= 0x9D) {
            openShopTileDialog(terrain);
        }
    }

    /**
     * 原版 J() 开头使用严格 `if / else if / else if ...`，因此一次 midpoint 只会
     * settle 一种 previous marker。正常地图状态下这些 marker 互斥；保留优先级可让
     * 异常/编辑器组合地图也与原版一致。
     */
    private void settleOnePreviousLeaveTrigger() {
        if (pendingTrapX != -1) {
            terrainGrid[pendingTrapY][pendingTrapX] = (byte)TRAP_ACTIVE;
            pendingTrapX = -1;
            return;
        }

        if (pendingCarouselX != -1) {
            terrainGrid[pendingCarouselY][pendingCarouselX] =
                rotateCarousel(terrainGrid[pendingCarouselY][pendingCarouselX]);
            pendingCarouselX = -1;
            return;
        }

        if (pendingMirrorX != -1) {
            terrainGrid[pendingMirrorY][pendingMirrorX] =
                rotateMirror(terrainGrid[pendingMirrorY][pendingMirrorX]);
            pendingMirrorX = -1;
            return;
        }

        if (pendingPlankX != -1) {
            clearOlderCrumblingPlankIfAny();
            objectGrid[pendingPlankY][pendingPlankX] = (byte)PLANK_CRUMBLING;
            startPlankDecay(pendingPlankX, pendingPlankY);
            pendingPlankX = -1;
            return;
        }

        if (pendingEggNestX != -1) {
            remainingObjectives--;
            objectGrid[pendingEggNestY][pendingEggNestX] = (byte)EGG_NEST_FILLED;
            pendingEggNestX = -1;
        }
    }

    private void beginLanding() {}
    private void beginTakeoff() {}
    private boolean dragonHeadExists() { return false; }
    private boolean fireballIdle() { return false; }
    private void beginDragonAttackPreparation() {}
    private void consumeLockAndMaybeStartTimedChallenge() {}
    private void collectBonusCoin() {}
    private void startBeanGrowth(int x, int y) {}
    private void showMissingBeanHint() {}
    private void markMowerMountPending() {}
    private void collectGoldenCarrotAndFinishSpecialLevel() {}
    private void rotateAllCarouselsAndSwitchStates() {}
    private void toggleAllSpeedDirectionsAndSwitchStates() {}
    private void forceIcePresentationFrame() {}
    private void toggleAllTideDirectionsAndSwitchStates() {}
    private void replaceTerrainWithClearedGround() {}
    private void startDeath() {}
    private void beginLevelCompletion() {}
    private void markMowerDismountPending() {}
    private void toggleColorGroup(int terrain) {}
    private void handleWindSwitch(int terrain) {}
    private void openShopTileDialog(int terrain) {}
    private byte rotateCarousel(byte terrain) { return terrain; }
    private byte rotateMirror(byte terrain) { return terrain; }
    private void clearOlderCrumblingPlankIfAny() {}
    private void startPlankDecay(int x, int y) {}
}
