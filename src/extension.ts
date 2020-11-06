import * as pcp from 'promisify-child-process';
import * as vscode from 'vscode';
import * as commands from './commands';
import * as state from './state';
import { FerocityTextDocumentContentProvider, ferocityScheme } from './textDocumentContentProvider';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import { extendMarkdownItWithMermaid } from './markdown';
import { setUpFerocity } from './setUp';
import { getHierarchyTree as createHierarchyTree } from './tree/hierarchyTree';
import { LayerTreeDataProvider, getLayerTree as createLayerTree } from './tree/layerTree';
import { FerocityTreeDataProvider } from './tree/tree';
import { getUniverseTree as createUniverseTree } from './tree/universeTree';

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
		ferocityScheme,
		new FerocityTextDocumentContentProvider())
	);
	context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider(
		dependencyGraphScheme,
		new DependencyGraphContentProvider(context.workspaceState)
	));

	const layerTreeDataProvider = new LayerTreeDataProvider(() => createLayerTree(context.workspaceState.get(state.layerKey)));
	const layerTreeView = vscode.window.createTreeView('ferocity.layer', { treeDataProvider: layerTreeDataProvider });

	const hierarchyTreeDataProvider = new FerocityTreeDataProvider(() => createHierarchyTree(context.workspaceState.get(state.hierarchyKey)));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.hierarchy', hierarchyTreeDataProvider));

	const universeTreeDataProvider = new FerocityTreeDataProvider(() => createUniverseTree(context.workspaceState.get(state.universeKey)));
	context.subscriptions.push(vscode.window.registerTreeDataProvider('ferocity.universe', universeTreeDataProvider));

	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.refreshLayer',
		commands.refreshLayer(context, layerTreeDataProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.refreshHierarchy',
		commands.refreshHierarchy(context, hierarchyTreeDataProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.refreshUniverse',
		commands.refreshUniverse(context, universeTreeDataProvider)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.showDependencyGraph',
		commands.showDependencyGraph(context)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.revealProject',
		commands.revealProject(layerTreeDataProvider, layerTreeView)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.openFile',
		commands.openFile()
	));

	vscode.commands.executeCommand('ferocity.refreshLayer');
	vscode.commands.executeCommand('ferocity.refreshHierarchy');
	vscode.commands.executeCommand('ferocity.refreshUniverse');
}
