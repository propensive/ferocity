import * as vscode from 'vscode';
import * as os from 'os';
import * as path from 'path';
import * as pcp from 'promisify-child-process';
import * as fury from './fury';
import { LayerItemsProvider, UniverseItemsProvider, LayerItem } from './treeView';
import { extendMarkdownItWithMermaid } from './markdown';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import installJavaIfNeeded from './installJava';
import installFuryIfNeeded from './installFury';
import { setUpFerocity } from './setUp';

const furyBin = path.join(os.homedir(), '.ferocity', 'fury', 'bin', 'fury');

function handleConnectionError(error: any) {
	console.log('Connection error: ' + error);
	vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

function setUpFerocity(): Promise<void> {
	return new Promise<void>((resolve, reject) => {
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: `Setting up Ferocity`,
			cancellable: true,
		}, () => Promise.all([installJavaIfNeeded(), installFuryIfNeeded()])
			.then(result => {
				const [javaPath, furyPath] = result;
				console.log('Java installation succeeded: ' + javaPath);
				console.log('Fury installation succeeded: ' + furyPath);
				resolve();
			})
			.catch(error => {
				console.log('Setting up failed: ' + error);
				reject();
			}));
	});
}

function runFerocity(context: vscode.ExtensionContext) {

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
		const layer: fury.layer.Layer | undefined = context.workspaceState.get('layer');
		const project: fury.layer.Project | undefined = layer ? layer.projects.find(project => project.name === projectItem.label) : undefined;
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
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath);

	setUpFerocity()
		.then(() => {
			vscode.window.showInformationMessage('Ferocity set up succeeded');
		})
		// .then(() => pcp.exec(`${furyBin} about`))
		.then(() => pcp.exec('fury about'))
		.then(() => runFerocity(context))
		.catch(() => vscode.window.showErrorMessage('Ferocity set up failed'));

	return extendMarkdownItWithMermaid();
}
