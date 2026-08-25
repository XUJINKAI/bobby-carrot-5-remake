import { TinySynthAudioBackend } from "./TinySynthAudio.js";
import { fetchJson, type LevelCatalog } from "./catalog.js";
import { NOOP_CONTROLLER, siteUrl, type PageController } from "./common.js";
import {
  renderAdventureChapter,
  renderAdventureChapters,
  renderAdventureHome,
  findAdventureLevel,
} from "./adventure-pages.js";
import { renderEditorPage } from "./editor-page.js";
import { renderOfficialGame } from "./official-game.js";
import { renderHome, renderLevels } from "./pages.js";
import {
  exportAdventureSave,
  importAdventureSave,
  loadAdventureSave,
  resetAdventureSave,
} from "./adventure-storage.js";
import {
  closeDialog,
  loadScreenControlPreference,
  openDialog,
  renderHelpDialog,
  renderSettingsDialog,
  storeScreenControlPreference,
  type AppMode,
} from "./ui-shell.js";

export class BobbyApp {
  private readonly app: HTMLDivElement;
  private readonly audio = new TinySynthAudioBackend();
  private catalog!: LevelCatalog;
  private controller: PageController = NOOP_CONTROLLER;

  constructor(app: HTMLDivElement) {
    this.app = app;
  }

  async start(): Promise<void> {
    this.catalog = await fetchJson<LevelCatalog>(
      siteUrl("assets/catalog.json"),
    );
    document.addEventListener("pointerdown", this.resumeAudio, {
      passive: true,
    });
    document.addEventListener("keydown", this.resumeAudio);
    window.addEventListener("popstate", this.onPopState);
    this.app.addEventListener("click", this.onShellClick);
    this.app.addEventListener("input", this.onShellSetting);
    this.app.addEventListener("change", this.onShellSetting);
    document.addEventListener("pointerdown", this.onDocumentPointerDown);
    await this.renderRoute();
  }

  destroy(): void {
    this.controller.destroy();
    document.removeEventListener("pointerdown", this.resumeAudio);
    document.removeEventListener("keydown", this.resumeAudio);
    window.removeEventListener("popstate", this.onPopState);
    this.app.removeEventListener("click", this.onShellClick);
    this.app.removeEventListener("input", this.onShellSetting);
    this.app.removeEventListener("change", this.onShellSetting);
    document.removeEventListener("pointerdown", this.onDocumentPointerDown);
  }

  private readonly resumeAudio = (): void => this.audio.resume();
  private readonly onPopState = (): void => {
    void this.renderRoute();
  };
  private readonly navigate = (path: string): void => {
    const target = new URL(path.replace(/^\/+/, ""), document.baseURI);
    history.pushState(
      null,
      "",
      `${target.pathname}${target.search}${target.hash}`,
    );
    void this.renderRoute();
  };
  private readonly onDocumentPointerDown = (event: PointerEvent): void => {
    const target = event.target as Node | null;
    this.app
      .querySelectorAll<HTMLDetailsElement>(".mode-selector[open]")
      .forEach((selector) => {
        if (!target || !selector.contains(target)) selector.open = false;
      });
  };
  private readonly onShellClick = (event: Event): void => {
    const target = event.target as HTMLElement;
    const dialogLayer = target.closest<HTMLElement>("[data-dialog-layer]");
    if (dialogLayer && target === dialogLayer) {
      closeDialog(this.app);
      return;
    }
    const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
    if (action === "music") {
      this.audio.setEnabled(!this.audio.isEnabled());
      target.closest<HTMLButtonElement>("button")!.textContent =
        this.audio.isEnabled() ? "♫" : "♪̸";
    } else if (action === "settings") {
      this.openSettings();
    } else if (action === "help") {
      const value = this.app.querySelector<HTMLElement>(".app-shell")?.dataset
        .mode;
      openDialog(this.app, renderHelpDialog(toAppMode(value)));
    } else if (action === "close-dialog") {
      closeDialog(this.app);
    }
    const settingsAction = target.closest<HTMLElement>(
      "[data-settings-action]",
    )?.dataset.settingsAction;
    if (settingsAction === "export") {
      exportAdventureSave();
    } else if (settingsAction === "import") {
      this.app.querySelector<HTMLInputElement>("[data-settings-file]")?.click();
    } else if (settingsAction === "reset") {
      const reset = target.closest<HTMLButtonElement>(
        "[data-settings-action='reset']",
      );
      if (reset?.dataset.confirming === "true") {
        resetAdventureSave();
        this.openSettings("Adventure 存档已清空。");
      } else if (reset) {
        reset.dataset.confirming = "true";
        reset.textContent = "再次点击确认清空";
        this.setSettingsFeedback("自由探索记录会继续保留。");
      }
    }
  };
  private readonly onShellSetting = (event: Event): void => {
    const target = event.target as HTMLElement;
    const file = target.closest<HTMLInputElement>("[data-settings-file]");
    if (file && event.type === "change") {
      const selected = file.files?.[0];
      if (!selected) return;
      void importAdventureSave(selected)
        .then(() => this.openSettings("Adventure 存档已导入。"))
        .catch((error) =>
          this.setSettingsFeedback(
            error instanceof Error ? error.message : String(error),
          ),
        );
      return;
    }
    const input = target.closest<HTMLInputElement | HTMLSelectElement>(
      "[data-setting]",
    );
    if (!input) return;
    if (
      input.dataset.setting === "music-enabled" &&
      input instanceof HTMLInputElement
    ) {
      this.audio.setEnabled(input.checked);
      this.updateMusicButton();
    } else if (input.dataset.setting === "music-volume") {
      this.audio.setMusicVolume(Number(input.value) / 100);
    } else if (input.dataset.setting === "sound-volume") {
      this.audio.setSoundVolume(Number(input.value) / 100);
    } else if (input.dataset.setting === "midi-tone") {
      this.audio.setTone(input.value === "chip" ? "chip" : "fm");
    } else if (input.dataset.setting === "midi-reverb") {
      this.audio.setReverbLevel(Number(input.value) / 100);
    } else if (
      input.dataset.setting === "screen-control" &&
      input instanceof HTMLInputElement
    ) {
      storeScreenControlPreference(this.app, input.checked);
    }
  };

