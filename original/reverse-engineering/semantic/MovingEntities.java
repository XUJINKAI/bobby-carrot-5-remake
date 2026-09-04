// 研究性语义重建：来源为 UP9 a.class / a.P()、
// a.a(int,int)、a.a(int,int,int,int) 与 moving-entity grid-pass bytecode。
// 本文件重点恢复 Cloud / Leaf 共用的 runtime moving entity 模型，不作为产品源码。

public final class MovingEntities {
    private static final int STOPPED = 4;
    private static final int LEFT = 0;
    private static final int RIGHT = 1;
    private static final int UP = 2;
    private static final int DOWN = 3;

    private static final int NORMAL_PIXELS_PER_STEP = 3;
    private static final int FAST_PIXELS_PER_STEP = 6;
    private static final int TILE_SIZE = 48;

    private static final int CLOUD_RED = 0xE0;
    private static final int CLOUD_PURPLE = 0xE1;
    private static final int CLOUD_GREEN = 0xE2;
    private static final int LEAF = 0xEC;

    private static final int CLOUD_RED_PARKING = 0xF0;
    private static final int CLOUD_PURPLE_PARKING = 0xF1;
    private static final int CLOUD_GREEN_PARKING = 0xF2;

    private static final int TIDE_DOWN = 0x57;
    private static final int TIDE_UP = 0x58;
    private static final int TIDE_RIGHT = 0x59;
    private static final int TIDE_LEFT = 0x5A;
    private static final int FALL_START = 0x5B;
    private static final int FALL_MIDDLE = 0x5C;
    private static final int FALL_END = 0x5D;

    private int movingEntityCount;
    private byte[] type;
    private byte[] direction;
    private byte[] pixelsRemaining;
    private short[] pixelX;
    private short[] pixelY;
    private boolean[] fastMotion;

    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int mountedEntityIndex = -1;
    private boolean justMountedMovingEntity;
    private int playerPixelX;
    private int playerPixelY;
    private int playerGridX;
    private int playerGridY;

    /** Wind / Camera 依赖，具体 field 映射见 CloudWind / GameplayCameraFocus。 */
    private CloudWind cloudWind;
    private GameplayCameraFocus cameraFocus;

    /**
     * 对应原版 `a.P()`：每个 gameplay step 按数组 index 顺序处理所有 moving entity。
     */
    void gameplayStep() {
        for (int index = 0; index < movingEntityCount; index++) {
            int remaining = pixelsRemaining[index] & 0xFF;

            if (remaining > 0) {
                remaining = advanceCurrentTile(index, remaining);
            }

            if (cameraTracks(index)) {
                followCamera(index);
            }

            if (remaining <= 0) {
                chooseNextTile(index);
            }
        }
    }

    /**
     * 已经跨格中的 3/6px 子步。
     *
     * 在真正修改像素以前，原版会用候选下一像素坐标检查其它**正在移动**的动态实体。
     * 如果 box 重叠，本 gameplay step 该实体不前进，pixelsRemaining 也不减少；下一 step 重试。
     */
    private int advanceCurrentTile(int index, int remaining) {
        int pixels = fastMotion[index] ? FAST_PIXELS_PER_STEP : NORMAL_PIXELS_PER_STEP;
        int dx = dx(direction[index]) * pixels;
        int dy = dy(direction[index]) * pixels;

        int candidateX = pixelX[index] + dx;
        int candidateY = pixelY[index] + dy;

        // 原版这里传 collisionDirection=STOPPED(4)，所以只把 direction!=4 的其它实体
        // 视为本像素子步碰撞对象；停止实体不会在这个阶段再次拦截。
        if (overlapsOtherMovingEntity(candidateX, candidateY, index, STOPPED)) {
            return remaining;
        }

        pixelX[index] = (short)candidateX;
        pixelY[index] = (short)candidateY;

        if (mountedEntityIndex == index) {
            // Bobby 与载体使用完全相同的 dx/dy，不是独立 tween。
            playerPixelX += dx;
            playerPixelY += dy;
            playerGridX = playerPixelX / TILE_SIZE;
            playerGridY = playerPixelY / TILE_SIZE;
        }

        remaining -= pixels;
        pixelsRemaining[index] = (byte)remaining;
        return remaining;
    }

