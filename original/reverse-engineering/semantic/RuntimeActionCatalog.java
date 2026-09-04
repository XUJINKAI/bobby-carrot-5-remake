// 研究性语义重建：来源为 UP9 a.class / H()、M()、P()、Q()、R()、S() 与关联 semantic。
// 本文件汇总长期动作的时长、并发和输入边界，不作为产品 RuntimeAction 实现。

public final class RuntimeActionCatalog {
    static final int GAMEPLAY_STEP_MILLIS_APPROX = 31;

    static final Action BOBBY_MOVE = new Action(
        "BobbyMove", 16, false, false,
        "普通 3px/step；Speed terrain 或 Speed Shoes 为 8 step、6px/step"
    );

    static final Action SHOVEL = new Action(
        "Shovel", 32, true, false,
        "倒计时结束把目标 Snow 改为 0x7C，再按保存方向自动重试移动"
    );

    static final Action PLANK_DECAY = new Action(
        "PlankDecay", 12, false, false,
        "D5 6 step 后 D6，再 6 step 后 empty；全局只追踪一块旧 Plank"
    );

    static final Action DRAGON_WIND_UP = new Action(
        "DragonWindUp", 18, false, false,
        "D7、E8、E9 各 6 step；E8/E9 期间 Head 格按原版可进入"
    );

    static final Action FIREBALL = new Action(
        "DragonFireball", -1, true, true,
        "6px/step，长度由路径决定；存活时每拍刷新 aT=16 与 camera target"
    );

    static final Action ICE_MELTING = new Action(
        "IceMelting", 18, false, false,
        "E4、E5、E6 各 6 step；最多 5 个并行任务，溢出立即删除最老目标"
    );

    static final Action BEAN_GROWTH_SEGMENT = new Action(
        "BeanGrowthSegment", 16, false, false,
        "任务可并行；每段倒计时后再验证上方 terrain/object，失败即结束该任务"
    );

    static final Action MOVING_ENTITY_TILE = new Action(
        "MovingEntityTile", 16, false, false,
        "Cloud/Leaf 通常 3px/step；Waterfall fast motion 为 8 step、6px/step"
    );

    static final Action WIND_FOCUS = new Action(
        "WindCameraFocus", 64, true, true,
        "先聚焦 Windmill；首朵真正改向的 Cloud 可接管并持续刷新 target"
    );

    static final Action KITE_TRANSITION_HALF = new Action(
        "KiteTakeoffOrLanding", 4, false, false,
        "midpoint 后每拍改变 6px 高度，共 24px；在当前格 visual arrival 时切 airborne"
    );

    static final Action DEATH_ANIMATION = new Action(
        "DeathAnimation", 7, true, false,
        "K() 统一停表并切 motionState=5；O() 单向推进到 frame 7 后等待确认重载"
    );

    /**
     * ordinaryInputBlocked 只描述普通方向输入路径，不等于 worldBlocked。
     * 原版没有全局 action queue；这些字段由 H()/P()/Q()/R()/S() 在同一拍分别推进。
     */
    static final class Action {
        final String name;
        final int nominalGameplaySteps;
        final boolean ordinaryInputBlocked;
        final boolean ownsCameraTarget;
        final String facts;

        Action(
                String name,
                int nominalGameplaySteps,
                boolean ordinaryInputBlocked,
                boolean ownsCameraTarget,
                String facts) {
            this.name = name;
            this.nominalGameplaySteps = nominalGameplaySteps;
            this.ordinaryInputBlocked = ordinaryInputBlocked;
            this.ownsCameraTarget = ownsCameraTarget;
            this.facts = facts;
        }
    }
}
