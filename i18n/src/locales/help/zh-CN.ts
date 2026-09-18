const catalog = {
  "help.title": "操作说明",
  "help.html": `<h2>游戏</h2>
<ul>
<li><strong>WASD / 方向键</strong>：控制移动</li>
<li><strong>Tab</strong>：录制面板（自由探索）</li>
<li><strong>~</strong>：Debug 模式（自由探索）<ul><li>Debug 模式下双击地图瞬移 Bobby</li></ul></li>
</ul>
<h2>通用</h2>
<ul>
<li><strong>Ctrl+Z</strong>：撤销</li>
<li><strong>Ctrl+Y</strong>：重做</li>
<li><strong>滚轮 / +/- / 双指捏合</strong>：缩放地图与平移地图</li>
</ul>
<h2>Editor</h2>
<ul>
<li><strong>Tab</strong>：切换 Palette / Surface</li>
<li><strong>1</strong>：选择</li>
<li><strong>2</strong>：画笔</li>
<li><strong>3</strong>：Surface 智能填充</li>
<li><strong>4</strong>：Palette 删除工具</li>
<li><strong>Ctrl+A</strong>：全选地图</li>
<li><strong>Ctrl+C / X / V</strong>：复制 / 剪切 / 粘贴</li>
<li><strong>Delete / Backspace</strong>：删除选中的 Entity</li>
<li><strong>Q / E</strong>：切换 Palette Entity 形态</li>
<li><strong>右键</strong>：切换选择工具并选择当前格</li>
</ul>
<h2>关于</h2>
<p><a href="https://github.com/XUJINKAI/bobby-carrot-5-remake">GitHub 仓库</a></p>`,
} as const;
export type HelpTranslationKey = keyof typeof catalog;
export default catalog;
