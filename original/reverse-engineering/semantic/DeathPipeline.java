// 研究性语义重建：来源为 UP9 a.class / a.H()、a.K()、a.O()。
// 本文件用于表达已经确认的原版控制流，不作为可直接编译的产品源码。

public final class DeathPipeline {
    private static final int MOTION_DEAD = 5;
    private static final int LAST_DEATH_FRAME = 7;

    private int playerMovePixelsRemaining;
    private int playerMotionState;
    private int playerAnimationFrame;
    private boolean airborne;
    private boolean climbingBeanstalk;
    private boolean freeCamera;
    private boolean anyKeyHeld;

    /**
     * `ba != -1` 表示 alarm overlay 正在参与显示；Bonus 60 秒超时会先把
     * `ba` 置 0，因此统一死亡流程会播放 alarm.mid，而普通机关死亡播放 death.mid。
     */
    private int alarmFrame = -1;

    private boolean musicEnabled;
    private int musicVolume;
    private boolean campaignSpecialDeathContinuation;

    /** 对应原版 `a.K()`：所有已确认 death cause 汇入同一入口。 */
    void startDeath() {
        pauseLevelTimer();
        playerMovePixelsRemaining = 0;
        playerMotionState = MOTION_DEAD;
        airborne = false;
        climbingBeanstalk = false;
        playerAnimationFrame = 0;

        if (freeCamera) {
            freeCamera = false;
            restoreCameraToPlayer();
        }

        if (musicEnabled) {
            playOneShot(alarmFrame == -1 ? "/death.mid" : "/alarm.mid", musicVolume);
        }

        anyKeyHeld = false;
    }

    /**
     * 对应 `a.O()` 的 death 分支。动画并不循环：每个 presentation update
     * 将 `av` 加一，达到第 7 帧后永久停在第 7 帧，等待玩家输入。
     */
    void updateDeathAnimation() {
        if (playerMotionState != MOTION_DEAD) {
            return;
        }
        if (playerAnimationFrame < LAST_DEATH_FRAME) {
            playerAnimationFrame++;
        }
    }

    /**
     * 对应 `a.H()`：死亡后 Left Softkey / Right Softkey / Fire 任一输入均会处理。
     * 普通关卡直接重新初始化当前关；特殊 campaign 分支由 `dg` 走章节流程。
     */
    boolean handleDeathInput(boolean fire, boolean leftSoftkey, boolean rightSoftkey) {
        if (playerMotionState != MOTION_DEAD || !(fire || leftSoftkey || rightSoftkey)) {
            return false;
        }

        if (!campaignSpecialDeathContinuation) {
            reloadCurrentLevel();
            startScreenTransitionIn();
        } else {
            advanceCampaignSpecialDeathFlow();
        }
        return true;
    }

    /** 当前已经确认的两个直接调用 `a.K()` 的地图内 death cause。 */
    void onActiveTrapEntered() {
        startDeath();
    }

    void onTimedBonusExpired() {
        alarmFrame = 0;
        startDeath();
    }

    private void pauseLevelTimer() {}
    private void restoreCameraToPlayer() {}
    private void playOneShot(String path, int volume) {}
    private void reloadCurrentLevel() {}
    private void startScreenTransitionIn() {}
    private void advanceCampaignSpecialDeathFlow() {}
}
