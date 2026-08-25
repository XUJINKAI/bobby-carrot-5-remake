import type { TinySynthAudioBackend } from "./TinySynthAudio.js";
import { parseEditorLevel, serializeEditorLevel } from "@bobby/editor";
import {
  bindNavigation,
  escapeHtml,
  gameAssets,
  siteUrl,
  type Navigate,
  type PageController,
} from "./common.js";
import {
  completedExploreLevels,
  lastExploreLevelId,
} from "./explore-progress.js";
import {
  hasActiveLevelFilters,
  mountLevelFilters,
  randomFilteredLevel,
} from "./level-filters.js";
import {
  fetchJson,
  type CatalogChapter,
  type CatalogLevel,
  type LevelCatalog,
  type OfficialLevelData,
} from "./catalog.js";
import { createGameSession } from "./game-session.js";
import { renderGameStage } from "./game-stage-shell.js";
import {
  loadScreenControlPreference,
  renderAppShell,
} from "./ui-shell.js";

export interface PageContext {
  app: HTMLDivElement;
  catalog: LevelCatalog;
  audio: TinySynthAudioBackend;
  navigate: Navigate;
}

export function lastLevel(catalog: LevelCatalog): CatalogLevel {
  const stored = lastExploreLevelId();
  if (stored) {
    const found = catalog.levels.find((level) => level.publicId === stored);
    if (found) return found;
  }
  return (
    catalog.levels.find((level) => level.publicId === "1-1") ??
    catalog.levels[0]!
  );
}

function randomLevel(catalog: LevelCatalog): CatalogLevel {
  return (
    catalog.levels[Math.floor(Math.random() * catalog.levels.length)] ??
    catalog.levels[0]!
  );
}

export function displayLevelId(level: CatalogLevel): string {
  return level.publicId.toUpperCase();
}

export function displayLevelShort(level: CatalogLevel): string {
  return level.bonusOrdinal
    ? `BONUS ${level.bonusOrdinal}`
    : String(level.sourceLevelIndex);
}

export function chapterStars(stars: number): string {
  return `${"★".repeat(stars)}${"☆".repeat(Math.max(0, 3 - stars))}`;
}

