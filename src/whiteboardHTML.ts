import * as vscode from 'vscode';
function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
export function getWhiteboardHTML(webview: vscode.Webview, _extensionUri: vscode.Uri): string {
  const nonce = getNonce();
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'nonce-${nonce}'; img-src data: blob:;">
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Whiteboard</title>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Syne:wght@400;600;700;800&display=swap" rel="stylesheet"/>
<style>
:root {
  --bg: #0f0f13;
  --surface: #1a1a24;
  --surface2: #22222f;
  --border: #2e2e42;
  --accent: #6c63ff;
  --accent2: #ff6584;
  --accent3: #43e97b;
  --text: #e8e8f0;
  --text-dim: #8888a8;
  --toolbar-h: 56px;
  --radius: 10px;
  --shadow: 0 4px 24px rgba(0,0,0,0.5);
}
.theme-light {
  --bg: #f0f0f5;
  --surface: #ffffff;
  --surface2: #e8e8f0;
  --border: #d0d0e0;
  --text: #1a1a2e;
  --text-dim: #6666aa;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'Syne', sans-serif;
  background: var(--bg);
  color: var(--text);
  overflow: hidden;
  height: 100vh;
  width: 100vw;
  user-select: none;
}

/* ── TOOLBAR ── */
#toolbar {
  position: fixed;
  top: 0; left: 0; right: 0;
  height: var(--toolbar-h);
  background: var(--surface);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  z-index: 1000;
  box-shadow: 0 2px 12px rgba(0,0,0,0.3);
}
.tb-logo {
  font-size: 14px;
  font-weight: 800;
  color: var(--accent);
  letter-spacing: 0.05em;
  margin-right: 8px;
  white-space: nowrap;
}
.tb-sep { width: 1px; height: 28px; background: var(--border); margin: 0 6px; }
.tb-group { display: flex; align-items: center; gap: 2px; }
.tb-btn {
  width: 36px; height: 36px;
  border-radius: 8px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
  transition: all 0.15s;
  position: relative;
}
.tb-btn:hover { background: var(--surface2); color: var(--text); }
.tb-btn.active { background: var(--accent); color: #fff; }
.tb-btn[data-tooltip]:hover::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: -32px;
  left: 50%; transform: translateX(-50%);
  background: #000; color: #fff;
  font-size: 11px; font-family: 'JetBrains Mono', monospace;
  padding: 3px 8px; border-radius: 4px;
  white-space: nowrap; pointer-events: none; z-index: 9999;
}
.tb-color-btn {
  width: 24px; height: 24px;
  border-radius: 50%; border: 2px solid transparent;
  cursor: pointer; transition: all 0.15s;
}
.tb-color-btn.active { border-color: var(--text); transform: scale(1.2); }
#strokeWidth {
  -webkit-appearance: none;
  width: 80px; height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none; cursor: pointer;
}
#strokeWidth::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}
.tb-right { margin-left: auto; display: flex; align-items: center; gap: 4px; }
.tb-icon-btn {
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--text-dim);
  font-family: 'Syne', sans-serif;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.tb-icon-btn:hover { background: var(--surface2); color: var(--text); }
.tb-icon-btn.danger:hover { background: #ff445520; border-color: #ff4455; color: #ff4455; }

/* ── CANVAS AREA ── */
#canvas-container {
  position: fixed;
  top: var(--toolbar-h);
  left: 0; right: 0; bottom: 0;
  overflow: hidden;
  cursor: crosshair;
}
#canvas-container.tool-select { cursor: default; }
#canvas-container.tool-text { cursor: text; }
#canvas-container.tool-pan { cursor: grab; }
#canvas-container.tool-pan.panning { cursor: grabbing; }
#canvas-container.tool-eraser { cursor: none; }

#bg-canvas { position: absolute; top:0;left:0; pointer-events: none; }
#main-canvas { position: absolute; top:0;left:0; }
#ui-layer { position: absolute; top:0;left:0; pointer-events: none; }

/* Grid dots */
.grid-canvas { position: absolute; top:0;left:0; pointer-events:none; }

/* ── FLOATING ELEMENTS (sticky notes, code cards) ── */
.floating-el {
  position: absolute;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  pointer-events: all;
}
.floating-el .el-header {
  height: 28px;
  display: flex; align-items: center;
  padding: 0 10px;
  border-radius: var(--radius) var(--radius) 0 0;
  cursor: move;
  font-size: 11px;
  font-weight: 600;
  gap: 6px;
}
.floating-el .el-close {
  margin-left: auto;
  width: 16px; height: 16px;
  border-radius: 50%; border: none;
  background: rgba(255,255,255,0.2);
  color: #fff; cursor: pointer;
  font-size: 10px;
  display: flex; align-items: center; justify-content: center;
}
.floating-el .el-close:hover { background: #ff4455; }
.resize-handle {
  position: absolute;
  bottom: 0; right: 0;
  width: 14px; height: 14px;
  cursor: se-resize;
  background: linear-gradient(135deg, transparent 50%, var(--border) 50%);
  border-radius: 0 0 var(--radius) 0;
}

/* ── STICKY NOTE ── */
.sticky-note {
  border: none;
}
.sticky-note .el-header { background: rgba(0,0,0,0.2); }
.sticky-note .sticky-body {
  padding: 10px;
  min-height: 60px;
  font-family: 'Syne', sans-serif;
  font-size: 13px;
  line-height: 1.5;
  color: #1a1a1a;
  background: transparent;
  border: none; outline: none;
  resize: none;
  width: 100%;
}
.sticky-note textarea {
  background: transparent; border: none; outline: none;
  font-family: 'Syne', sans-serif; font-size: 13px;
  line-height: 1.5; color: #1a1a1a;
  width: 100%; padding: 10px;
  resize: none;
}

/* ── CODE CARD ── */
.code-card {
  background: var(--surface);
  border: 1px solid var(--border);
  min-width: 280px;
}
.code-card .el-header {
  background: var(--surface2);
  color: var(--text);
  font-family: 'JetBrains Mono', monospace;
}
.code-card .lang-badge {
  padding: 2px 6px; border-radius: 4px;
  background: var(--accent); color: #fff;
  font-size: 10px; font-weight: 600;
}
.code-card .code-body {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px; line-height: 1.6;
  padding: 12px;
  overflow: auto;
  max-height: 400px;
  white-space: pre;
  color: var(--text);
  background: var(--bg);
  border-radius: 0 0 var(--radius) var(--radius);
}
.code-card .code-body:focus { outline: none; }

/* ── SHAPE LABELS ── */
.shape-label {
  position: absolute;
  pointer-events: none;
  font-size: 12px;
  font-family: 'Syne', sans-serif;
  color: var(--text);
  background: transparent;
  border: none; outline: none;
  text-align: center;
  min-width: 60px;
}

/* ── TEXT INPUT ── */
#text-input-overlay {
  position: absolute;
  display: none;
  background: transparent;
  border: 2px dashed var(--accent);
  border-radius: 4px;
  padding: 4px 8px;
  font-family: 'Syne', sans-serif;
  font-size: 16px;
  color: var(--text);
  outline: none;
  min-width: 120px;
  min-height: 30px;
  z-index: 500;
  resize: none;
  overflow: hidden;
}

