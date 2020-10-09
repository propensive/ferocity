import * as vscode from 'vscode';
import * as fury from './fury';
import { LayerItemsProvider, UniverseItemsProvider, LayerItem } from './treeView';
import { extendMarkdownItWithMermaid } from './markdown';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';

function handleConnectionError(error: any) {
	vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath);

	const layerItemsProvider = new LayerItemsProvider(context.workspaceState);
	vscode.window.registerTreeDataProvider('furyLayerItems', layerItemsProvider);

	const universeItemsProvider = new UniverseItemsProvider(context.workspaceState);
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
	vscode.commands.registerCommand('fury.project.showDependencyGraph', async (projectItem: LayerItem) => {
		const layer: fury.Layer | undefined = context.workspaceState.get('layer');
		const project: fury.Project | undefined = layer ? layer.projects.find(project => project.name === projectItem.label) : undefined;
		const dependencies = project ? fury.buildDependencyGraph(project) : [];
		context.workspaceState.update('dependencies', dependencies);

		const uri = vscode.Uri.parse('fury:' + 'Dependency Graph');
		await vscode.workspace.openTextDocument(uri);
		vscode.commands.executeCommand('markdown.showPreview', uri);
	});
	vscode.commands.registerCommand('fury.universe.refresh', () => {
		fury.universe.get(vscode.workspace.rootPath)
			.then(universe => context.workspaceState.update('universe', universe))
			.catch(handleConnectionError);
		universeItemsProvider.refresh();
	});

	vscode.workspace.registerTextDocumentContentProvider(dependencyGraphScheme, new DependencyGraphContentProvider(context.workspaceState));

	vscode.commands.executeCommand('fury.layer.refresh');
	vscode.commands.executeCommand('fury.universe.refresh');

	return extendMarkdownItWithMermaid();
}
