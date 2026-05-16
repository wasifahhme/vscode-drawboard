import * as vscode from 'vscode';

const STORAGE_KEY = 'whiteboard.savedState';

export interface WhiteboardState {
  strokes: StrokeData[];
  shapes: ShapeData[];
  textNodes: TextNodeData[];
  stickyNotes: StickyNoteData[];
  codeCards: CodeCardData[];
  viewport: ViewportData;
  savedAt: number;
}

export interface StrokeData {
  id: string;
  points: number[];
  color: string;
  width: number;
  tool: 'pen' | 'highlighter' | 'eraser';
  opacity: number;
}

export interface ShapeData {
  id: string;
  type: 'rect' | 'circle' | 'arrow' | 'line' | 'diamond';
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  fill: string;
  strokeWidth: number;
  label?: string;
}

export interface TextNodeData {
  id: string;
  x: number;
  y: number;
  text: string;
  fontSize: number;
  color: string;
  bold: boolean;
}

export interface StickyNoteData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  color: string;
}

export interface CodeCardData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  code: string;
  language: string;
  fileName: string;
  minimized: boolean;
}

export interface ViewportData {
  offsetX: number;
  offsetY: number;
  scale: number;
}

export class StorageManager {
  constructor(private readonly globalState: vscode.Memento) {}

  save(state: WhiteboardState): void {
    const config = vscode.workspace.getConfiguration('whiteboard');
    if (config.get<boolean>('autosave', true)) {
      this.globalState.update(STORAGE_KEY, JSON.stringify(state));
    }
  }

  load(): WhiteboardState | null {
    const raw = this.globalState.get<string>(STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as WhiteboardState;
    } catch {
      return null;
    }
  }

  clear(): void {
    this.globalState.update(STORAGE_KEY, undefined);
  }
}
