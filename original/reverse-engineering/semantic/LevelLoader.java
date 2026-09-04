// 研究性语义重建：来源为 UP9 a.class / a.e(int,int) 的 javap 字节码。
// CFR 无法结构化该方法，因此本文件以 bytecode/up09/methods/load-level-e-int-int.javap.txt 为直接基准。

import java.io.DataInputStream;
import java.io.InputStream;

public final class LevelLoader {
    private static final int OBJECT_EMPTY = 0xFF;

    private static final int OBJECT_DRAGON_HEAD = 0xD7;
    private static final int OBJECT_DRAGON_BODY = 0xD8;
    private static final int OBJECT_DRAGON_TAIL = 0xD9;
    private static final int OBJECT_SANDMAN_HEAD = 0xDA;
    private static final int OBJECT_DREAM_MACHINE_HEAD = 0xDB;
    private static final int OBJECT_CLOUD_RED = 0xE0;
    private static final int OBJECT_CLOUD_PURPLE = 0xE1;
    private static final int OBJECT_CLOUD_GREEN = 0xE2;
    private static final int OBJECT_BEAVER_HEAD = 0xE7;
    private static final int OBJECT_SANDMAN_BODY = 0xEA;
    private static final int OBJECT_DREAM_MACHINE_BODY = 0xEB;
    private static final int OBJECT_LEAF = 0xEC;
    private static final int OBJECT_BEAVER_BODY = 0xF7;
    private static final int OBJECT_BONUS_COIN = 0xF8;

    private int mapWidthTiles;
    private int mapHeightTiles;
    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    /** 对应原版 `cB`：DAT 直接给出的动态实体数量。 */
    private int movingEntityCount;
    private byte[] movingEntityType;
    private byte[] movingEntityDirection;
    private byte[] movingEntityPixelsRemaining;
    private short[] movingEntityPixelX;
    private short[] movingEntityPixelY;
    private boolean[] movingEntityFastMotion;

    private int bonusCoinCount;

    /**
     * 对应原版 `a.e(int,int)`。
     *
     * @param archiveNumber 原版资源文件号，例如 9 -> `09.dat`
     * @param recordIndex   length-prefixed DAT 中需要跳到的 record 序号
     */
    void loadLevel(int archiveNumber, int recordIndex) throws Exception {
        clearRuntimeLevelState();
        bonusCoinCount = 0;

        String resource = (archiveNumber < 10 ? "0" : "") + archiveNumber + ".dat";
        InputStream raw = getClass().getResourceAsStream(resource);
        DataInputStream in = new DataInputStream(raw);

        for (int record = 0; record < recordIndex; record++) {
            int length = in.readShort();
            int skipped = in.skipBytes(length);
            while (skipped < length) {
                skipped += in.skipBytes(length - skipped);
            }
        }

        // 当前 record 自己也以 signed short 长度开头；原版只消费，不依赖该值解析内部结构。
        in.readShort();

        mapWidthTiles = in.readByte();
        mapHeightTiles = in.readByte();

        terrainGrid = new byte[mapHeightTiles][mapWidthTiles];
        for (int y = 0; y < mapHeightTiles; y++) {
            in.readFully(terrainGrid[y]);
        }

        objectGrid = new byte[mapHeightTiles][mapWidthTiles];
        for (int y = 0; y < mapHeightTiles; y++) {
            for (int x = 0; x < mapWidthTiles; x++) {
                objectGrid[y][x] = (byte)OBJECT_EMPTY;
            }
        }

        movingEntityCount = in.readByte();
        movingEntityType = new byte[movingEntityCount];
        movingEntityDirection = new byte[movingEntityCount];
        movingEntityPixelsRemaining = new byte[movingEntityCount];
        movingEntityPixelX = new short[movingEntityCount];
        movingEntityPixelY = new short[movingEntityCount];
        movingEntityFastMotion = new boolean[movingEntityCount];

        int objectEntryCount = in.readShort();
        int movingEntityIndex = 0;

        for (int entry = 0; entry < objectEntryCount; entry++) {
            int rawType = in.readByte();
            int x = in.readByte();
            int y = in.readByte();
            boolean consumedByRuntimeEntity = false;

            switch (rawType & 0xFF) {
                case OBJECT_CLOUD_RED:
                case OBJECT_CLOUD_PURPLE:
                case OBJECT_CLOUD_GREEN:
                case OBJECT_LEAF:
                    addMovingEntity(movingEntityIndex++, rawType, x, y);
                    consumedByRuntimeEntity = true;
                    break;

                // Dragon 是横向 3 格：DAT 只保存 Head anchor。
                case OBJECT_DRAGON_HEAD:
                    objectGrid[y][x + 1] = (byte)OBJECT_DRAGON_BODY;
                    objectGrid[y][x + 2] = (byte)OBJECT_DRAGON_TAIL;
                    break;

                // Sandman / Dream Machine / Beaver 都是纵向 2 格：DAT 只保存 Head anchor，
                // Loader 在下一行自动 materialize Body。碰撞交互实际绑定在 Body byte 上。
                case OBJECT_SANDMAN_HEAD:
                    objectGrid[y + 1][x] = (byte)OBJECT_SANDMAN_BODY;
                    break;
                case OBJECT_DREAM_MACHINE_HEAD:
                    objectGrid[y + 1][x] = (byte)OBJECT_DREAM_MACHINE_BODY;
                    break;
                case OBJECT_BEAVER_HEAD:
                    objectGrid[y + 1][x] = (byte)OBJECT_BEAVER_BODY;
                    break;

                case OBJECT_BONUS_COIN:
                    bonusCoinCount++;
                    break;
                default:
                    break;
            }

            if (!consumedByRuntimeEntity) {
                objectGrid[y][x] = (byte)rawType;
            }
        }

        in.close();
    }

    private void addMovingEntity(int index, int rawType, int x, int y) {
        movingEntityPixelX[index] = (short)(x * 48);
        movingEntityPixelY[index] = (short)(y * 48);
        movingEntityDirection[index] = 4; // 原版停止/未移动状态。
        movingEntityPixelsRemaining[index] = 0;
        movingEntityType[index] = (byte)rawType;
    }

    private void clearRuntimeLevelState() {
        // 对应原版 `a.ac()`；实际还会释放动态任务数组等引用。
        terrainGrid = null;
        objectGrid = null;
        movingEntityType = null;
        movingEntityDirection = null;
        movingEntityPixelsRemaining = null;
        movingEntityPixelX = null;
        movingEntityPixelY = null;
        movingEntityFastMotion = null;
    }
}
