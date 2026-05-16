import * as vscode from 'vscode';
import { WhiteboardPanel } from './WhiteboardPanel';
import { StorageManager } from './StorageManager';

export function activate(context: vscode.ExtensionContext) {
  const storageManager = new StorageManager(context.globalState);

  // Command: Open blank whiteboard
  context.subscriptions.push(
    vscode.commands.registerCommand('whiteboard.open', () => {
      WhiteboardPanel.createOrShow(context, storageManager, null);
    })
  );

  // Command: Open whiteboard pre-loaded with current file code
  context.subscriptions.push(
    vscode.commands.registerCommand('whiteboard.openWithCode', () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active editor found. Opening blank whiteboard.');
        WhiteboardPanel.createOrShow(context, storageManager, null);
        return;
      }
      const code = editor.document.getText();
      const fileName = editor.document.fileName.split(/[\\/]/).pop() ?? 'file';
      const language = editor.document.languageId;
      WhiteboardPanel.createOrShow(context, storageManager, { code, fileName, language });
    })
  );

  // Command: Force open a brand-new whiteboard (clears saved state)
  context.subscriptions.push(
    vscode.commands.registerCommand('whiteboard.newBoard', () => {
      storageManager.clear();
      WhiteboardPanel.forceNew(context, storageManager);
    })
  );
}

export function deactivate() {}
