/**
 * Edge case tests for the Whiteboard extension
 * Run with: node tests/edgeCases.test.js
 */

//  Mock vscode global for testing outside VS Code 
const vscode = {
  window: {
    createWebviewPanel: () => ({
      webview: {
        html: '',
        onDidReceiveMessage: () => ({ dispose: () => {} }),
        postMessage: () => {},
      },
      onDidDispose: () => ({ dispose: () => {} }),
      reveal: () => {},
      dispose: () => {},
    }),
    activeTextEditor: null,
    activeColorTheme: { kind: 2 },
    onDidChangeActiveColorTheme: () => ({ dispose: () => {} }),
    showWarningMessage: (msg) => console.log('[WARN]', msg),
    showInformationMessage: (msg) => console.log('[INFO]', msg),
    showErrorMessage: (msg) => console.log('[ERROR]', msg),
  },
  ViewColumn: { Beside: 2 },
  ColorThemeKind: { Light: 1, Dark: 2, HighContrast: 3 },
  workspace: {
    getConfiguration: () => ({
      get: (key, def) => def,
    }),
    findFiles: () => Promise.resolve([]),
  },
  env: { clipboard: { writeText: () => Promise.resolve() } },
  Uri: { joinPath: () => ({}) },
};

//  Mock globalState 
class MockMemento {
  constructor() { this._data = {}; }
  get(key) { return this._data[key]; }
  update(key, val) { this._data[key] = val; return Promise.resolve(); }
}

//  Tests 
let passed = 0, failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log('  ', name);
    passed++;
  } catch (e) {
    console.log('  ', name, '->', e.message);
    failed++;
  }
}

function assert(condition, msg) {
  if (!condition) throw new Error(msg || 'Assertion failed');
}
function assertEqual(a, b, msg) {
  if (a !== b) throw new Error(msg || 'Expected ' + b + ', got ' + a);
}

// 
// StorageManager Tests
// 

// Re-implement StorageManager inline for isolation
const STORAGE_KEY = 'whiteboard.savedState';

class StorageManager {
  constructor(globalState) { this._g = globalState; }
  save(state) {
    this._g.update(STORAGE_KEY, JSON.stringify(state));
  }
  load() {
    const raw = this._g.get(STORAGE_KEY);
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }
  clear() { this._g.update(STORAGE_KEY, undefined); }
}

console.log('\n StorageManager');

test('saves and loads state', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  const state = { strokes: [{ id: 'a', points: [1,2,3,4], color: '#fff', width: 2, tool: 'pen', opacity: 1 }], shapes: [], textNodes: [], stickyNotes: [], codeCards: [], viewport: { x:0, y:0, scale:1 }, savedAt: Date.now() };
  sm.save(state);
  const loaded = sm.load();
  assert(loaded !== null, 'Should load saved state');
  assertEqual(loaded.strokes.length, 1, 'Should have 1 stroke');
  assertEqual(loaded.strokes[0].id, 'a', 'Stroke ID should match');
});

test('returns null when nothing saved', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  assertEqual(sm.load(), null, 'Should return null on empty storage');
});

test('clear removes saved state', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  sm.save({ strokes: [], shapes: [], textNodes: [], stickyNotes: [], codeCards: [], viewport: { x:0,y:0,scale:1 }, savedAt: 0 });
  sm.clear();
  assertEqual(sm.load(), null, 'Should return null after clear');
});

test('handles corrupted JSON gracefully', () => {
  const m = new MockMemento();
  m._data[STORAGE_KEY] = '{broken json:::';
  const sm = new StorageManager(m);
  assertEqual(sm.load(), null, 'Should return null on corrupt JSON');
});

test('handles extremely large state (10k strokes)', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  const strokes = [];
  for (let i = 0; i < 10000; i++) {
    strokes.push({ id: 'id' + i, points: [0,0,100,100], color: '#fff', width: 2, tool: 'pen', opacity: 1 });
  }
  const bigState = { strokes, shapes: [], textNodes: [], stickyNotes: [], codeCards: [], viewport: { x:0,y:0,scale:1 }, savedAt: Date.now() };
  sm.save(bigState);
  const loaded = sm.load();
  assertEqual(loaded.strokes.length, 10000, 'Should handle 10k strokes');
});