    /**
     * 到达 tile boundary 后决定下一格。
     */
    private void chooseNextTile(int index) {
        int rawType = type[index] & 0xFF;
        int currentDirection = direction[index];
        int tileX = pixelX[index] / TILE_SIZE;
        int tileY = pixelY[index] / TILE_SIZE;
        int terrain = terrainGrid[tileY][tileX] & 0xFF;
        int object = objectGrid[tileY][tileX] & 0xFF;

        int nextDirection = currentDirection;
        int nextPixels = 0;
        boolean nextFast = false;
        boolean parkingStop = false;

        if (rawType == LEAF) {
            switch (terrain) {
                case TIDE_LEFT:
                    if (canPlanGridStep(index, tileX, tileY, LEFT)) {
                        nextDirection = LEFT;
                        nextPixels = TILE_SIZE;
                    }
                    break;
                case TIDE_RIGHT:
                    if (canPlanGridStep(index, tileX, tileY, RIGHT)) {
                        nextDirection = RIGHT;
                        nextPixels = TILE_SIZE;
                    }
                    break;
                case TIDE_UP:
                    if (canPlanGridStep(index, tileX, tileY, UP)) {
                        nextDirection = UP;
                        nextPixels = TILE_SIZE;
                    }
                    break;
                case TIDE_DOWN:
                    if (canPlanGridStep(index, tileX, tileY, DOWN)) {
                        nextDirection = DOWN;
                        nextPixels = TILE_SIZE;
                    }
                    break;
                case FALL_START:
                case FALL_MIDDLE:
                case FALL_END:
                    if (canPlanGridStep(index, tileX, tileY, DOWN)) {
                        nextDirection = DOWN;
                        nextPixels = TILE_SIZE;
                        nextFast = true;
                    }
                    break;
                default:
                    break;
            }
        } else {
            parkingStop = isMatchingCloudParking(rawType, object);

            if (!parkingStop) {
                int forcedByWind = cloudWind.forcedDirectionAt(tileX, tileY, currentDirection);
                if (forcedByWind != -1 && canPlanGridStep(index, tileX, tileY, forcedByWind)) {
                    nextDirection = forcedByWind;
                    nextPixels = TILE_SIZE;
                    cloudWind.onCloudForcedByWind(
                        index,
                        forcedByWind,
                        pixelX[index],
                        pixelY[index]
                    );
                }
            }
        }

        // 没有 Tide/Fall/Wind 明确接管，且没有同色 Parking 强制停车时，沿现方向继续。
        if (!parkingStop && nextPixels == 0 && currentDirection != STOPPED) {
            if (canPlanGridStep(index, tileX, tileY, currentDirection)) {
                nextDirection = currentDirection;
                nextPixels = TILE_SIZE;
            }
        }

        if (nextPixels == 0) {
            nextDirection = STOPPED;
        }

        direction[index] = (byte)nextDirection;
        pixelsRemaining[index] = (byte)nextPixels;
        fastMotion[index] = nextFast;
    }

    /**
     * 规划下一完整 tile：先问 entity-type 专用 terrain/wind passage，再检查动态实体 box。
     */
    private boolean canPlanGridStep(int index, int fromX, int fromY, int moveDirection) {
        int targetX = fromX + dx(moveDirection);
        int targetY = fromY + dy(moveDirection);

        if (targetY < 0 || targetY >= terrainGrid.length
                || targetX < 0 || targetX >= terrainGrid[targetY].length) {
            return false;
        }

        int rawType = type[index] & 0xFF;
        int targetTerrain = terrainGrid[targetY][targetX] & 0xFF;

        boolean terrainPassable = rawType == LEAF
            ? leafCanEnter(targetTerrain, moveDirection)
            : cloudCanEnter(targetX, targetY, moveDirection, targetTerrain);

        if (!terrainPassable) {
            return false;
        }

        int targetPixelX = targetX * TILE_SIZE;
        int targetPixelY = targetY * TILE_SIZE;
        return !overlapsOtherMovingEntity(
            targetPixelX,
            targetPixelY,
            index,
            moveDirection
        );
    }

    /**
     * 对应原版 `a.a(pixelX,pixelY,index,collisionDirection)`。
     *
     * 当 index>=0（动态实体查询）时：
     * - 忽略自己；
     * - 只有其它实体 direction != collisionDirection 时才做 48×48 overlap；
     * - 因而规划格移动时，与自己**同方向**的 moving entity 被特别放行；
     * - 像素子步传 collisionDirection=4，因此只检查仍在移动的其它实体。
     */
    private boolean overlapsOtherMovingEntity(
        int candidatePixelX,
        int candidatePixelY,
        int selfIndex,
        int collisionDirection
    ) {
        for (int other = 0; other < movingEntityCount; other++) {
            if (other == selfIndex) continue;
            if (direction[other] == collisionDirection) continue;

            if (boxesOverlap48(
                candidatePixelX,
                candidatePixelY,
                pixelX[other],
                pixelY[other]
            )) {
                return true;
            }
        }
        return false;
    }