  private openSettings(feedback = ""): void {
    const save = loadAdventureSave();
    openDialog(
      this.app,
      renderSettingsDialog({
        musicEnabled: this.audio.isEnabled(),
        musicVolume: Math.round(this.audio.getMusicVolume() * 100),
        soundVolume: Math.round(this.audio.getSoundVolume() * 100),
        screenControlEnabled: loadScreenControlPreference(),
        tone: this.audio.getTone(),
        reverb: Math.round(this.audio.getReverbLevel() * 100),
        bonusCoins: save.economy.bonusCoins,
        goldenCarrots: save.economy.goldenCarrots,
        completedLevels: save.campaign.completedLevels.length,
      }),
    );
    this.setSettingsFeedback(feedback);
  }

  private setSettingsFeedback(message: string): void {
    const feedback = this.app.querySelector<HTMLElement>(
      "[data-settings-feedback]",
    );
    if (feedback) feedback.textContent = message;
  }

  private updateMusicButton(): void {
    const music = this.app.querySelector<HTMLButtonElement>(
      "[data-action='music']",
    );
    if (music) music.textContent = this.audio.isEnabled() ? "♫" : "♪̸";
  }

  private async renderRoute(): Promise<void> {
    this.controller.destroy();
    this.controller = NOOP_CONTROLLER;
    const path = localRoutePath();
    const context = {
      app: this.app,
      catalog: this.catalog,
      audio: this.audio,
      navigate: this.navigate,
    };
    if (path === "/") {
      this.controller = await renderHome(context);
      return;
    }
    if (path === "/levels") {
      await renderLevels(context);
      return;
    }
    if (path === "/settings") {
      this.controller = await renderHome(context);
      this.openSettings();
      return;
    }
    if (path === "/adventure") {
      renderAdventureHome(context);
      return;
    }
    if (path === "/adventure/chapters") {
      renderAdventureChapters(context);
      return;
    }
    if (path.startsWith("/adventure/chapter/")) {
      const chapter = Number(path.split("/").pop());
      if (!Number.isInteger(chapter)) {
        this.navigate("/adventure/chapters");
        return;
      }
      renderAdventureChapter(context, chapter);
      return;
    }
    if (path.startsWith("/adventure/play/")) {
      const id = decodeURIComponent(path.split("/").pop() ?? "").toLowerCase();
      const level = findAdventureLevel(this.catalog, id);
      if (!level) {
        this.navigate("/adventure/chapters");
        return;
      }
      this.controller = await renderOfficialGame({
        ...context,
        level,
        mode: "adventure",
      });
      return;
    }
    if (path === "/edit") {
      this.controller = await renderEditorPage(context);
      return;
    }
    if (path.startsWith("/edit/")) {
      const publicId = path.split("/").pop();
      this.controller = publicId
        ? await renderEditorPage({ ...context, publicId })
        : await renderEditorPage(context);
      return;
    }
    if (path.startsWith("/play/")) {
      const publicId = decodeURIComponent(
        path.split("/").pop() ?? "",
      ).toLowerCase();
      const meta = this.catalog.levels.find(
        (level) => level.publicId === publicId,
      );
      if (!meta) {
        this.navigate("/levels");
        return;
      }
      this.controller = await renderOfficialGame({
        ...context,
        level: meta,
        mode: "explore",
      });
      return;
    }
    this.navigate("/");
  }
}

function toAppMode(value: string | undefined): AppMode {
  if (
    value === "adventure" ||
    value === "explore" ||
    value === "editor" ||
    value === "custom"
  ) {
    return value;
  }
  return "home";
}

function localRoutePath(): string {
  const basePath = new URL(document.baseURI).pathname.replace(/\/+$/, "");
  const localPath =
    basePath && basePath !== "/" && location.pathname.startsWith(basePath)
      ? location.pathname.slice(basePath.length)
      : location.pathname;
  return localPath.replace(/\/+$/, "") || "/";
}