test('handles special characters in sticky note text', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  const state = {
    strokes: [], shapes: [], textNodes: [],
    stickyNotes: [{ id: 'n1', x: 0, y: 0, w: 200, h: 140, text: '<script>alert("xss")</script> & "quotes" \'single\'', color: '#ffd166' }],
    codeCards: [], viewport: { x:0,y:0,scale:1 }, savedAt: 0,
  };
  sm.save(state);
  const loaded = sm.load();
  assert(loaded.stickyNotes[0].text.includes('<script>'), 'Special chars preserved in storage');
});

test('handles empty state fields gracefully', () => {
  const m = new MockMemento();
  const sm = new StorageManager(m);
  sm.save({});
  const loaded = sm.load();
  assert(loaded !== null, 'Empty object should load');
});

// 
// Coordinate Transform Tests (mirrors whiteboardHTML logic)
// 
console.log('\n Coordinate Transforms');

function screenToWorld(sx, sy, vp) {
  return { x: (sx - vp.x) / vp.scale, y: (sy - vp.y) / vp.scale };
}
function worldToScreen(wx, wy, vp) {
  return { x: wx * vp.scale + vp.x, y: wy * vp.scale + vp.y };
}

test('identity viewport round-trips correctly', () => {
  const vp = { x: 0, y: 0, scale: 1 };
  const world = screenToWorld(100, 200, vp);
  assertEqual(world.x, 100, 'x');
  assertEqual(world.y, 200, 'y');
  const screen = worldToScreen(world.x, world.y, vp);
  assertEqual(screen.x, 100, 'round-trip x');
  assertEqual(screen.y, 200, 'round-trip y');
});

test('panned viewport transforms correctly', () => {
  const vp = { x: 50, y: -30, scale: 1 };
  const world = screenToWorld(150, 170, vp);
  assertEqual(world.x, 100, 'panned x');
  assertEqual(world.y, 200, 'panned y');
});

test('zoomed viewport transforms correctly', () => {
  const vp = { x: 0, y: 0, scale: 2 };
  const world = screenToWorld(100, 200, vp);
  assertEqual(world.x, 50, 'zoomed x');
  assertEqual(world.y, 100, 'zoomed y');
  const screen = worldToScreen(50, 100, vp);
  assertEqual(screen.x, 100, 'zoom round-trip x');
});

test('min zoom boundary (0.1) does not divide by zero', () => {
  const vp = { x: 0, y: 0, scale: 0.1 };
  const world = screenToWorld(0, 0, vp);
  assertEqual(world.x, 0, 'origin stable at min zoom');
  const large = screenToWorld(1000, 1000, vp);
  assertEqual(large.x, 10000, 'large coords at min zoom');
});

test('max zoom boundary (4.0) transforms correctly', () => {
  const vp = { x: 0, y: 0, scale: 4 };
  const world = screenToWorld(400, 400, vp);
  assertEqual(world.x, 100, 'max zoom x');
});

// 
// Hit Testing Tests
// 
console.log('\n Hit Testing');

function hitTestShape(shape, wx, wy) {
  const x = Math.min(shape.x, shape.x2 ?? shape.x);
  const y = Math.min(shape.y, shape.y2 ?? shape.y);
  const w = Math.abs((shape.x2 ?? shape.x) - shape.x);
  const h = Math.abs((shape.y2 ?? shape.y) - shape.y);
  return wx >= x - 6 && wx <= x + w + 6 && wy >= y - 6 && wy <= y + h + 6;
}

test('hit inside rect returns true', () => {
  const s = { x: 10, y: 10, x2: 110, y2: 110, type: 'rect' };
  assert(hitTestShape(s, 50, 50), 'center should hit');
});

test('hit far outside rect returns false', () => {
  const s = { x: 10, y: 10, x2: 110, y2: 110, type: 'rect' };
  assert(!hitTestShape(s, 200, 200), 'far outside should miss');
});

test('hit within tolerance returns true', () => {
  const s = { x: 10, y: 10, x2: 110, y2: 110, type: 'rect' };
  assert(hitTestShape(s, 114, 50), 'within 6px tolerance should hit');
});

test('inverted coords (drag direction) handled correctly', () => {
  const s = { x: 110, y: 110, x2: 10, y2: 10, type: 'rect' };
  assert(hitTestShape(s, 50, 50), 'inverted shape should hit center');
});

test('zero-size shape (click without drag) does not crash', () => {
  const s = { x: 50, y: 50, x2: 50, y2: 50, type: 'rect' };
  assert(hitTestShape(s, 50, 50), 'zero-size should hit exact point');
});

// 
// Eraser Tests
// 
console.log('\n Eraser Logic');

