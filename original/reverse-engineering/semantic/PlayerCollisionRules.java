// 研究性语义重建：来源为 UP9 a.class / a.a(int,int,boolean)。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class PlayerCollisionRules {
    private static final int TERRAIN_SNOW = 0x4D;
    private static final int TERRAIN_DEFAULT_WALKABLE_MIN = 0x5E;
    private static final int TERRAIN_DEFAULT_WALKABLE_MAX = 0xC8;

    private static final int TERRAIN_CAROUSEL_RU = 0xB9;
    private static final int TERRAIN_CAROUSEL_LU = 0xBA;
    private static final int TERRAIN_CAROUSEL_LD = 0xBB;
    private static final int TERRAIN_CAROUSEL_RD = 0xBC;
    private static final int TERRAIN_CAROUSEL_VERTICAL = 0xBD;
    private static final int TERRAIN_CAROUSEL_HORIZONTAL = 0xBE;

    private static final int TERRAIN_YELLOW_BLOCK_RAISED = 0xC3;
    private static final int TERRAIN_PINK_BLOCK_RAISED = 0xC5;
    private static final int TERRAIN_HIGH_GRASS = 0xC7;
    private static final int TERRAIN_HIGH_GRASS_OBJECTIVE = 0xC8;

    private static final int OBJECT_CARROT = 0xCA;
    private static final int OBJECT_EGG_NEST_FILLED = 0xCC;
    private static final int OBJECT_LOCK = 0xCD;
    private static final int OBJECT_BEANSTALK_TIP = 0xCE;
    private static final int OBJECT_WINDMILL_UP = 0xD0;
    private static final int OBJECT_WINDMILL_DOWN = 0xD1;
    private static final int OBJECT_WINDMILL_LEFT = 0xD2;
    private static final int OBJECT_WINDMILL_RIGHT = 0xD3;
    private static final int OBJECT_PLANK = 0xD4;
    private static final int OBJECT_DRAGON_HEAD = 0xD7;
    private static final int OBJECT_DRAGON_BODY = 0xD8;
    private static final int OBJECT_SANDMAN = 0xDA;
    private static final int OBJECT_DREAM_MACHINE = 0xDB;
    private static final int OBJECT_MOWER = 0xDC;
    private static final int OBJECT_BEANSTALK_MID = 0xDE;
    private static final int OBJECT_ICE_BLOCK = 0xE3;
    private static final int OBJECT_BEAVER = 0xE7;
    private static final int OBJECT_SANDMAN_BODY = 0xEA;
    private static final int OBJECT_DREAM_MACHINE_BODY = 0xEB;
    private static final int OBJECT_CRUMBLY_ROCK = 0xED;
    private static final int OBJECT_WHIRLWIND = 0xF4;
    private static final int OBJECT_BEAVER_BODY = 0xF7;

    private static final int OBJECT_FENCE_MIN = 0xF9;
    private static final int OBJECT_FENCE_MAX = 0xFE;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;
    private int width;
    private int height;

    private int playerGridX;
    private int playerGridY;

    private boolean ridingMower;
    private boolean airborne;
    private boolean hasGas;
    private boolean hasKite;
    private boolean hasShovel;
    private boolean hasTemporaryKey;
    private int permanentSuperKeyCount;
    private int speedContinuation;

    private int shovelTicksRemaining;
    private int movementDirection;
    private int playerAnimationFrame;
    private int speechBubbleKind;
    private int speechBubbleTicks;
    private boolean mowerWillCutGrass;

    /**
     * 对应原版统一玩家格通行判定 `a.a(dx,dy,specialMode)`。
     *
     * 判定顺序本身属于原版语义：
     * 1. 边界与 airborne；
     * 2. 当前 Carousel 的离开方向；
     * 3. 停止中的 moving entity；
     * 4. terrain 默认通行域与 terrain 特判；
     * 5. object 对 terrain 结果的覆盖。
     *
     * 因此不能把这段逻辑等价简化成独立的 terrain.walkable 与 object.blocking 两个布尔值。
     */
    boolean canPlayerMove(int dx, int dy, boolean speedProbe) {
        int targetX = playerGridX + dx;
        int targetY = playerGridY + dy;

        // 每次新碰撞尝试都会取消尚未实际启动的铲雪倒计时。
        shovelTicksRemaining = 0;

        if (targetX < 0 || targetY < 0 || targetX >= width || targetY >= height) {
            return false;
        }

        // 飞行模式不走普通 terrain/object 碰撞规则，但仍受地图边界限制。
        if (airborne) {
            return true;
        }

        int sourceTerrain = terrainGrid[playerGridY][playerGridX] & 0xFF;
        if (!carouselAllowsExit(sourceTerrain, dx, dy)) {
            return false;
        }

        // 非 mower 的 Bobby 可以直接进入一个处于停止状态的 Leaf / Cloud，
        // 此时 moving-entity mount 判定优先于底下 terrain/object。
        if (!ridingMower && mountStoppedMovingEntityAt(targetX, targetY)) {
            return true;
        }

        int targetTerrain = terrainGrid[targetY][targetX] & 0xFF;
        int targetObject = objectGrid[targetY][targetX] & 0xFF;

        boolean terrainPassable =
            targetTerrain >= TERRAIN_DEFAULT_WALKABLE_MIN
                && targetTerrain <= TERRAIN_DEFAULT_WALKABLE_MAX;

        if (terrainPassable && isCarousel(targetTerrain)) {
            terrainPassable = !ridingMower && carouselAllowsEntry(targetTerrain, dx, dy);
        } else if (terrainPassable && isMirror(targetTerrain)) {
            terrainPassable = !ridingMower;
        } else if (
            targetTerrain == TERRAIN_HIGH_GRASS
                || targetTerrain == TERRAIN_HIGH_GRASS_OBJECTIVE
        ) {
            if (ridingMower) {
                mowerWillCutGrass = true;
                terrainPassable = true;
            } else {
                terrainPassable = false;
            }
        } else if (
            targetTerrain == TERRAIN_YELLOW_BLOCK_RAISED
                || targetTerrain == TERRAIN_PINK_BLOCK_RAISED
        ) {
            terrainPassable = false;
        }

        if (targetTerrain == TERRAIN_SNOW && !ridingMower) {
            if (hasShovel) {
                shovelTicksRemaining = 32;
                playerAnimationFrame = 0;
                movementDirection = directionFor(dx, dy);
                speedContinuation = 0;
            } else {
                speechBubbleKind = 3;
                speechBubbleTicks = 4;
            }
            // Snow 本身不属于默认可走区；本次 move 仍然失败。
            terrainPassable = false;
        }

        // 三类 object 能覆盖不可走 terrain。Bean Tip / Mid 会生长到原本不可走的
        // terrain 上，所以这一层覆盖是原版必要语义，不只是 Plank 的特例。
        if (!terrainPassable) {
            if (
                targetObject == OBJECT_BEANSTALK_TIP
                    || targetObject == OBJECT_BEANSTALK_MID
                    || targetObject == OBJECT_PLANK
            ) {
                return !ridingMower;
            }
            return false;
        }

        switch (targetObject) {
            case OBJECT_CARROT:
                return !ridingMower;

            case OBJECT_EGG_NEST_FILLED:
            case OBJECT_WINDMILL_UP:
            case OBJECT_WINDMILL_DOWN:
            case OBJECT_WINDMILL_LEFT:
            case OBJECT_WINDMILL_RIGHT:
            case OBJECT_DRAGON_HEAD:
            case OBJECT_DRAGON_BODY:
            case OBJECT_SANDMAN:
            case OBJECT_DREAM_MACHINE:
            case OBJECT_ICE_BLOCK:
            case OBJECT_BEAVER:
                return false;

            case OBJECT_LOCK:
                if (ridingMower) {
                    return false;
                }
                if (hasTemporaryKey || permanentSuperKeyCount > 0) {
                    return true;
                }
                speechBubbleKind = 1;
                speechBubbleTicks = 4;
                return false;

            case OBJECT_MOWER:
                if (hasGas) {
                    return true;
                }
                speechBubbleKind = 0;
                speechBubbleTicks = 4;
                return false;

            case OBJECT_SANDMAN_BODY:
            case OBJECT_BEAVER_BODY:
                openCampaignInteraction(targetObject);
                return false;

            case OBJECT_DREAM_MACHINE_BODY:
                openDreamMachineInteraction();
                return false;

            case OBJECT_CRUMBLY_ROCK:
                // 普通 Bobby 不能通过。Mower 只有在已经处于 Speed 连续移动，
                // 或 Speed tile 正在用 special probe 检查下一格时才能撞碎。
                if (!ridingMower) {
                    return false;
                }
                return speedContinuation > 0 || speedProbe;

            case OBJECT_WHIRLWIND:
                if (ridingMower) {
                    return false;
                }
                if (hasKite) {
                    return true;
                }
                speechBubbleKind = 2;
                speechBubbleTicks = 4;
                return false;

            default:
                if (targetObject >= OBJECT_FENCE_MIN && targetObject <= OBJECT_FENCE_MAX) {
                    return false;
                }
                return true;
        }
    }

    private boolean carouselAllowsExit(int terrain, int dx, int dy) {
        switch (terrain) {
            case TERRAIN_CAROUSEL_RU:
                return dx == 1 || dy == -1;
            case TERRAIN_CAROUSEL_LU:
                return dx == -1 || dy == -1;
            case TERRAIN_CAROUSEL_LD:
                return dx == -1 || dy == 1;
            case TERRAIN_CAROUSEL_RD:
                return dx == 1 || dy == 1;
            case TERRAIN_CAROUSEL_VERTICAL:
                return dy != 0;
            case TERRAIN_CAROUSEL_HORIZONTAL:
                return dx != 0;
            default:
                return true;
        }
    }

    private boolean carouselAllowsEntry(int terrain, int dx, int dy) {
        switch (terrain) {
            case TERRAIN_CAROUSEL_RU:
                return dx == -1 || dy == 1;
            case TERRAIN_CAROUSEL_LU:
                return dx == 1 || dy == 1;
            case TERRAIN_CAROUSEL_LD:
                return dx == 1 || dy == -1;
            case TERRAIN_CAROUSEL_RD:
                return dx == -1 || dy == -1;
            case TERRAIN_CAROUSEL_VERTICAL:
                return dy != 0;
            case TERRAIN_CAROUSEL_HORIZONTAL:
                return dx != 0;
            default:
                return true;
        }
    }

    private boolean isCarousel(int terrain) {
        return terrain >= TERRAIN_CAROUSEL_RU && terrain <= TERRAIN_CAROUSEL_HORIZONTAL;
    }

    private boolean isMirror(int terrain) {
        return terrain >= 0xB1 && terrain <= 0xB4;
    }

    private int directionFor(int dx, int dy) {
        if (dx < 0) return 0;
        if (dx > 0) return 1;
        if (dy < 0) return 2;
        return 3;
    }

    private boolean mountStoppedMovingEntityAt(int x, int y) {
        throw new UnsupportedOperationException("see MovingEntities.java");
    }

    private void openCampaignInteraction(int objectType) {
        // 具体 campaign 条件在后续 semantic 文件中继续拆解。
    }

    private void openDreamMachineInteraction() {
        // 具体 Dream Machine 流程在后续 semantic 文件中继续拆解。
    }
}
