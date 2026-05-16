import * as vscode from 'vscode';
import { StorageManager, WhiteboardState } from './StorageManager';
import { getWhiteboardHTML } from './whiteboardHTML';

interface CodeContext {
  code: string;
  fileName: string;
  language: string;
}

export class WhiteboardPanel {
  public static currentPanel: WhiteboardPanel | undefined;
  private static readonly viewType = 'whiteboard';

  private readonly _panel: vscode.WebviewPanel;
  private _disposables: vscode.Disposable[] = [];
  private _storageManager: StorageManager;

  private constructor(
    panel: vscode.WebviewPanel,
    context: vscode.ExtensionContext,
    storageManager: StorageManager,
    codeContext: CodeContext | null
  ) {
    this._panel = panel;
    this._storageManager = storageManager;

    this._panel.webview.html = getWhiteboardHTML(this._panel.webview, context.extensionUri);

    // Wait for webview to signal ready, then send initial state
    this._panel.webview.onDidReceiveMessage(
      (msg) => this._handleMessage(msg, codeContext),
      null,
      this._disposables
    );

    this._panel.onDidDispose(() => this._dispose(), null, this._disposables);

    // React to VS Code theme changes
    this._disposables.push(
      vscode.window.onDidChangeActiveColorTheme((theme) => {
        this._panel.webview.postMessage({
          type: 'themeChange',
          isDark: theme.kind !== vscode.ColorThemeKind.Light,
        });
      })
    );
  }

  public static createOrShow(
    context: vscode.ExtensionContext,
    storageManager: StorageManager,
    codeContext: CodeContext | null
  ) {
    const column = vscode.ViewColumn.Beside;

    if (WhiteboardPanel.currentPanel) {
      WhiteboardPanel.currentPanel._panel.reveal(column);
      if (codeContext) {
        WhiteboardPanel.currentPanel._panel.webview.postMessage({
          type: 'injectCode',
          ...codeContext,
        });
      }
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      WhiteboardPanel.viewType,
      'Whiteboard',
      column,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'media')],
      }
    );

    WhiteboardPanel.currentPanel = new WhiteboardPanel(panel, context, storageManager, codeContext);
  }

  public static forceNew(
    context: vscode.ExtensionContext,
    storageManager: StorageManager
  ) {
    if (WhiteboardPanel.currentPanel) {
      WhiteboardPanel.currentPanel._dispose();
    }
    WhiteboardPanel.createOrShow(context, storageManager, null);
  }

  private _handleMessage(message: { type: string; [key: string]: unknown }, codeContext: CodeContext | null) {
    switch (message.type) {
      case 'ready': {
        // Webview is ready — send saved state + config
        const savedState = this._storageManager.load();
        const config = vscode.workspace.getConfiguration('whiteboard');
        const isDark = vscode.window.activeColorTheme.kind !== vscode.ColorThemeKind.Light;

        this._panel.webview.postMessage({
          type: 'init',
          savedState,
          theme: isDark ? 'dark' : 'light',
          defaultTheme: config.get<string>('theme', 'dark'),
        });

        if (codeContext) {
          setTimeout(() => {
            this._panel.webview.postMessage({
              type: 'injectCode',
              ...codeContext,
            });
          }, 300);
        }
        break;
      }

      case 'saveState': {
        const state = message.state as WhiteboardState;
        if (state) {
          this._storageManager.save(state);
        }
        break;
      }

      case 'clearBoard': {
        this._storageManager.clear();
        break;
      }

      case 'showInfo': {
        vscode.window.showInformationMessage(message.text as string);
        break;
      }

      case 'showError': {
        vscode.window.showErrorMessage(message.text as string);
        break;
      }

      case 'copyToClipboard': {
        vscode.env.clipboard.writeText(message.text as string).then(() => {
          vscode.window.showInformationMessage('Copied to clipboard!');
        });
        break;
      }

      case 'openFile': {
        // If user clicks a code card header, jump to that file in editor
        vscode.workspace.findFiles(`**/${message.fileName}`, undefined, 1).then((uris) => {
          if (uris.length > 0) {
            vscode.window.showTextDocument(uris[0]);
          } else {
            vscode.window.showWarningMessage(`File not found in workspace: ${message.fileName}`);
          }
        });
        break;
      }
    }
  }

  private _dispose() {
    WhiteboardPanel.currentPanel = undefined;
    this._panel.dispose();
    while (this._disposables.length) {
      const d = this._disposables.pop();
      if (d) d.dispose();
    }
  }
}