/* ── ERASER CURSOR ── */
#eraser-cursor {
  position: fixed;
  pointer-events: none;
  border: 2px solid var(--accent2);
  border-radius: 50%;
  z-index: 9999;
  display: none;
  transform: translate(-50%, -50%);
}

/* ── MINI-MAP ── */
#minimap {
  position: fixed;
  bottom: 12px; right: 12px;
  width: 140px; height: 90px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  z-index: 900;
  opacity: 0.85;
  cursor: pointer;
}
#minimap canvas { width: 100%; height: 100%; }
#minimap-label {
  position: absolute;
  bottom: 2px; left: 6px;
  font-size: 9px; color: var(--text-dim);
  font-family: 'JetBrains Mono', monospace;
  pointer-events: none;
}

/* ── ZOOM INDICATOR ── */
#zoom-indicator {
  position: fixed;
  bottom: 14px; left: 50%; transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 14px;
  font-size: 12px;
  font-family: 'JetBrains Mono', monospace;
  color: var(--text-dim);
  z-index: 900;
  pointer-events: none;
}

/* ── COLOR PICKER POPUP ── */
#color-picker-popup {
  position: fixed;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px;
  z-index: 2000;
  display: none;
  box-shadow: var(--shadow);
  width: 220px;
}
.color-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px; margin-bottom: 8px;
}
.color-swatch {
  width: 22px; height: 22px;
  border-radius: 4px; cursor: pointer;
  border: 2px solid transparent;
  transition: transform 0.1s;
}
.color-swatch:hover { transform: scale(1.2); border-color: #fff; }
#custom-color-row {
  display: flex; align-items: center; gap: 8px;
  margin-top: 6px;
}
#custom-color-row input[type=color] {
  width: 32px; height: 32px; border: none; border-radius: 6px;
  cursor: pointer; background: none;
}
#custom-color-row span { font-size: 11px; color: var(--text-dim); }

/* ── SHAPE PICKER ── */
#shape-picker-popup {
  position: fixed;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 10px;
  z-index: 2000;
  display: none;
  box-shadow: var(--shadow);
  display: none;
}
.shape-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px;
}
.shape-opt {
  width: 48px; height: 40px;
  border-radius: 8px; border: 1px solid var(--border);
  background: var(--surface2); color: var(--text);
  cursor: pointer; font-size: 18px;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
}
.shape-opt:hover { background: var(--accent); color: #fff; }

/* ── TOAST ── */
#toast {
  position: fixed;
  bottom: 60px; left: 50%; transform: translateX(-50%);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 18px;
  font-size: 12px;
  color: var(--text);
  z-index: 9000;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
  font-family: 'JetBrains Mono', monospace;
}
#toast.show { opacity: 1; }

/* ── SELECTION BOX ── */
#selection-box {
  position: absolute;
  border: 1.5px dashed var(--accent);
  background: rgba(108,99,255,0.08);
  pointer-events: none;
  display: none;
  border-radius: 2px;
}

