// 研究性语义重建：来源为 UP9 a.class / a.e(int,int) 的 javap 字节码。
// CFR 无法结构化该方法，因此本文件以 bytecode/up09/methods/load-level-e-int-int.javap.txt 为直接基准。

import java.io.DataInputStream;
import java.io.InputStream;

public final class LevelLoader {
    private static final int OBJECT_EMPTY = 0xFF;

    // 原版将这四类 object 从 grid 中抽出，作为可移动 runtime entity。
    private static final int OBJECT_CLOUD_RED = 0xE0;
    private static final int OBJECT_CLOUD_PURPLE = 0xE1;
    private static final int OBJECT_CLOUD_GREEN = 0xE2;
    private static final int OBJECT_LEAF = 0xEC;

    private int mapWidthTiles;
    private int mapHeightTiles;
    private byte[][] terrainGrid;
    private byte[][] objectGrid;

    private int movingEntityCapacity;
    private byte[] movingEntityType;
    private byte[] movingEntityDirection;
    private byte[] movingEntityPixelStep;
    private short[] movingEntityPixelX;
    private short[] movingEntityPixelY;
    private boolean[] movingEntityFlag;

    private int movingEntityCount;
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
                int remaining = length - skipped;
                skipped += in.skipBytes(remaining);
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

        movingEntityCapacity = in.readByte();
        movingEntityType = new byte[movingEntityCapacity];
        movingEntityDirection = new byte[movingEntityCapacity];
        movingEntityPixelStep = new byte[movingEntityCapacity];
        movingEntityPixelX = new short[movingEntityCapacity];
        movingEntityPixelY = new short[movingEntityCapacity];
        movingEntityFlag = new boolean[movingEntityCapacity];

        int objectEntryCount = in.readShort();
        movingEntityCount = 0;

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
                    addMovingEntity(rawType, x, y);
                    consumedByRuntimeEntity = true;
                    break;

                // 下面四组是原版 compact object 的 multi-cell 展开。
                // 具体 Entity 名称继续从 atlas / DAT adapter / gameplay 引用交叉确认。
                case 0xD7:
                    objectGrid[y][x + 1] = (byte)0xD8;
                    objectGrid[y][x + 2] = (byte)0xD9;
                    break;
                case 0xDA:
                    objectGrid[y + 1][x] = (byte)0xEA;
                    break;
                case 0xDB:
                    objectGrid[y + 1][x] = (byte)0xEB;
                    break;
                case 0xE7:
                    objectGrid[y + 1][x] = (byte)0xF7;
                    break;
                case 0xF8:
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

    private void addMovingEntity(int rawType, int x, int y) {
        movingEntityPixelX[movingEntityCount] = (short)(x * 48);
        movingEntityPixelY[movingEntityCount] = (short)(y * 48);
        movingEntityDirection[movingEntityCount] = 4; // 原版停止/未移动状态。
        movingEntityPixelStep[movingEntityCount] = 0;
        movingEntityType[movingEntityCount] = (byte)rawType;
        movingEntityCount++;
    }

    private void clearRuntimeLevelState() {
        // 对应原版 `a.ac()`；实际还会释放动态任务数组等引用。
        terrainGrid = null;
        objectGrid = null;
        movingEntityType = null;
        movingEntityDirection = null;
        movingEntityPixelStep = null;
        movingEntityPixelX = null;
        movingEntityPixelY = null;
        movingEntityFlag = null;
    }
}
