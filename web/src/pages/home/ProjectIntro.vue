<script setup lang="ts">
import AppIcon from "../../shared/icons/AppIcon.vue";
import { webT } from "../../i18n/webI18n.js";
</script>

<template>
  <section class="home-about" aria-labelledby="home-about-title">
    <header class="home-about-heading">
      <h1 id="home-about-title">{{ webT("home.intro.title") }}</h1>
      <p>{{ webT("home.intro.lead") }}</p>
    </header>

    <section class="intro-group" aria-labelledby="home-classic-title">
      <header class="feature-copy">
        <h2 id="home-classic-title">{{ webT("home.intro.classicTitle") }}</h2>
        <p>{{ webT("home.intro.classicDescription") }}</p>
      </header>
      <div class="game-cards">
        <article class="intro-card">
          <AppIcon class="card-icon" name="star" :size="28" />
          <h3>{{ webT("home.intro.adventureTitle") }}</h3>
          <p>{{ webT("home.intro.adventureDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="map-details" :size="28" />
          <h3>{{ webT("home.intro.exploreTitle") }}</h3>
          <p>{{ webT("home.intro.exploreDescription") }}</p>
        </article>
      </div>
    </section>

    <section class="intro-group" aria-labelledby="home-maps-title">
      <header class="feature-copy">
        <h2 id="home-maps-title">{{ webT("home.intro.mapsTitle") }}</h2>
        <p>{{ webT("home.intro.mapsDescription") }}</p>
      </header>
      <div class="game-cards">
        <article class="intro-card">
          <h3>{{ webT("home.intro.roboTitle") }}</h3>
          <p>{{ webT("home.intro.roboDescription") }}</p>
        </article>
        <article class="intro-card">
          <h3>{{ webT("home.intro.sokobanTitle") }}</h3>
          <p>{{ webT("home.intro.sokobanDescription") }}</p>
        </article>
      </div>
    </section>

    <section class="intro-group" aria-labelledby="home-editor-title">
      <header class="feature-copy">
        <h2 id="home-editor-title">{{ webT("home.intro.editorTitle") }}</h2>
        <p>{{ webT("home.intro.editorDescription") }}</p>
      </header>
      <div class="feature-cards">
        <article class="intro-card">
          <AppIcon class="card-icon" name="palette" :size="28" />
          <h3>{{ webT("home.intro.layoutTitle") }}</h3>
          <p>{{ webT("home.intro.layoutDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="settings" :size="28" />
          <h3>{{ webT("home.intro.mechanicsTitle") }}</h3>
          <p>{{ webT("home.intro.mechanicsDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="play" :size="28" />
          <h3>{{ webT("home.intro.playtestTitle") }}</h3>
          <p>{{ webT("home.intro.playtestDescription") }}</p>
        </article>
      </div>
    </section>

    <section class="intro-group" aria-labelledby="home-share-title">
      <header class="feature-copy">
        <h2 id="home-share-title">{{ webT("home.intro.shareTitle") }}</h2>
        <p>{{ webT("home.intro.shareDescription") }}</p>
      </header>
      <div class="feature-cards">
        <article class="intro-card">
          <AppIcon class="card-icon" name="share" :size="28" />
          <h3>{{ webT("home.intro.linkTitle") }}</h3>
          <p>{{ webT("home.intro.linkDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="copy" :size="28" />
          <h3>{{ webT("home.intro.fileTitle") }}</h3>
          <p>{{ webT("home.intro.fileDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="external" :size="28" />
          <h3>{{ webT("home.intro.embedTitle") }}</h3>
          <p>{{ webT("home.intro.embedDescription") }}</p>
        </article>
      </div>
    </section>

    <section class="intro-group" aria-labelledby="home-tools-title">
      <header class="feature-copy">
        <h2 id="home-tools-title">{{ webT("home.intro.toolsTitle") }}</h2>
        <p>{{ webT("home.intro.toolsDescription") }}</p>
      </header>
      <div class="feature-cards">
        <article class="intro-card">
          <AppIcon class="card-icon" name="play" :size="28" />
          <h3>{{ webT("home.intro.replayTitle") }}</h3>
          <p>{{ webT("home.intro.replayDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="undo" :size="28" />
          <h3>{{ webT("home.intro.undoTitle") }}</h3>
          <p>{{ webT("home.intro.undoDescription") }}</p>
        </article>
        <article class="intro-card">
          <AppIcon class="card-icon" name="joystick" :size="28" />
          <h3>{{ webT("home.intro.controlsTitle") }}</h3>
          <p>{{ webT("home.intro.controlsDescription") }}</p>
        </article>
      </div>
    </section>

    <footer class="intro-footer">
      <div class="engine-note">
        <h2>{{ webT("home.intro.engineTitle") }}</h2>
        <p>{{ webT("home.intro.engineDescription") }}</p>
      </div>
      <p class="home-about-note">{{ webT("home.intro.legalNote") }}</p>
    </footer>
  </section>
</template>

<style scoped>
.home-about {
  width: min(900px, calc(100% - 48px));
  margin: 0 auto;
  display: grid;
  gap: clamp(32px, 5vw, 48px);
  padding: clamp(90px, 12vw, 150px) 0 96px;
}

.home-about-heading {
  width: min(760px, 100%);
  display: grid;
  gap: 16px;
}

.home-about-heading h1 {
  margin: 0;
  font-size: clamp(1.65rem, 3vw, 2.2rem);
  letter-spacing: -0.025em;
  line-height: 1.3;
}

.home-about-heading p,
.feature-copy p,
.intro-card p,
.engine-note p {
  margin: 0;
  color: var(--bc-text-muted);
  line-height: 1.85;
}

.home-about-heading p {
  font-size: clamp(1rem, 1.7vw, 1.22rem);
}

.intro-group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
}

.intro-group + .intro-group {
  padding-top: clamp(32px, 5vw, 48px);
  border-top: 1px solid var(--bc-panel-border);
}

.feature-copy {
  display: grid;
  align-content: start;
  gap: 13px;
}

.feature-copy h2 {
  margin: 0;
  font-size: clamp(1.35rem, 2.5vw, 1.75rem);
  letter-spacing: -0.035em;
  line-height: 1.35;
  text-wrap: balance;
}

.game-cards,
.feature-cards {
  display: grid;
  gap: 20px;
}

.game-cards {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.feature-cards {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.intro-card {
  display: grid;
  align-content: start;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--bc-panel-border);
  border-radius: var(--bc-panel-radius);
  background: rgb(255 255 255 / 3%);
}

.intro-card h3 {
  margin: 0;
  font-size: 1.15rem;
  line-height: 1.4;
}

.card-icon {
  margin-bottom: 6px;
  color: var(--bc-highlight);
}

.intro-footer {
  display: grid;
  gap: 32px;
  padding-top: 32px;
  border-top: 1px solid var(--bc-panel-border);
}

.engine-note {
  display: grid;
  gap: 12px;
  max-width: 720px;
}

.engine-note h2 {
  margin: 0;
  font-size: 1.25rem;
  line-height: 1.4;
}

.home-about-note {
  margin: 0;
  color: var(--bc-text-muted);
  font-size: 0.7rem;
  line-height: 1.6;
}

@media (max-width: 820px) {
  .home-about {
    width: min(100% - 28px, 680px);
    padding-top: 90px;
  }

  .feature-cards {
    grid-template-columns: 1fr;
    gap: 28px;
  }
}

@media (max-width: 560px) {
  .game-cards {
    grid-template-columns: 1fr;
  }
}
</style>
