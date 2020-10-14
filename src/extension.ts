import * as vscode from 'vscode';
import * as fury from './fury';
import { LayerItemsProvider, UniverseItemsProvider, LayerItem } from './treeView';
import { extendMarkdownItWithMermaid } from './markdown';
import { DependencyGraphContentProvider, dependencyGraphScheme } from './dependencyGraph';
import locateJavaHome from './locateJavaHome';
import installJava from './installJava';

function handleConnectionError(error: any) {
	vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

function installJavaIfNeeded(): Promise<string> {
	return new Promise((resolve, reject) => {
		locateJavaHome(vscode.workspace.getConfiguration("ferocity").get("javaHome"))
			.then(javaHome => resolve(javaHome))
			.catch(error => {
				console.log(error);
				vscode.window.withProgress(
					{
						location: vscode.ProgressLocation.Notification,
						title: `Installing Java (JDK 8), please wait...`,
						cancellable: true,
					},
					() => installJava("adopt@1.8").then(resolve).catch(reject)
				);
			});
	});
}

export function activate(context: vscode.ExtensionContext) {
	console.log('Fury extension is active.');
	console.log('Workspace root path: ' + vscode.workspace.rootPath);

	console.log('Installing Java');
	installJavaIfNeeded()
		.then(result => {
			console.log('Java installation succeeded: ' + result);
			vscode.window.showInformationMessage('Java (JDK 8) installed successfully');
		})
		.catch(error => {
			console.log('Java installation failed: ' + error);
			vscode.window.showErrorMessage('Java (JDK 8) installation failed');
		});

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