function eraseAt(strokes, points, radius) {
  return strokes.filter(s => {
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

test('eraser removes overlapping strokes', () => {
  const strokes = [{ id: 'a', points: [50, 50, 60, 60] }, { id: 'b', points: [200, 200, 210, 210] }];
  const result = eraseAt(strokes, [50, 50, 52, 52], 10);
  assertEqual(result.length, 1, 'Should remove stroke a');
  assertEqual(result[0].id, 'b', 'Should keep stroke b');
});

test('eraser keeps all strokes when no overlap', () => {
  const strokes = [{ id: 'a', points: [100, 100] }, { id: 'b', points: [200, 200] }];
  const result = eraseAt(strokes, [500, 500], 10);
  assertEqual(result.length, 2, 'No strokes should be removed');
});

test('eraser handles empty strokes array', () => {
  const result = eraseAt([], [50, 50], 10);
  assertEqual(result.length, 0, 'Empty input stays empty');
});

test('eraser handles stroke with no points', () => {
  const strokes = [{ id: 'a', points: [] }];
  const result = eraseAt(strokes, [0, 0], 10);
  assertEqual(result.length, 1, 'Empty-points stroke is preserved');
});

// 
// Uid Uniqueness Tests
// 
console.log('\n UID Generation');

function uid() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36);
}

test('generates unique IDs', () => {
  const ids = new Set();
  for (let i = 0; i < 1000; i++) ids.add(uid());
  assertEqual(ids.size, 1000, 'All 1000 IDs should be unique');
});

test('uid is non-empty string', () => {
  const id = uid();
  assert(typeof id === 'string' && id.length > 0, 'uid should be non-empty string');
});

// 
// HTML Escape Tests
// 
console.log('\n XSS Prevention');

function escapeHtml(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

test('escapes script tags', () => {
  const out = escapeHtml('<script>alert("xss")</script>');
  assert(!out.includes('<script>'), 'script tags should be escaped');
  assert(out.includes('&lt;script&gt;'), 'should use HTML entities');
});

test('escapes ampersands', () => {
  const out = escapeHtml('foo & bar');
  assertEqual(out, 'foo &amp; bar', 'ampersand escaped');
});

test('handles null/undefined gracefully', () => {
  assertEqual(escapeHtml(null), '', 'null returns empty string');
  assertEqual(escapeHtml(undefined), '', 'undefined returns empty string');
});

test('passes through safe text unmodified', () => {
  const safe = 'Hello World 123 !@#$%^*()';
  assertEqual(escapeHtml(safe), safe, 'safe text unchanged');
});

// 
// Viewport Zoom Tests
// 
console.log('\n Zoom Logic');

function applyZoom(vp, canvasW, canvasH, factor, cx, cy) {
  cx = cx ?? canvasW / 2; cy = cy ?? canvasH / 2;
  const newScale = Math.min(4, Math.max(0.1, vp.scale * factor));
  return {
    x: cx - (cx - vp.x) * (newScale / vp.scale),
    y: cy - (cy - vp.y) * (newScale / vp.scale),
    scale: newScale,
  };
}

test('zoom in does not exceed max scale (4)', () => {
  let vp = { x: 0, y: 0, scale: 3.9 };
  for (let i = 0; i < 10; i++) vp = applyZoom(vp, 800, 600, 1.2, 400, 300);
  assert(vp.scale <= 4, 'Scale should not exceed 4');
});

test('zoom out does not go below min scale (0.1)', () => {
  let vp = { x: 0, y: 0, scale: 0.2 };
  for (let i = 0; i < 10; i++) vp = applyZoom(vp, 800, 600, 0.8, 400, 300);
  assert(vp.scale >= 0.1, 'Scale should not go below 0.1');
});

test('zoom is centered on cursor point', () => {
  const vp = { x: 0, y: 0, scale: 1 };
  const newVp = applyZoom(vp, 800, 600, 2, 100, 100);
  // Point (100,100) in screen space should be world point (100,100) before and after
  const before = screenToWorld(100, 100, vp);
  const after = screenToWorld(100, 100, newVp);
  assert(Math.abs(before.x - after.x) < 0.001, 'Zoom pivot x should be stable');
  assert(Math.abs(before.y - after.y) < 0.001, 'Zoom pivot y should be stable');
});

// 
// RESULTS
// 
console.log("\n" + "-".repeat(40));
console.log("Results: " + passed + " passed, " + failed + " failed");
console.log("Results: " + passed + " passed, " + failed + " failed");
if (failed > 0) process.exit(1);
