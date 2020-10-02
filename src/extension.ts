import * as vscode from 'vscode';
import * as fury from './fury';
import { LayerItemsProvider, UniverseItemsProvider } from './treeView';

function handleConnectionError(error: any) {
	vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath);

	const layerItemsProvider = new LayerItemsProvider(context.workspaceState);
	const universeItemsProvider = new UniverseItemsProvider();

	vscode.window.registerTreeDataProvider('furyLayerItems', layerItemsProvider);
	vscode.window.registerTreeDataProvider('furyUniverseItems', universeItemsProvider);

	vscode.commands.registerCommand('fury.layer.refresh', () => {
		fury.layer.get(vscode.workspace.rootPath)
			.then(layer => context.workspaceState.update('layer', layer))
			.catch(handleConnectionError);
		layerItemsProvider.refresh();
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
