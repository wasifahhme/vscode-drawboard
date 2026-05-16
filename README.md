# ⬜ Whiteboard for VS Code

A fully-featured, in-editor whiteboard — sketch diagrams, dry-run logic, jot ideas, and annotate code without ever leaving VS Code.

## Features

- **Freehand drawing** — pen, highlighter, and eraser tools with adjustable stroke width
- **Shapes** — rectangles, circles, diamonds, arrows, lines, and triangles
- **Text** — click-to-place text nodes anywhere on the canvas
- **Sticky notes** — color-coded draggable notes with editable text
- **Code cards** — import your current file's code directly onto the whiteboard as a draggable, editable card
- **Infinite canvas** — pan with Alt+drag or the pan tool; zoom with scroll wheel
- **Undo/Redo** — full history with Ctrl+Z / Ctrl+Y (up to 60 steps)
- **Export** — save the board as a PNG with one click
- **Auto-save** — state is preserved between VS Code sessions automatically
- **Theme sync** — follows your VS Code dark/light theme

## Usage

| Action | How |
|---|---|
| Open blank whiteboard | `Ctrl+Shift+W` / Command Palette → **Whiteboard: Open Whiteboard** |
| Open with current file | `Ctrl+Shift+Alt+W` / editor title bar icon |
| New board (clear saved state) | Command Palette → **Whiteboard: New Whiteboard** |
| Pan | Hold `Alt` and drag, or press `Space` to switch to pan tool |
| Zoom | Mouse wheel |
| Add sticky note | Click 📝 in toolbar, or right-click canvas |
| Add code card | Click 💻 in toolbar, or right-click canvas |

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `P` | Pen tool |
| `H` | Highlighter tool |
| `E` | Eraser tool |
| `S` | Select tool |
| `T` | Text tool |
| `R` | Shape tool |
| `Space` | Pan tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `Ctrl+S` | Force save |
| `Delete` | Delete selected shape |

## Settings

| Setting | Default | Description |
|---|---|---|
| `whiteboard.theme` | `dark` | Default theme (`dark` / `light`) |
| `whiteboard.autosave` | `true` | Auto-save state between sessions |

## License

MIT
