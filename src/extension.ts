import * as pcp from 'promisify-child-process';
import * as vscode from 'vscode';
import * as commands from './commands';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import { extendMarkdownItWithMermaid } from './markdown';
import { setUpFerocity } from './setUp';
import { getHierarchyTree } from './tree/hierarchyTree';
import { getLayerTree } from './tree/layerTree';
import { FerocityTreeDataProvider } from './tree/tree';
import { getUniverseTree } from './tree/universeTree';

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

	const layerTreeDataProvider = new FerocityTreeDataProvider(() => getLayerTree(context.workspaceState.get('layer')));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.layer', layerTreeDataProvider));

	const hierarchyTreeDataProvider = new FerocityTreeDataProvider(() => getHierarchyTree(context.workspaceState.get('hierarchy')));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.hierarchy', hierarchyTreeDataProvider));

	const universeTreeDataProvider = new FerocityTreeDataProvider(() => getUniverseTree(context.workspaceState.get('universe')));
	vscode.window.registerTreeDataProvider('ferocity.universe', universeTreeDataProvider);

	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.layer.refresh',
		commands.layer.refresh(context, layerTreeDataProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.layer.showDependencyGraph',
		commands.layer.showDependencyGraph(context)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.hierarchy.refresh',
		commands.hierarchy.refresh(context, hierarchyTreeDataProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.universe.refresh',
		commands.universe.refresh(context, universeTreeDataProvider)
	));

	vscode.commands.executeCommand('ferocity.layer.refresh');
	vscode.commands.executeCommand('ferocity.hierarchy.refresh');
	vscode.commands.executeCommand('ferocity.universe.refresh');
}