    /**
     * Bobby 的 moving-entity collision 使用同一个原版 helper 的 selfIndex=-1 分支，
     * 但语义不同：对每个 moving entity 先按 `pixelsRemaining` 推到本次跨格的**最终目的像素**，
     * 再拿 Bobby 候选目标格的 48×48 box 比较。
     *
     * 所以移动中的 Cloud/Leaf 对 Bobby 的阻挡更接近“预留终点格”，不是只看当前像素格。
     */
    boolean blocksBobbyTargetPixel(int bobbyTargetPixelX, int bobbyTargetPixelY) {
        for (int index = 0; index < movingEntityCount; index++) {
            int predictedX = pixelX[index];
            int predictedY = pixelY[index];
            int remaining = pixelsRemaining[index] & 0xFF;

            switch (direction[index]) {
                case LEFT:
                    predictedX -= remaining;
                    break;
                case RIGHT:
                    predictedX += remaining;
                    break;
                case UP:
                    predictedY -= remaining;
                    break;
                case DOWN:
                    predictedY += remaining;
                    break;
                default:
                    break;
            }

            if (boxesOverlap48(
                bobbyTargetPixelX,
                bobbyTargetPixelY,
                predictedX,
                predictedY
            )) {
                return true;
            }
        }
        return false;
    }

    /**
     * Bobby 进入停止 moving entity 的特殊 mount 入口：必须 direction==4 且像素恰好 tile 对齐。
     * 命中后直接保存 mounted index + justMounted=true，player collision 返回可进入。
     */
    boolean mountStoppedEntityAt(int tileX, int tileY) {
        for (int index = 0; index < movingEntityCount; index++) {
            if (direction[index] == STOPPED
                    && pixelX[index] == tileX * TILE_SIZE
                    && pixelY[index] == tileY * TILE_SIZE) {
                justMountedMovingEntity = true;
                mountedEntityIndex = index;
                return true;
            }
        }
        return false;
    }

    private boolean isMatchingCloudParking(int rawType, int rawObject) {
        return (rawType == CLOUD_RED && rawObject == CLOUD_RED_PARKING)
            || (rawType == CLOUD_PURPLE && rawObject == CLOUD_PURPLE_PARKING)
            || (rawType == CLOUD_GREEN && rawObject == CLOUD_GREEN_PARKING);
    }

    private boolean leafCanEnter(int targetTerrain, int moveDirection) {
        switch (targetTerrain) {
            case 0x55:
            case 0x56:
                return true;
            case TIDE_UP:
                return moveDirection != DOWN;
            case TIDE_DOWN:
                return moveDirection != UP;
            case TIDE_LEFT:
                return moveDirection != RIGHT;
            case TIDE_RIGHT:
                return moveDirection != LEFT;
            case FALL_START:
            case FALL_MIDDLE:
            case FALL_END:
                return moveDirection != UP;
            default:
                return false;
        }
    }

    private boolean cloudCanEnter(int x, int y, int moveDirection, int targetTerrain) {
        if (targetTerrain < 0x47 || targetTerrain > 0x4C) {
            return false;
        }
        return cloudPassageAllowsWindDirection(x, y, moveDirection);
    }

    private boolean cloudPassageAllowsWindDirection(int x, int y, int moveDirection) {
        // 具体逆风区规则见 CloudPassage.java；这里不重复维护第二份坐标逻辑。
        return true;
    }

    private boolean cameraTracks(int index) {
        return false;
    }

    private void followCamera(int index) {
        cloudWind.followTrackedCloudStep(index, pixelX[index], pixelY[index]);
    }

    private boolean boxesOverlap48(int x1, int y1, int x2, int y2) {
        return !(y1 + TILE_SIZE - 1 < y2
            || y1 > y2 + TILE_SIZE - 1
            || x1 + TILE_SIZE - 1 < x2
            || x1 > x2 + TILE_SIZE - 1);
    }

    private int dx(int dir) {
        if (dir == LEFT) return -1;
        if (dir == RIGHT) return 1;
        return 0;
    }

    private int dy(int dir) {
        if (dir == UP) return -1;
        if (dir == DOWN) return 1;
        return 0;
    }
}
