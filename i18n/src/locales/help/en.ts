import type { HelpTranslationKey } from "./zh-CN.js";
const catalog = {
  "help.title": "Controls",
  "help.html": `<h2>Game</h2>
<ul>
<li><strong>WASD / Arrow keys</strong>: Move</li>
<li><strong>Tab</strong>: Replay panel (Explore)</li>
<li><strong>~</strong>: Debug mode (Explore)<ul><li>Double-click the map to teleport Bobby while Debug mode is enabled</li></ul></li>
</ul>
<h2>General</h2>
<ul>
<li><strong>Ctrl+Z</strong>: Undo</li>
<li><strong>Ctrl+Y</strong>: Redo</li>
<li><strong>Wheel / +/- / pinch</strong>: Zoom and pan the map</li>
</ul>
<h2>Editor</h2>
<ul>
<li><strong>Tab</strong>: Switch Palette / Surface</li>
<li><strong>1</strong>: Select</li>
<li><strong>2</strong>: Brush</li>
<li><strong>3</strong>: Smart Surface fill</li>
<li><strong>4</strong>: Palette erase tool</li>
<li><strong>Ctrl+A</strong>: Select the whole map</li>
<li><strong>Ctrl+C / X / V</strong>: Copy / Cut / Paste</li>
<li><strong>Delete / Backspace</strong>: Delete selected Entity</li>
<li><strong>Q / E</strong>: Cycle Palette Entity variants</li>
<li><strong>Right click</strong>: Switch to Select and select the current cell</li>
</ul>
<h2>About</h2>
<p><a href="https://github.com/XUJINKAI/bobby-carrot-5-remake">GitHub repository</a></p>`,
} satisfies Record<HelpTranslationKey, string>;
export default catalog;