export async function renderHome(
  context: PageContext,
): Promise<PageController> {
  const { app, catalog, audio, navigate } = context;
  const last = lastLevel(catalog);
  audio.playMusic("title");

  app.innerHTML = renderAppShell({
    mode: "home",
    showBottomBar: false,
    showScreenControlToggle: false,
    content: `
    <div class="home-page">
      <section class="home-hero" aria-label="开始游戏">
        <article class="home-demo-panel">
          <header>
            <div><span class="eyebrow">WELCOME DEMO</span><h1>先走两步</h1></div>
            <button type="button" class="ghost-btn" data-demo-restart>重新开始</button>
          </header>
          <div class="home-demo-stage">
            ${renderGameStage({ canvasId: "home-demo-canvas" })}
          </div>
          <p data-demo-status>方向键 / WASD 移动，体验 Engine 的地图规则。</p>
        </article>
        <nav class="home-mode-panel" aria-label="选择模式">
          <header><span class="eyebrow">PLAY YOUR WAY</span><h2>选择模式</h2></header>
          <a class="home-mode-card primary" href="adventure" data-nav><strong>冒险模式</strong><span>按章节推进原版 Campaign</span><b>→</b></a>
          <a class="home-mode-card" href="levels" data-nav><strong>自由探索模式</strong><span>全部官方关卡开放浏览</span><b>→</b></a>
          <a class="home-mode-card" href="edit" data-nav><strong>编辑器模式</strong><span>创建地图并随时 Play Test</span><b>→</b></a>
          <button class="home-mode-card" type="button" data-import-map><strong>导入自定义地图</strong><span>打开语义 JSON Draft</span><b>＋</b></button>
          <input data-import-map-file type="file" accept="application/json,.json" hidden>
          <p class="home-import-feedback" data-import-feedback aria-live="polite"></p>
        </nav>
      </section>
      <section class="home-about" aria-labelledby="home-about-title">
        <header><span class="eyebrow">ABOUT THE PROJECT</span><h2 id="home-about-title">从原作到现代 Web 游戏</h2></header>
        <div class="home-about-grid">
          <article><h3>原作重制</h3><p>保留 Bobby Carrot 5 的地图、机关、美术与 MIDI，并以现代浏览器运行。</p></article>
          <article><h3>可验证研究</h3><p>语义地图与原版 DAT 维持可验证的格式互操作链路，让机制结论能够回到原作验证。</p></article>
          <article><h3>地图编辑器</h3><p>使用语义 JSON 创建和交换自定义地图，并通过同一套 Engine 直接 Play Test。</p></article>
        </div>
        <p class="home-about-note">项目代码与原创文档遵循仓库许可证；原版资产的权利边界以 THIRD_PARTY_ASSETS.md 为准。</p>
        <div class="home-quick-row">
          <span>最近浏览：${displayLevelId(last)}</span>
          <button id="home-random" class="ghost-btn">随机一关</button>
        </div>
      </section>
    </div>
  `,
  });

  bindNavigation(app, navigate);
  app
    .querySelector<HTMLButtonElement>("#home-random")
    ?.addEventListener("click", () => {
      navigate(`/play/${randomLevel(catalog).publicId}`);
    });

  bindHomeImport(app, navigate);
  const demoMeta =
    catalog.levels.find((level) => level.publicId === "1-1") ?? last;
  const demoLevel = await fetchJson<OfficialLevelData>(
    siteUrl(`assets/${demoMeta.path}`),
  );
  const canvas = app.querySelector<HTMLCanvasElement>("#home-demo-canvas");
  if (!canvas) throw new Error("Home Demo canvas 挂载失败");
  const session = await createGameSession({
    root: app,
    canvas,
    level: demoLevel,
    gameOptions: {
      audio,
      profile: { superKey: true },
      assets: gameAssets(),
    },
    runtime: {
      hud: {
        hudAtlasUrl: siteUrl("assets/art/hd/hud.png"),
        goldenCarrotUrl: siteUrl("assets/art/hd/icon.png"),
      },
      input: {
        undo: false,
        debug: false,
        screenJoystick: { enabled: loadScreenControlPreference() },
      },
    },
  });
  const status = app.querySelector<HTMLElement>("[data-demo-status]");
  const result = app.querySelector<HTMLElement>("[data-result-overlay]");
  const resultCard = app.querySelector<HTMLElement>("[data-result-card]");
  const updateDemo = (): void => {
    if (!session.game.hasLevel || !status) return;
    const world = session.game.world;
    status.textContent = world.completed
      ? "Demo 完成，可以进入冒险模式。"
      : world.dead
        ? "Bobby 遇到了危险，可以重新开始。"
        : `方向键 / WASD 移动 · ${world.state.moves} 步 · 剩余目标 ${world.objectiveRemaining}`;
    if (!result || !resultCard) return;
    result.hidden = !world.completed && !world.dead;
    if (world.completed) {
      resultCard.innerHTML = `<h2>Demo 完成</h2><p>Engine 已完成这张语义地图。</p><div class="result-actions"><button class="primary-btn" data-demo-adventure>开始冒险</button><button class="ghost-btn" data-demo-restart>重玩</button></div>`;
    } else if (world.dead) {
      resultCard.innerHTML = `<h2>再试一次</h2><p>${escapeHtml(world.state.deathReason ?? "Bobby 没能继续前进。")}</p><div class="result-actions"><button class="primary-btn" data-demo-restart>重新开始</button></div>`;
    }
  };
  session.game.on("change", updateDemo);
  updateDemo();
  const onHomeClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    if (target.closest("[data-demo-restart]")) session.game.restart();
    if (target.closest("[data-demo-adventure]")) navigate("/adventure");
  };
  const onDialogOpen = (): void => session.input.setEnabled(false);
  const onDialogClose = (): void => session.input.setEnabled(true);
  const onScreenControlChange = (event: Event): void => {
    const enabled = Boolean(
      (event as CustomEvent<{ enabled: boolean }>).detail.enabled,
    );
    session.input.setScreenJoystickEnabled(enabled);
  };
  app.addEventListener("click", onHomeClick);
  app.addEventListener("shell-dialog-open", onDialogOpen);
  app.addEventListener("shell-dialog-close", onDialogClose);
  app.addEventListener("screen-control-change", onScreenControlChange);
  return {
    destroy(): void {
      app.removeEventListener("click", onHomeClick);
      app.removeEventListener("shell-dialog-open", onDialogOpen);
      app.removeEventListener("shell-dialog-close", onDialogClose);
      app.removeEventListener("screen-control-change", onScreenControlChange);
      session.destroy();
    },
  };
}

