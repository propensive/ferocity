import * as vscode from 'vscode';
import { startTreeView } from './treeView';

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	
	vscode.commands.registerCommand('fury.layer.refresh', () => {
		vscode.window.showInformationMessage('Layer / Refresh');
	});
	vscode.commands.registerCommand('fury.layer.addProject', () => {
		vscode.window.showInputBox();
		vscode.window.showInformationMessage('Layer / Add Project');
	});
	vscode.commands.registerCommand('fury.module.addDependency', () => {
		vscode.window.showQuickPick(['dependency1', 'dependency2', 'dependency3']);
		vscode.window.showInformationMessage('Module / Add Dependency');
	});

	startTreeView();
}
