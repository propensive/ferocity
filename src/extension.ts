import { start } from 'repl';
import * as vscode from 'vscode';
import { startTreeView } from './treeView';

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	
	vscode.commands.registerCommand('fury.refreshLayer', () => {
		vscode.window.showInformationMessage('Layer refreshing');
	});

	startTreeView();
}
