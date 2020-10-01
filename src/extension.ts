import * as vscode from 'vscode';
import * as fury from './fury';
import { FuryItemsProvider } from './furyItems';

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath);

	const furyItemsProvider = new FuryItemsProvider(context.workspaceState);

	vscode.window.registerTreeDataProvider('furyItems', furyItemsProvider);

	vscode.commands.registerCommand('fury.layer.refresh', () => {
		fury.layer.get(vscode.workspace.rootPath).then(layer => context.workspaceState.update('layer', layer));
		furyItemsProvider.refresh();
	});
	vscode.commands.registerCommand('fury.layer.addProject', () => {
		vscode.window.showInputBox();
		vscode.window.showInformationMessage('Layer / Add Project');
	});
	vscode.commands.registerCommand('fury.module.addDependency', () => {
		vscode.window.showQuickPick(['dependency1', 'dependency2', 'dependency3']);
		vscode.window.showInformationMessage('Module / Add Dependency');
	});

	vscode.commands.executeCommand('fury.layer.refresh');
}
