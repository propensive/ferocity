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

	const universeItemsProvider = new UniverseItemsProvider();
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

	/**
	 * Webview example.
	 */
	let webviewPanel: vscode.WebviewPanel | undefined = undefined;
	vscode.commands.registerCommand('fury.example.webview', () => {
		webviewPanel = vscode.window.createWebviewPanel(
			'furyWebview',
			'Fury Webview',
			vscode.ViewColumn.One,
			{
				enableScripts: true
			}
		);

		webviewPanel.webview.html = getWebviewContent();
		webviewPanel.webview.onDidReceiveMessage(
			message => {
				switch (message.command) {
					case 'inverted':
						vscode.window.showInformationMessage('Counter inverted!');
						return;
				}
			},
			undefined,
			context.subscriptions
		);
	});
	vscode.commands.registerCommand('fury.example.invert', () => {
		if (!webviewPanel) {
			return;
		}
		webviewPanel.webview.postMessage({ command: 'invert' });
	});

	vscode.workspace.registerTextDocumentContentProvider(dependencyGraphScheme, new DependencyGraphContentProvider(context.workspaceState));

	vscode.commands.executeCommand('fury.layer.refresh');
	return extendMarkdownItWithMermaid();
}

function getWebviewContent() {
	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Cat Coding</title>
</head>
<body>
  <img src="https://media.giphy.com/media/JIX9t2j0ZTN9S/giphy.gif" width="300" onclick="stopCounting()" />
  <h1 id="counter">0</h1>

  <script>	
    const vscode = acquireVsCodeApi();
		const counter = document.getElementById('counter');

    let interval = 1;
		let count = 0;
		
    setInterval(() => {
      count += interval;
      counter.textContent = count;
		}, 100);

    window.addEventListener('message', event => {
      const message = event.data; 
      switch (message.command) {
        case 'invert':
				interval *= -1;
				
        vscode.postMessage({
          command: 'inverted'
        });
        break;
      }
    });
    function stopCounting() {
      interval = 0;
    }
  </script>
</body>
</html>`;
}