/* ── CONTEXT MENU ── */
#ctx-menu {
  position: fixed;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  z-index: 3000;
  display: none;
  box-shadow: var(--shadow);
  min-width: 160px;
}
.ctx-item {
  padding: 7px 12px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  display: flex; align-items: center; gap: 8px;
  transition: background 0.1s;
}
.ctx-item:hover { background: var(--surface2); }
.ctx-item.danger:hover { background: #ff445520; color: #ff4455; }
.ctx-sep { height: 1px; background: var(--border); margin: 4px 0; }
</style>
</head>
<body>

<!-- TOOLBAR -->
<div id="toolbar">
  <span class="tb-logo">⬜ BOARD</span>
  <div class="tb-sep"></div>

  <!-- Draw tools -->
  <div class="tb-group" id="tool-group">
    <button class="tb-btn active" id="tool-pen" data-tool="pen" data-tooltip="Pen (P)">✏️</button>
    <button class="tb-btn" id="tool-highlighter" data-tool="highlighter" data-tooltip="Highlighter (H)">🖊️</button>
    <button class="tb-btn" id="tool-eraser" data-tool="eraser" data-tooltip="Eraser (E)">🧹</button>
    <button class="tb-btn" id="tool-select" data-tool="select" data-tooltip="Select (S)">⬚</button>
    <button class="tb-btn" id="tool-text" data-tool="text" data-tooltip="Text (T)">𝐓</button>
    <button class="tb-btn" id="tool-shape" data-tool="shape" data-tooltip="Shapes (R)">◻</button>
    <button class="tb-btn" id="tool-pan" data-tool="pan" data-tooltip="Pan (Space)">✋</button>
  </div>

  <div class="tb-sep"></div>

  <!-- Colors -->
  <div class="tb-group" id="color-group">
    <button class="tb-color-btn active" style="background:#e8e8f0" data-color="#e8e8f0" title="White"></button>
    <button class="tb-color-btn" style="background:#6c63ff" data-color="#6c63ff" title="Purple"></button>
    <button class="tb-color-btn" style="background:#ff6584" data-color="#ff6584" title="Pink"></button>
    <button class="tb-color-btn" style="background:#43e97b" data-color="#43e97b" title="Green"></button>
    <button class="tb-color-btn" style="background:#ffd166" data-color="#ffd166" title="Yellow"></button>
    <button class="tb-color-btn" style="background:#06d6f0" data-color="#06d6f0" title="Cyan"></button>
    <button class="tb-color-btn" style="background:#ff4444" data-color="#ff4444" title="Red"></button>
    <button class="tb-btn" id="more-colors-btn" data-tooltip="More colors">🎨</button>
  </div>

  <div class="tb-sep"></div>

  <!-- Stroke width -->
  <input type="range" id="strokeWidth" min="1" max="20" value="3" title="Stroke width"/>

  <div class="tb-sep"></div>

  <!-- Add elements -->
  <div class="tb-group">
    <button class="tb-btn" id="add-sticky" data-tooltip="Add sticky note">📝</button>
    <button class="tb-btn" id="add-code-card" data-tooltip="Add code card">💻</button>
  </div>

  <!-- Right side -->
  <div class="tb-right">
    <button class="tb-icon-btn" id="btn-undo" title="Undo (Ctrl+Z)">↩ Undo</button>
    <button class="tb-icon-btn" id="btn-redo" title="Redo (Ctrl+Y)">↪ Redo</button>
    <div class="tb-sep"></div>
    <button class="tb-icon-btn" id="btn-zoom-out" title="Zoom Out">－</button>
    <button class="tb-icon-btn" id="btn-zoom-reset" title="Reset Zoom">100%</button>
    <button class="tb-icon-btn" id="btn-zoom-in" title="Zoom In">＋</button>
    <div class="tb-sep"></div>
    <button class="tb-icon-btn" id="btn-export" title="Export as PNG">⬇ Export</button>
    <button class="tb-icon-btn danger" id="btn-clear" title="Clear board">🗑 Clear</button>
  </div>
</div>

<!-- CANVAS AREA -->
<div id="canvas-container" class="tool-pen">
  <canvas id="grid-canvas" class="grid-canvas"></canvas>
  <canvas id="main-canvas"></canvas>
  <div id="ui-layer">
    <div id="selection-box"></div>
    <textarea id="text-input-overlay" rows="1" placeholder="Type here..."></textarea>
  </div>
</div>

<!-- ERASER CURSOR -->
<div id="eraser-cursor"></div>

<!-- COLOR PICKER POPUP -->
<div id="color-picker-popup">
  <div class="color-grid" id="color-grid"></div>
  <div id="custom-color-row">
    <input type="color" id="custom-color-input" value="#ffffff"/>
    <span>Custom color</span>
  </div>
</div>

<!-- SHAPE PICKER -->
<div id="shape-picker-popup">
  <div class="shape-grid">
    <button class="shape-opt" data-shape="rect" title="Rectangle">▭</button>
    <button class="shape-opt" data-shape="circle" title="Circle">○</button>
    <button class="shape-opt" data-shape="diamond" title="Diamond">◇</button>
    <button class="shape-opt" data-shape="arrow" title="Arrow">→</button>
    <button class="shape-opt" data-shape="line" title="Line">╱</button>
    <button class="shape-opt" data-shape="triangle" title="Triangle">△</button>
  </div>
</div>

<!-- CONTEXT MENU -->
<div id="ctx-menu">
  <div class="ctx-item" id="ctx-copy">📋 Copy</div>
  <div class="ctx-item" id="ctx-duplicate">⧉ Duplicate</div>
  <div class="ctx-sep"></div>
  <div class="ctx-item" id="ctx-sticky">📝 Add Sticky Note</div>
  <div class="ctx-item" id="ctx-code">💻 Add Code Card</div>
  <div class="ctx-sep"></div>
  <div class="ctx-item danger" id="ctx-delete">🗑 Delete</div>
</div>

<!-- MINIMAP -->
<div id="minimap">
  <canvas id="minimap-canvas"></canvas>
  <span id="minimap-label">OVERVIEW</span>
</div>

<!-- ZOOM INDICATOR -->
<div id="zoom-indicator">100%</div>

<!-- TOAST -->
<div id="toast"></div>

<script nonce="${nonce}">
// ──────────────────────────────────────────────
// WHITEBOARD ENGINE
// ──────────────────────────────────────────────
const vscode = acquireVsCodeApi();

// ── STATE ──
const state = {
  tool: 'pen',
  color: '#e8e8f0',
  strokeWidth: 3,
  selectedShape: 'rect',
  theme: 'dark',
  viewport: { x: 0, y: 0, scale: 1 },
  isDrawing: false,
  isPanning: false,
  panStart: { x: 0, y: 0 },
  currentStroke: null,
  currentShape: null,
  strokes: [],
  shapes: [],
  textNodes: [],
  stickyNotes: [],
  codeCards: [],
  undoStack: [],
  redoStack: [],
  selectedIds: new Set(),
  dragEl: null,
  resizeEl: null,
  lastMouse: { x: 0, y: 0 },
  ctxMenuTarget: null,
};

// ── CANVAS SETUP ──
const container = document.getElementById('canvas-container');
const canvas = document.getElementById('main-canvas');
const ctx = canvas.getContext('2d');
const gridCanvas = document.getElementById('grid-canvas');
const gridCtx = gridCanvas.getContext('2d');
const minimapCanvas = document.getElementById('minimap-canvas');
const minimapCtx = minimapCanvas.getContext('2d');

function resize() {
  const w = container.offsetWidth, h = container.offsetHeight;
  canvas.width = w; canvas.height = h;
  gridCanvas.width = w; gridCanvas.height = h;
  minimapCanvas.width = 140; minimapCanvas.height = 90;
  drawGrid();
  renderAll();
}
window.addEventListener('resize', resize);
resize();

// ── COORDINATE TRANSFORMS ──
function screenToWorld(sx, sy) {
  return {
    x: (sx - state.viewport.x) / state.viewport.scale,
    y: (sy - state.viewport.y) / state.viewport.scale,
  };
}
function worldToScreen(wx, wy) {
  return {
    x: wx * state.viewport.scale + state.viewport.x,
    y: wy * state.viewport.scale + state.viewport.y,
  };
}

// ── GRID ──
function drawGrid() {
  const w = gridCanvas.width, h = gridCanvas.height;
  gridCtx.clearRect(0, 0, w, h);
  const isDark = state.theme === 'dark';
  const dotColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)';
  const spacing = 28 * state.viewport.scale;
  const startX = state.viewport.x % spacing;
  const startY = state.viewport.y % spacing;
  gridCtx.fillStyle = dotColor;
  for (let x = startX; x < w; x += spacing) {
    for (let y = startY; y < h; y += spacing) {
      gridCtx.beginPath();
      gridCtx.arc(x, y, 1.2, 0, Math.PI * 2);
      gridCtx.fill();
    }
  }
}

// ── RENDER ──
function renderAll() {
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(state.viewport.x, state.viewport.y);
  ctx.scale(state.viewport.scale, state.viewport.scale);

  // Draw strokes
  for (const s of state.strokes) drawStroke(s);
  if (state.currentStroke) drawStroke(state.currentStroke);

  // Draw shapes
  for (const s of state.shapes) drawShape(s);
  if (state.currentShape) drawShape(state.currentShape, true);

  // Draw text nodes
  for (const t of state.textNodes) drawTextNode(t);

  ctx.restore();

  drawGrid();
  updateFloatingElements();
  updateMinimap();
  updateZoomIndicator();
}

