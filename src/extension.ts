import * as vscode from 'vscode';
import * as pcp from 'promisify-child-process';
import * as commands from './commands';
import { LayerItemsProvider, UniverseItemsProvider, HierarchyItemsProvider } from './treeView';
import { extendMarkdownItWithMermaid } from './markdown';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import { setUpFerocity } from './setUp';

export function activate(context: vscode.ExtensionContext) {
	console.log('Ferociy extension has been activated.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath + '.');

	setUpFerocity()
		.then(() => {
			vscode.window.showInformationMessage('Ferocity set up succeeded.');
		})
		// .then(() => pcp.exec(`${fury.furyBin} about`))
		.then(() => pcp.exec('fury about'))
		.then(() => runFerocity(context))
		.catch(() => vscode.window.showErrorMessage('Ferocity set up failed.'));

	return extendMarkdownItWithMermaid();
}

function runFerocity(context: vscode.ExtensionContext) {
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(
		dependencyGraphScheme,
		new DependencyGraphContentProvider(context.workspaceState)
	));

	const layerItemsProvider = new LayerItemsProvider(context.workspaceState);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.layer', layerItemsProvider));

	const hierarchyItemsProvider = new HierarchyItemsProvider(context.workspaceState);
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.hierarchy', hierarchyItemsProvider));

	const universeItemsProvider = new UniverseItemsProvider(context.workspaceState);
	vscode.window.registerTreeDataProvider('ferocity.universe', universeItemsProvider);

	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.layer.refresh',
		commands.layer.refresh(context, layerItemsProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.layer.showDependencyGraph',
		commands.layer.showDependencyGraph(context)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.hierarchy.refresh',
		commands.hierarchy.refresh(context, hierarchyItemsProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.universe.refresh',
		commands.universe.refresh(context, universeItemsProvider)
	));

	vscode.commands.executeCommand('ferocity.layer.refresh');
	vscode.commands.executeCommand('ferocity.hierarchy.refresh');
	vscode.commands.executeCommand('ferocity.universe.refresh');
}