function bindHomeImport(app: HTMLDivElement, navigate: Navigate): void {
  const file = app.querySelector<HTMLInputElement>("[data-import-map-file]");
  const feedback = app.querySelector<HTMLElement>("[data-import-feedback]");
  app
    .querySelector<HTMLButtonElement>("[data-import-map]")
    ?.addEventListener("click", () => file?.click());
  file?.addEventListener("change", () => {
    const selected = file.files?.[0];
    if (!selected) return;
    void selected
      .text()
      .then((text) => {
        const level = parseEditorLevel(text);
        sessionStorage.setItem(
          "bc5r:pending-editor-level",
          serializeEditorLevel(level),
        );
        navigate("/edit");
      })
      .catch((error) => {
        if (feedback)
          feedback.textContent =
            error instanceof Error ? error.message : String(error);
      })
      .finally(() => {
        file.value = "";
      });
  });
}

export async function renderLevels(context: PageContext): Promise<void> {
  const { app, catalog, audio, navigate } = context;
  const last = lastLevel(catalog);
  const completed = completedExploreLevels();
  audio.playMusic("title");

  app.innerHTML = renderAppShell({
    mode: "explore",
    contextInfo: "全部关卡开放 · ✓ 表示曾通关",
    showScreenControlToggle: false,
    content: `
    <section class="level-browser-head">
      <div class="section-title">
        <div>
          <div class="eyebrow">EXPLORE MODE</div>
          <h1>自由选关</h1>
          <p>原版 1～40 章全部开放。这里用于找关、筛选、研究机关，不受 Adventure 存档限制。</p>
        </div>
        <div class="level-browser-summary muted">${catalog.chapters.length} 章 · ${catalog.levels.length} 关</div>
      </div>
      <div class="level-browser-actions">
        <a class="primary-btn" href="play/${last.publicId}" data-nav>继续浏览 · ${displayLevelId(last)}</a>
        <button id="random-level" class="ghost-btn">随机一个关卡</button>
        <a class="ghost-btn" href="adventure/chapters" data-nav>进入冒险模式</a>
      </div>
    </section>
    <div class="chapter-list">
      ${catalog.chapters.map((chapter) => renderExploreChapter(catalog, chapter, completed)).join("")}
    </div>
    <div class="difficulty-legend muted">
      <span><i class="difficulty-dot easy"></i>简单</span>
      <span><i class="difficulty-dot medium"></i>中等</span>
      <span><i class="difficulty-dot hard"></i>困难</span>
      <span>章节标题旁的 ★ 是原版章节选择界面的 1～3 星难度；关卡 A～F 难度仍用于筛选。</span>
    </div>
  `,
  });

  bindNavigation(app, navigate);
  await mountLevelFilters(catalog);
  app
    .querySelector<HTMLButtonElement>("#random-level")
    ?.addEventListener("click", () => {
      const chosen = hasActiveLevelFilters()
        ? randomFilteredLevel()
        : randomLevel(catalog);
      if (chosen) navigate(`/play/${chosen.publicId}`);
    });
}

function renderExploreChapter(
  catalog: LevelCatalog,
  chapter: CatalogChapter,
  completed: Set<string>,
): string {
  const levels = chapter.levelPublicIds
    .map((publicId) =>
      catalog.levels.find((level) => level.publicId === publicId),
    )
    .filter((level): level is CatalogLevel => Boolean(level));

  const levelLinks = levels
    .map((level) => {
      const done = completed.has(level.canonicalId);
      return `
        <a
          class="chapter-level ${done ? "completed" : ""} ${level.contentKind === "bonus" ? "bonus-level" : ""}"
          href="play/${level.publicId}"
          data-nav
          title="${escapeHtml(level.publicId)} · ${escapeHtml(level.difficulty.label)}"
        >
          <span class="chapter-level-no">${escapeHtml(displayLevelShort(level))}</span>
          <span class="difficulty-badge ${level.difficulty.level} ${level.difficulty.source}">
            ${escapeHtml(level.difficulty.label)}
          </span>
          ${done ? '<span class="done-mark" title="自由浏览中已通关">✓</span>' : ""}
        </a>
      `;
    })
    .join("");

  return `
    <section class="chapter-card">
      <header class="chapter-head">
        <div>
          <div class="chapter-number">
            CHAPTER ${chapter.number}
            <span class="chapter-stars" title="原版章节难度 ${chapter.difficultyStars} 星">
              ${chapterStars(chapter.difficultyStars)}
            </span>
          </div>
          <h3>${escapeHtml(chapter.title)}</h3>
        </div>
        <span class="muted chapter-count">${levels.length} 关</span>
      </header>
      <div class="chapter-levels">${levelLinks}</div>
    </section>
  `;
}