function drawStroke(s) {
  if (!s.points || s.points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = s.tool === 'highlighter' ? 0.4 : 1.0;
  ctx.strokeStyle = s.tool === 'eraser' ? (state.theme === 'dark' ? '#0f0f13' : '#f0f0f5') : s.color;
  ctx.lineWidth = s.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (s.tool === 'highlighter') ctx.lineWidth = s.width * 4;
  ctx.beginPath();
  ctx.moveTo(s.points[0], s.points[1]);
  for (let i = 2; i < s.points.length - 2; i += 2) {
    const mx = (s.points[i] + s.points[i + 2]) / 2;
    const my = (s.points[i + 1] + s.points[i + 3]) / 2;
    ctx.quadraticCurveTo(s.points[i], s.points[i + 1], mx, my);
  }
  if (s.points.length >= 4) ctx.lineTo(s.points[s.points.length - 2], s.points[s.points.length - 1]);
  ctx.stroke();
  ctx.restore();
}

function drawShape(s, isPreview = false) {
  ctx.save();
  ctx.strokeStyle = s.color;
  ctx.lineWidth = s.strokeWidth || 2;
  ctx.fillStyle = s.fill && s.fill !== 'none' ? s.fill : 'transparent';
  if (isPreview) ctx.setLineDash([6, 4]);

  const x = Math.min(s.x, s.x2 ?? s.x + s.w);
  const y = Math.min(s.y, s.y2 ?? s.y + s.h);
  const w = Math.abs((s.x2 ?? s.x + s.w) - s.x);
  const h = Math.abs((s.y2 ?? s.y + s.h) - s.y);

  ctx.beginPath();
  if (s.type === 'rect') {
    ctx.roundRect(x, y, w, h, 4);
    ctx.stroke(); if (s.fill !== 'none') ctx.fill();
  } else if (s.type === 'circle') {
    ctx.ellipse(x + w/2, y + h/2, w/2, h/2, 0, 0, Math.PI * 2);
    ctx.stroke(); if (s.fill !== 'none') ctx.fill();
  } else if (s.type === 'diamond') {
    const cx = x + w/2, cy = y + h/2;
    ctx.moveTo(cx, y); ctx.lineTo(x + w, cy);
    ctx.lineTo(cx, y + h); ctx.lineTo(x, cy); ctx.closePath();
    ctx.stroke(); if (s.fill !== 'none') ctx.fill();
  } else if (s.type === 'triangle') {
    ctx.moveTo(x + w/2, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath();
    ctx.stroke(); if (s.fill !== 'none') ctx.fill();
  } else if (s.type === 'line') {
    ctx.moveTo(s.x, s.y); ctx.lineTo(s.x2 ?? s.x, s.y2 ?? s.y);
    ctx.stroke();
  } else if (s.type === 'arrow') {
    const ex = s.x2 ?? s.x, ey = s.y2 ?? s.y;
    const angle = Math.atan2(ey - s.y, ex - s.x);
    const hl = 18, hw = 7;
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(ex - hl * Math.cos(angle), ey - hl * Math.sin(angle));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - hl * Math.cos(angle - 0.4), ey - hl * Math.sin(angle - 0.4));
    ctx.lineTo(ex - hl * Math.cos(angle + 0.4), ey - hl * Math.sin(angle + 0.4));
    ctx.closePath();
    ctx.fillStyle = s.color; ctx.fill();
  }

  // Label
  if (s.label) {
    ctx.fillStyle = s.color;
    ctx.font = '12px Syne, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(s.label, x + w / 2, y + h / 2 + 4);
  }

  // Selection indicator
  if (state.selectedIds.has(s.id)) {
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.strokeRect(x - 4, y - 4, w + 8, h + 8);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

function drawTextNode(t) {
  ctx.save();
  ctx.fillStyle = t.color;
  ctx.font = (t.bold ? 'bold ' : '') + t.fontSize + 'px Syne, sans-serif';
  ctx.fillText(t.text, t.x, t.y);
  if (state.selectedIds.has(t.id)) {
    const m = ctx.measureText(t.text);
    ctx.strokeStyle = '#6c63ff';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 2]);
    ctx.strokeRect(t.x - 4, t.y - t.fontSize, m.width + 8, t.fontSize + 8);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

// ── FLOATING ELEMENTS ──
function updateFloatingElements() {
  // Position sticky notes and code cards based on viewport transform
  for (const note of state.stickyNotes) {
    const el = document.getElementById('sticky-' + note.id);
    if (el) {
      const s = worldToScreen(note.x, note.y);
      el.style.left = s.x + 'px';
      el.style.top = s.y + 'px';
      el.style.width = (note.w * state.viewport.scale) + 'px';
      el.style.minHeight = (note.h * state.viewport.scale) + 'px';
      el.style.transform = 'scale(1)';
    }
  }
  for (const card of state.codeCards) {
    const el = document.getElementById('code-' + card.id);
    if (el) {
      const s = worldToScreen(card.x, card.y);
      el.style.left = s.x + 'px';
      el.style.top = s.y + 'px';
      el.style.width = Math.max(280, card.w * state.viewport.scale) + 'px';
    }
  }
}

// ── STICKY NOTES ──
function addStickyNote(wx, wy, text = '', color = '#ffd166') {
  const id = uid();
  const note = { id, x: wx, y: wy, w: 200, h: 140, text, color };
  state.stickyNotes.push(note);
  renderStickyDOM(note);
  pushUndo();
  renderAll();
}

const stickyColors = ['#ffd166', '#06d6f0', '#ef476f', '#43e97b', '#a29bfe', '#fdcb6e'];

function renderStickyDOM(note) {
  const el = document.createElement('div');
  el.id = 'sticky-' + note.id;
  el.className = 'floating-el sticky-note';
  el.style.background = note.color;
  el.innerHTML = \`
    <div class="el-header" style="background:rgba(0,0,0,0.15)">
      <span style="font-size:10px">📝 NOTE</span>
      <div style="display:flex;gap:3px;margin-left:4px">
        \${stickyColors.map(c => \`<div onclick="changeStickyColor('\${note.id}','\${c}')" style="width:12px;height:12px;border-radius:50%;background:\${c};cursor:pointer;border:1px solid rgba(0,0,0,0.2)"></div>\`).join('')}
      </div>
      <button class="el-close" onclick="removeSticky('\${note.id}')">✕</button>
    </div>
    <textarea class="sticky-body" placeholder="Write here..." style="background:transparent;border:none;outline:none;resize:none;width:100%;padding:10px;font-family:'Syne',sans-serif;font-size:13px;line-height:1.5;color:#1a1a1a;min-height:100px">\${note.text}</textarea>
    <div class="resize-handle"></div>
  \`;

  el.querySelector('textarea').addEventListener('input', (e) => {
    note.text = e.target.value;
    scheduleAutosave();
  });

  makeDraggable(el, note, 'sticky');
  makeResizable(el, note);
  container.appendChild(el);
  updateFloatingElements();
}

function changeStickyColor(id, color) {
  const note = state.stickyNotes.find(n => n.id === id);
  if (!note) return;
  note.color = color;
  const el = document.getElementById('sticky-' + id);
  if (el) el.style.background = color;
  scheduleAutosave();
}

function removeSticky(id) {
  state.stickyNotes = state.stickyNotes.filter(n => n.id !== id);
  const el = document.getElementById('sticky-' + id);
  if (el) el.remove();
  pushUndo(); scheduleAutosave();
}

// ── CODE CARDS ──
function addCodeCard(wx, wy, code = '', language = 'javascript', fileName = 'snippet') {
  const id = uid();
  const card = { id, x: wx, y: wy, w: 400, h: 300, code, language, fileName, minimized: false };
  state.codeCards.push(card);
  renderCodeCardDOM(card);
  pushUndo();
  renderAll();
}

function renderCodeCardDOM(card) {
  const el = document.createElement('div');
  el.id = 'code-' + card.id;
  el.className = 'floating-el code-card';
  el.innerHTML = \`
    <div class="el-header" style="background:var(--surface2)">
      <span class="lang-badge">\${card.language.toUpperCase()}</span>
      <span style="font-family:'JetBrains Mono',monospace;font-size:10px;cursor:pointer" onclick="jumpToFile('\${card.fileName}')" title="Jump to file">\${card.fileName}</span>
      <button class="el-close" style="background:rgba(108,99,255,0.4)" onclick="toggleMinimizeCode('\${card.id}')">▾</button>
      <button class="el-close" onclick="removeCodeCard('\${card.id}')">✕</button>
    </div>
    <div class="code-body" id="code-body-\${card.id}" contenteditable="true">\${escapeHtml(card.code)}</div>
    <div class="resize-handle"></div>
  \`;

  el.querySelector('.code-body').addEventListener('input', (e) => {
    card.code = e.target.innerText;
    scheduleAutosave();
  });

  makeDraggable(el, card, 'code');
  container.appendChild(el);
  updateFloatingElements();
}

function toggleMinimizeCode(id) {
  const card = state.codeCards.find(c => c.id === id);
  const body = document.getElementById('code-body-' + id);
  if (!card || !body) return;
  card.minimized = !card.minimized;
  body.style.display = card.minimized ? 'none' : 'block';
}

function removeCodeCard(id) {
  state.codeCards = state.codeCards.filter(c => c.id !== id);
  const el = document.getElementById('code-' + id);
  if (el) el.remove();
  pushUndo(); scheduleAutosave();
}

function jumpToFile(fileName) {
  vscode.postMessage({ type: 'openFile', fileName });
}

// ── DRAG & RESIZE ──
function makeDraggable(el, dataObj, kind) {
  const header = el.querySelector('.el-header');
  if (!header) return;
  let ox, oy;
  header.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON' || e.target.tagName === 'DIV' && e.target.style.borderRadius) return;
    e.stopPropagation();
    const rect = el.getBoundingClientRect();
    ox = e.clientX - rect.left;
    oy = e.clientY - rect.top;
    state.dragEl = { el, dataObj, ox, oy };
  });
}

function makeResizable(el, dataObj) {
  const handle = el.querySelector('.resize-handle');
  if (!handle) return;
  handle.addEventListener('mousedown', (e) => {
    e.stopPropagation();
    state.resizeEl = { el, dataObj, startX: e.clientX, startY: e.clientY, startW: dataObj.w, startH: dataObj.h };
  });
}

// ── MOUSE EVENTS ──
canvas.addEventListener('mousedown', onMouseDown);
canvas.addEventListener('mousemove', onMouseMove);
canvas.addEventListener('mouseup', onMouseUp);
canvas.addEventListener('mouseleave', onMouseUp);
canvas.addEventListener('wheel', onWheel, { passive: false });
canvas.addEventListener('contextmenu', onContextMenu);
document.addEventListener('mousemove', onDocMouseMove);
document.addEventListener('mouseup', onDocMouseUp);

function onMouseDown(e) {
  if (e.button !== 0) return;
  closePopups();

  const mx = e.offsetX, my = e.offsetY;
  const { x: wx, y: wy } = screenToWorld(mx, my);
  state.lastMouse = { x: mx, y: my };

  if (state.tool === 'pan' || e.altKey) {
    state.isPanning = true;
    state.panStart = { x: e.clientX - state.viewport.x, y: e.clientY - state.viewport.y };
    container.classList.add('panning');
    return;
  }

  if (state.tool === 'pen' || state.tool === 'highlighter' || state.tool === 'eraser') {
    state.isDrawing = true;
    state.currentStroke = {
      id: uid(), points: [wx, wy],
      color: state.color, width: state.strokeWidth,
      tool: state.tool, opacity: 1,
    };
    pushUndo();
  }

  if (state.tool === 'shape') {
    state.isDrawing = true;
    state.currentShape = {
      id: uid(), type: state.selectedShape,
      x: wx, y: wy, x2: wx, y2: wy,
      color: state.color, fill: 'none', strokeWidth: state.strokeWidth,
    };
    pushUndo();
  }

  if (state.tool === 'text') {
    showTextInput(mx, my, wx, wy);
  }

  if (state.tool === 'select') {
    const hit = hitTest(wx, wy);
    if (hit) {
      state.selectedIds.clear();
      state.selectedIds.add(hit.id);
    } else {
      state.selectedIds.clear();
    }
    renderAll();
  }
}

function onMouseMove(e) {
  const mx = e.offsetX, my = e.offsetY;
  const { x: wx, y: wy } = screenToWorld(mx, my);

  // Eraser cursor
  if (state.tool === 'eraser') {
    const cursor = document.getElementById('eraser-cursor');
    cursor.style.display = 'block';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    const size = state.strokeWidth * 6 * state.viewport.scale;
    cursor.style.width = size + 'px';
    cursor.style.height = size + 'px';
  } else {
    document.getElementById('eraser-cursor').style.display = 'none';
  }

  if (state.isPanning) {
    state.viewport.x = e.clientX - state.panStart.x;
    state.viewport.y = e.clientY - state.panStart.y;
    renderAll();
    return;
  }

  if (state.isDrawing && state.currentStroke) {
    state.currentStroke.points.push(wx, wy);
    renderAll();
  }

  if (state.isDrawing && state.currentShape) {
    state.currentShape.x2 = wx;
    state.currentShape.y2 = wy;
    renderAll();
  }

  state.lastMouse = { x: mx, y: my };
}

function onMouseUp(e) {
  if (state.isPanning) {
    state.isPanning = false;
    container.classList.remove('panning');
    return;
  }
  if (state.isDrawing && state.currentStroke) {
    if (state.currentStroke.points.length >= 2) {
      if (state.tool === 'eraser') {
        eraseAt(state.currentStroke.points);
      } else {
        state.strokes.push(state.currentStroke);
      }
    }
    state.currentStroke = null;
    state.isDrawing = false;
    scheduleAutosave();
    renderAll();
  }
  if (state.isDrawing && state.currentShape) {
    const w = Math.abs(state.currentShape.x2 - state.currentShape.x);
    const h = Math.abs(state.currentShape.y2 - state.currentShape.y);
    if (w > 4 || h > 4) state.shapes.push(state.currentShape);
    state.currentShape = null;
    state.isDrawing = false;
    scheduleAutosave();
    renderAll();
  }
}

function onDocMouseMove(e) {
  if (state.dragEl) {
    const { el, dataObj, ox, oy } = state.dragEl;
    const contRect = container.getBoundingClientRect();
    const sx = e.clientX - contRect.left - ox;
    const sy = e.clientY - contRect.top - oy;
    el.style.left = sx + 'px';
    el.style.top = sy + 'px';
    const w = screenToWorld(sx, sy);
    dataObj.x = w.x;
    dataObj.y = w.y;
    scheduleAutosave();
  }
  if (state.resizeEl) {
    const { el, dataObj, startX, startY, startW, startH } = state.resizeEl;
    const dx = e.clientX - startX, dy = e.clientY - startY;
    dataObj.w = Math.max(120, startW + dx / state.viewport.scale);
    dataObj.h = Math.max(60, startH + dy / state.viewport.scale);
    updateFloatingElements();
    const body = el.querySelector('.code-body');
    if (body) body.style.height = (dataObj.h * state.viewport.scale - 28) + 'px';
    scheduleAutosave();
  }
}

function onDocMouseUp() {
  state.dragEl = null;
  state.resizeEl = null;
}

// ── WHEEL ZOOM ──
function onWheel(e) {
  e.preventDefault();
  const factor = e.deltaY > 0 ? 0.92 : 1.08;
  const newScale = Math.min(4, Math.max(0.1, state.viewport.scale * factor));
  const mx = e.offsetX, my = e.offsetY;
  state.viewport.x = mx - (mx - state.viewport.x) * (newScale / state.viewport.scale);
  state.viewport.y = my - (my - state.viewport.y) * (newScale / state.viewport.scale);
  state.viewport.scale = newScale;
  renderAll();
}

// ── ERASER LOGIC ──
function eraseAt(points) {
  const radius = state.strokeWidth * 4;
  state.strokes = state.strokes.filter(s => {
    for (let i = 0; i < points.length - 2; i += 2) {
      for (let j = 0; j < s.points.length - 2; j += 2) {
        const dx = points[i] - s.points[j];
        const dy = points[i+1] - s.points[j+1];
        if (Math.sqrt(dx*dx + dy*dy) < radius) return false;
      }
    }
    return true;
  });
}

// ── HIT TESTING ──
function hitTest(wx, wy) {
  // Check shapes in reverse (top-most first)
  for (let i = state.shapes.length - 1; i >= 0; i--) {
    const s = state.shapes[i];
    const x = Math.min(s.x, s.x2 ?? s.x);
    const y = Math.min(s.y, s.y2 ?? s.y);
    const w = Math.abs((s.x2 ?? s.x) - s.x);
    const h = Math.abs((s.y2 ?? s.y) - s.y);
    if (wx >= x - 6 && wx <= x + w + 6 && wy >= y - 6 && wy <= y + h + 6) return s;
  }
  for (let i = state.textNodes.length - 1; i >= 0; i--) {
    const t = state.textNodes[i];
    if (wx >= t.x - 4 && wx <= t.x + 200 && wy >= t.y - t.fontSize && wy <= t.y + 6) return t;
  }
  return null;
}

// ── TEXT INPUT ──
const textOverlay = document.getElementById('text-input-overlay');
let textEditPos = null;

function showTextInput(sx, sy, wx, wy) {
  textEditPos = { wx, wy };
  textOverlay.style.display = 'block';
  textOverlay.style.left = sx + 'px';
  textOverlay.style.top = (sy - 4) + 'px';
  textOverlay.value = '';
  textOverlay.style.fontSize = Math.max(12, 16 * state.viewport.scale) + 'px';
  textOverlay.style.color = state.color;
  textOverlay.focus();
}

textOverlay.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    commitText();
  }
  if (e.key === 'Escape') {
    textOverlay.style.display = 'none';
    textOverlay.value = '';
  }
});

textOverlay.addEventListener('blur', () => {
  commitText();
});

function commitText() {
  const text = textOverlay.value.trim();
  if (text && textEditPos) {
    state.textNodes.push({
      id: uid(), x: textEditPos.wx, y: textEditPos.wy,
      text, fontSize: 16, color: state.color, bold: false,
    });
    scheduleAutosave();
    renderAll();
  }
  textOverlay.style.display = 'none';
  textOverlay.value = '';
  textEditPos = null;
}

// ── CONTEXT MENU ──
function onContextMenu(e) {
  e.preventDefault();
  const mx = e.offsetX, my = e.offsetY;
  const { x: wx, y: wy } = screenToWorld(mx, my);
  state.ctxMenuTarget = { wx, wy, hit: hitTest(wx, wy) };
  const menu = document.getElementById('ctx-menu');
  menu.style.display = 'block';
  menu.style.left = e.clientX + 'px';
  menu.style.top = e.clientY + 'px';
}

document.getElementById('ctx-sticky').onclick = () => {
  if (state.ctxMenuTarget) addStickyNote(state.ctxMenuTarget.wx, state.ctxMenuTarget.wy);
  closePopups();
};
document.getElementById('ctx-code').onclick = () => {
  if (state.ctxMenuTarget) addCodeCard(state.ctxMenuTarget.wx, state.ctxMenuTarget.wy);
  closePopups();
};
document.getElementById('ctx-delete').onclick = () => {
  if (state.ctxMenuTarget?.hit) {
    state.shapes = state.shapes.filter(s => s.id !== state.ctxMenuTarget.hit.id);
    state.textNodes = state.textNodes.filter(t => t.id !== state.ctxMenuTarget.hit.id);
    state.selectedIds.delete(state.ctxMenuTarget.hit.id);
    renderAll(); scheduleAutosave();
  }
  closePopups();
};
document.getElementById('ctx-duplicate').onclick = () => {
  if (state.ctxMenuTarget?.hit) {
    const orig = state.ctxMenuTarget.hit;
    const copy = JSON.parse(JSON.stringify(orig));
    copy.id = uid(); copy.x += 20; copy.y += 20;
    if ('text' in copy) state.textNodes.push(copy);
    else state.shapes.push(copy);
    renderAll(); scheduleAutosave();
  }
  closePopups();
};

// ── MINIMAP ──
function updateMinimap() {
  const mc = minimapCanvas;
  minimapCtx.clearRect(0, 0, mc.width, mc.height);
  const isDark = state.theme === 'dark';
  minimapCtx.fillStyle = isDark ? '#0f0f13' : '#f0f0f5';
  minimapCtx.fillRect(0, 0, mc.width, mc.height);

  const worldW = canvas.width / state.viewport.scale;
  const worldH = canvas.height / state.viewport.scale;
  const sx = mc.width / worldW, sy = mc.height / worldH;

  for (const s of state.strokes) {
    if (!s.points.length) continue;
    minimapCtx.strokeStyle = s.color;
    minimapCtx.lineWidth = 0.8;
    minimapCtx.beginPath();
    const ox = -state.viewport.x / state.viewport.scale;
    const oy = -state.viewport.y / state.viewport.scale;
    minimapCtx.moveTo((s.points[0] - ox) * sx, (s.points[1] - oy) * sy);
    for (let i = 2; i < s.points.length; i += 2)
      minimapCtx.lineTo((s.points[i] - ox) * sx, (s.points[i+1] - oy) * sy);
    minimapCtx.stroke();
  }

  // Viewport rect
  minimapCtx.strokeStyle = '#6c63ff';
  minimapCtx.lineWidth = 1.5;
  minimapCtx.strokeRect(0, 0, mc.width, mc.height);
}

// ── ZOOM CONTROLS ──
function setZoom(newScale, cx, cy) {
  cx = cx ?? canvas.width / 2; cy = cy ?? canvas.height / 2;
  const ns = Math.min(4, Math.max(0.1, newScale));
  state.viewport.x = cx - (cx - state.viewport.x) * (ns / state.viewport.scale);
  state.viewport.y = cy - (cy - state.viewport.y) * (ns / state.viewport.scale);
  state.viewport.scale = ns;
  renderAll();
}
document.getElementById('btn-zoom-in').onclick = () => setZoom(state.viewport.scale * 1.2);
document.getElementById('btn-zoom-out').onclick = () => setZoom(state.viewport.scale / 1.2);
document.getElementById('btn-zoom-reset').onclick = () => {
  state.viewport = { x: 0, y: 0, scale: 1 }; renderAll();
};
function updateZoomIndicator() {
  document.getElementById('zoom-indicator').textContent = Math.round(state.viewport.scale * 100) + '%';
  document.getElementById('btn-zoom-reset').textContent = Math.round(state.viewport.scale * 100) + '%';
}

// ── UNDO / REDO ──
function pushUndo() {
  const snapshot = serializeState();
  state.undoStack.push(snapshot);
  if (state.undoStack.length > 60) state.undoStack.shift();
  state.redoStack = [];
}

function undo() {
  if (state.undoStack.length === 0) return;
  state.redoStack.push(serializeState());
  const prev = state.undoStack.pop();
  deserializeState(prev);
  renderAll(); showToast('Undo');
}

function redo() {
  if (state.redoStack.length === 0) return;
  state.undoStack.push(serializeState());
  const next = state.redoStack.pop();
  deserializeState(next);
  renderAll(); showToast('Redo');
}

document.getElementById('btn-undo').onclick = undo;
document.getElementById('btn-redo').onclick = redo;

// ── KEYBOARD SHORTCUTS ──
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable) return;
  const key = e.key.toLowerCase();

  if ((e.ctrlKey || e.metaKey) && key === 'z') { e.preventDefault(); undo(); return; }
  if ((e.ctrlKey || e.metaKey) && (key === 'y' || (e.shiftKey && key === 'z'))) { e.preventDefault(); redo(); return; }
  if ((e.ctrlKey || e.metaKey) && key === 's') { e.preventDefault(); forceSave(); return; }
  if (key === 'delete' || key === 'backspace') {
    state.selectedIds.forEach(id => {
      state.shapes = state.shapes.filter(s => s.id !== id);
      state.textNodes = state.textNodes.filter(t => t.id !== id);
    });
    state.selectedIds.clear();
    renderAll(); scheduleAutosave(); return;
  }

  const toolMap = { p: 'pen', h: 'highlighter', e: 'eraser', s: 'select', t: 'text', r: 'shape', ' ': 'pan' };
  if (key in toolMap) { e.preventDefault(); setTool(toolMap[key]); }
});

// ── TOOL SELECTION ──
function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('[data-tool="' + tool + '"]');
  if (btn) btn.classList.add('active');
  container.className = 'tool-' + tool;
  if (tool === 'shape') showShapePicker();
}

document.querySelectorAll('[data-tool]').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const tool = e.currentTarget.dataset.tool;
    setTool(tool);
  });
});

// ── COLOR SELECTION ──
const PALETTE = [
  '#ffffff','#e8e8f0','#c0c0cc','#888899','#555566','#222233','#000000',
  '#ff4455','#ff6584','#ff8c69','#ffd166','#f9c74f','#90be6d','#43e97b',
  '#06d6f0','#4cc9f0','#4361ee','#6c63ff','#a29bfe','#d0bfff','#f8c8d0',
];

function buildColorPicker() {
  const grid = document.getElementById('color-grid');
  grid.innerHTML = '';
  PALETTE.forEach(c => {
    const el = document.createElement('div');
    el.className = 'color-swatch';
    el.style.background = c;
    if (c === state.color) el.classList.add('active');
    el.onclick = () => { selectColor(c); closePopups(); };
    grid.appendChild(el);
  });
}

function selectColor(c) {
  state.color = c;
  document.querySelectorAll('.tb-color-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector('[data-color="' + c + '"]');
  if (btn) btn.classList.add('active');
}

document.querySelectorAll('.tb-color-btn').forEach(btn => {
  btn.addEventListener('click', (e) => selectColor(e.currentTarget.dataset.color));
});

document.getElementById('more-colors-btn').addEventListener('click', (e) => {
  const popup = document.getElementById('color-picker-popup');
  buildColorPicker();
  popup.style.display = popup.style.display === 'block' ? 'none' : 'block';
  popup.style.left = e.clientX + 'px';
  popup.style.top = (e.clientY + 8) + 'px';
  e.stopPropagation();
});

document.getElementById('custom-color-input').addEventListener('input', (e) => {
  selectColor(e.target.value);
});

// ── SHAPE PICKER ──
function showShapePicker() {
  const popup = document.getElementById('shape-picker-popup');
  const btn = document.getElementById('tool-shape');
  const rect = btn.getBoundingClientRect();
  popup.style.display = 'block';
  popup.style.left = rect.left + 'px';
  popup.style.top = (rect.bottom + 4) + 'px';
}

document.querySelectorAll('.shape-opt').forEach(btn => {
  btn.addEventListener('click', (e) => {
    state.selectedShape = e.currentTarget.dataset.shape;
    closePopups();
    showToast('Shape: ' + state.selectedShape);
  });
});

// ── STROKE WIDTH ──
document.getElementById('strokeWidth').addEventListener('input', (e) => {
  state.strokeWidth = parseInt(e.target.value);
});

// ── ADD BUTTONS ──
document.getElementById('add-sticky').addEventListener('click', () => {
  const { x, y } = screenToWorld(canvas.width / 2 - 100, canvas.height / 2 - 70);
  addStickyNote(x, y);
});
document.getElementById('add-code-card').addEventListener('click', () => {
  const { x, y } = screenToWorld(canvas.width / 2 - 200, canvas.height / 2 - 100);
  addCodeCard(x, y, '// Paste or type your code here\n', 'javascript', 'snippet.js');
});

// ── EXPORT ──
document.getElementById('btn-export').addEventListener('click', exportPNG);

function exportPNG() {
  const offscreen = document.createElement('canvas');
  offscreen.width = canvas.width * 2;
  offscreen.height = canvas.height * 2;
  const oc = offscreen.getContext('2d');
  const isDark = state.theme === 'dark';
  oc.fillStyle = isDark ? '#0f0f13' : '#f0f0f5';
  oc.fillRect(0, 0, offscreen.width, offscreen.height);
  oc.scale(2, 2);
  oc.translate(state.viewport.x, state.viewport.y);
  oc.scale(state.viewport.scale, state.viewport.scale);
  for (const s of state.strokes) {
    if (!s.points.length) continue;
    oc.save();
    oc.globalAlpha = s.tool === 'highlighter' ? 0.4 : 1;
    oc.strokeStyle = s.color; oc.lineWidth = s.width;
    oc.lineCap = 'round'; oc.lineJoin = 'round';
    if (s.tool === 'highlighter') oc.lineWidth = s.width * 4;
    oc.beginPath();
    oc.moveTo(s.points[0], s.points[1]);
    for (let i = 2; i < s.points.length; i += 2) oc.lineTo(s.points[i], s.points[i+1]);
    oc.stroke(); oc.restore();
  }
  const dataUrl = offscreen.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = 'whiteboard-' + Date.now() + '.png';
  a.click();
  showToast('Exported as PNG');
}

// ── CLEAR ──
document.getElementById('btn-clear').addEventListener('click', () => {
  if (confirm('Clear the entire whiteboard? This cannot be undone.')) {
    pushUndo();
    state.strokes = []; state.shapes = []; state.textNodes = [];
    state.stickyNotes.forEach(n => { const el = document.getElementById('sticky-' + n.id); if (el) el.remove(); });
    state.codeCards.forEach(c => { const el = document.getElementById('code-' + c.id); if (el) el.remove(); });
    state.stickyNotes = []; state.codeCards = [];
    vscode.postMessage({ type: 'clearBoard' });
    renderAll(); showToast('Board cleared');
  }
});

// ── SERIALIZE / DESERIALIZE ──
function serializeState() {
  return JSON.stringify({
    strokes: state.strokes,
    shapes: state.shapes,
    textNodes: state.textNodes,
    stickyNotes: state.stickyNotes.map(n => ({ ...n })),
    codeCards: state.codeCards.map(c => ({ ...c })),
    viewport: { ...state.viewport },
  });
}

function deserializeState(json) {
  const s = JSON.parse(json);
  state.strokes = s.strokes || [];
  state.shapes = s.shapes || [];
  state.textNodes = s.textNodes || [];
  state.viewport = s.viewport || { x: 0, y: 0, scale: 1 };

  // Rebuild floating elements
  state.stickyNotes.forEach(n => { const el = document.getElementById('sticky-' + n.id); if (el) el.remove(); });
  state.codeCards.forEach(c => { const el = document.getElementById('code-' + c.id); if (el) el.remove(); });

  state.stickyNotes = s.stickyNotes || [];
  state.codeCards = s.codeCards || [];
  state.stickyNotes.forEach(n => renderStickyDOM(n));
  state.codeCards.forEach(c => renderCodeCardDOM(c));
}

// ── AUTOSAVE ──
let autosaveTimer = null;
function scheduleAutosave() {
  clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(forceSave, 2000);
}

function forceSave() {
  const s = {
    strokes: state.strokes, shapes: state.shapes,
    textNodes: state.textNodes, stickyNotes: state.stickyNotes,
    codeCards: state.codeCards, viewport: state.viewport,
    savedAt: Date.now(),
  };
  vscode.postMessage({ type: 'saveState', state: s });
}

// ── VS CODE MESSAGE HANDLER ──
window.addEventListener('message', (e) => {
  const msg = e.data;
  switch (msg.type) {
    case 'init': {
      if (msg.savedState) {
        state.strokes = msg.savedState.strokes || [];
        state.shapes = msg.savedState.shapes || [];
        state.textNodes = msg.savedState.textNodes || [];
        state.viewport = msg.savedState.viewport || { x: 0, y: 0, scale: 1 };
        (msg.savedState.stickyNotes || []).forEach(n => { state.stickyNotes.push(n); renderStickyDOM(n); });
        (msg.savedState.codeCards || []).forEach(c => { state.codeCards.push(c); renderCodeCardDOM(c); });
      }
      applyTheme(msg.theme || 'dark');
      renderAll();
      break;
    }
    case 'injectCode': {
      const { x, y } = screenToWorld(80, 80);
      addCodeCard(x, y, msg.code || '', msg.language || 'text', msg.fileName || 'file');
      showToast('Code loaded: ' + msg.fileName);
      break;
    }
    case 'themeChange': {
      applyTheme(msg.isDark ? 'dark' : 'light');
      break;
    }
  }
});

function applyTheme(theme) {
  state.theme = theme;
  document.body.classList.toggle('theme-light', theme === 'light');
  renderAll();
}

// ── CLOSE POPUPS ──
function closePopups() {
  document.getElementById('color-picker-popup').style.display = 'none';
  document.getElementById('shape-picker-popup').style.display = 'none';
  document.getElementById('ctx-menu').style.display = 'none';
}
document.addEventListener('click', (e) => {
  if (!e.target.closest('#color-picker-popup') && !e.target.closest('#more-colors-btn')) {
    document.getElementById('color-picker-popup').style.display = 'none';
  }
  if (!e.target.closest('#shape-picker-popup') && !e.target.closest('[data-tool="shape"]')) {
    document.getElementById('shape-picker-popup').style.display = 'none';
  }
  if (!e.target.closest('#ctx-menu')) {
    document.getElementById('ctx-menu').style.display = 'none';
  }
});

// ── TOAST ──
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1800);
}

// ── UTILS ──
function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ── READY ──
vscode.postMessage({ type: 'ready' });
</script>
</body>
</html>`;
}
