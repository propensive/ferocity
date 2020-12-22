import * as pcp from 'promisify-child-process';
import * as vscode from 'vscode';
import { LanguageClient } from 'vscode-languageclient';
import * as commands from './commands';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import * as lsp from './lsp';
import { extendMarkdownItWithMermaid } from './markdown';
import { furyBin } from './settings';
import { setUpFerocity } from './setUp';
import * as state from './state';
import { ferocityScheme, FerocityTextDocumentContentProvider } from './textDocumentContentProvider';
import { createHierarchyTree } from './tree/hierarchyTree';
import { createLayerTree, LayerTreeDataProvider } from './tree/layerTree';
import { FerocityTreeDataProvider } from './tree/tree';
import { createUniverseTree } from './tree/universeTree';

function runFerocity(context: vscode.ExtensionContext, lspClient: LanguageClient) {
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
		'ferocity.initializeLayer',
		commands.initializeLayer()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.refreshLayer',
		commands.refreshLayer(context, layerTreeDataProvider)
	));;
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.addProject',
		commands.addProject()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.removeProject',
		commands.removeProject()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.showDependencyGraph',
		commands.showDependencyGraph(context)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.addModule',
		commands.addModule()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.buildModule',
		commands.buildModule()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.removeModule',
		commands.removeModule()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.updateModuleCompiler',
		commands.updateModuleCompiler()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.updateModuleName',
		commands.updateModuleName()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.updateModuleType',
		commands.updateModuleType(lspClient)
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.addSource',
		commands.addSource()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.addBinary',
		commands.addBinary()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.removeSource',
		commands.removeSource()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.removeBinary',
		commands.removeBinary()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.revealSource',
		commands.revealSource()
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
		'ferocity.openFile',
		commands.openFile()
	));
	context.subscriptions.push(vscode.commands.registerCommand(
		'ferocity.revealProject',
		commands.revealProject(layerTreeDataProvider, layerTreeView)
	));

	vscode.commands.executeCommand('ferocity.refreshLayer');
	vscode.commands.executeCommand('ferocity.refreshHierarchy');
	vscode.commands.executeCommand('ferocity.refreshUniverse');
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Ferociy extension has been activated.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath + '.');

	console.log('Running LSP client...');
	const lspClient = lsp.createClient(context);
	context.subscriptions.push(lspClient.start());

	lspClient
		.onReady()
		.then(() => {
			console.log('LSP client is ready.'); // @TODO: it never is
			vscode.commands.executeCommand('setContext', 'ferocity.initialized', false)
				.then(() => context.workspaceState.update(state.layerKey, undefined))
				.then(() => context.workspaceState.update(state.hierarchyKey, undefined))
				.then(() => context.workspaceState.update(state.universeKey, undefined))
				.then(() => setUpFerocity()
					.then(() => {
						vscode.window.showInformationMessage('Ferocity set up successfully.');
					})
					.catch((error: string) => {
						console.log('Ferocity set up failed. Error: ' + error);
						vscode.window.showErrorMessage('Ferocity set up failed.');
					})
					.then(() => pcp.exec(`${furyBin} about`))
					.then(() => runFerocity(context, lspClient))
					.then(() => {
						vscode.window.showInformationMessage('Ferocity run successfully.');
					})
					.catch((error: string) => {
						console.log('Ferocity unable to run Ferocity. Error: ' + error);
						vscode.window.showErrorMessage('Unable to run Ferocity.');
					}));
		})
		.catch(console.log);

	return extendMarkdownItWithMermaid();
}