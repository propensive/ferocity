import * as vscode from 'vscode';
import * as fs from 'fs';

export const ferocityScheme = 'ferocity';

export class FerocityTextDocumentContentProvider implements vscode.TextDocumentContentProvider {
  provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    return new Promise((resolve, reject) => {
      fs.readFile(uri.path, 'utf8', (error, content) => {
        if (error) {
          console.log(`Unable to open the file: ${uri.path}. Error: ${error}`);
          vscode.window.showErrorMessage('Unable to open the file');
          reject('Unable to open the file.');
        } else {
          resolve(content);
        }
      });
      return uri.path;
    });
  }
};