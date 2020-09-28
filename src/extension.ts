import { IncomingHttpStatusHeader } from 'http2';
import * as vscode from 'vscode';

class FuryCommand extends vscode.TreeItem {
	constructor(public label: string, public extendible: boolean) {
		super(label, extendible ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None);
	}
}

class ModuleCommandsProvider implements vscode.TreeDataProvider<FuryCommand> {
	constructor(private workspaceRoot: string | undefined) { }

	getTreeItem(element: FuryCommand): FuryCommand {
		return element;
	}

	getChildren(element: FuryCommand): Thenable<FuryCommand[]> {
		if (element) {
			return Promise.resolve(["add", "list", "remove", "selecet", "update"].map(command => new FuryCommand(command, false)));
		} else {
			return Promise.resolve([new FuryCommand("module", true)]);
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log("Fury extension is active.");

	const moduleCommandsProvider = new ModuleCommandsProvider(vscode.workspace.rootPath);
	const modulesTreeView = vscode.window.createTreeView('furyCommands', {
		treeDataProvider: moduleCommandsProvider,
	});

	const disposable = vscode.commands.registerCommand('fury.helloWorld', () => {
		vscode.window.showInformationMessage('Hello World from Fury VSCode extension!');
	});

	context.subscriptions.push(disposable);
}
