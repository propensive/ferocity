import * as vscode from 'vscode';
import * as fury from './fury';

class LayerItem extends vscode.TreeItem {
	constructor(public readonly label: string, readonly contextValue: string, readonly parentId?: string, command?: vscode.Command) {
		super(label, LayerItem.getCollapsibleState(contextValue));
		this.id = parentId ? `${parentId}/${label}` : label;
		this.contextValue = contextValue;
		this.command = command;
	}

	private static getCollapsibleState(contextValue: string) {
		if (['furyDependency', 'furySource'].includes(contextValue)) {
			return vscode.TreeItemCollapsibleState.None;
		} else {
			return vscode.TreeItemCollapsibleState.Collapsed;
		}
	}
}

function makeProject(projectName: string, elementId?: string): LayerItem {
	return new LayerItem(projectName, 'furyProject', elementId);
}

function makeModule(moduleName: string, elementId?: string): LayerItem {
	return new LayerItem(moduleName, 'furyModule', elementId);
}

function makeDependency(dependencyName: string, elementId?: string): LayerItem {
	return new LayerItem(dependencyName, 'furyDependency', elementId);
}

function makeSource(source: fury.Source, elementId?: string): LayerItem {
	const makeRevealCommand = (source: string) => ({
		'title': 'Reveal',
		'command': 'revealInExplorer',
		'arguments': [vscode.Uri.file(vscode.workspace.rootPath + '/' + source)]
	});
	if (source.type === fury.SourceType.Local) {
		return new LayerItem(source.directory, 'furySource', elementId, makeRevealCommand(source.directory));
	} else {
		return new LayerItem(source.directory, 'furySource', elementId);
	}
}

export class LayerItemsProvider implements vscode.TreeDataProvider<LayerItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<LayerItem | undefined> = new vscode.EventEmitter<LayerItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<LayerItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceState: vscode.Memento) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: LayerItem): LayerItem {
		return element;
	}

	getChildren(element: LayerItem): Thenable<LayerItem[]> {
		const layer: fury.Layer | undefined = this.workspaceState.get('layer');
		if (!layer) {
			return Promise.resolve([]);
		}

		if (!element) {
			return Promise.resolve([new LayerItem(layer.name, 'furyLayer')]);
		}

		const names = element.id?.split('/');
		switch (element.contextValue) {
			case 'furyLayer':
				return Promise.resolve(layer.projects.map(project => makeProject(project.name, element.id)));
			case 'furyProject': {
				const projectName = names?.pop();
				const project = layer.projects.find(project => project.name === projectName);
				return project ? Promise.resolve(project.modules.map(module => makeModule(module.name, element.id))) : Promise.resolve([]);
			}
			case 'furyModule': {
				return Promise.resolve([
					new LayerItem('dependencies', 'furyDependencies', element.id),
					new LayerItem('sources', 'furySources', element.id)
				]);
			}
			case 'furyDependencies': {
				names?.pop(); // skip 'dependencies'
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				return module ? Promise.resolve(module.dependencies.map(dependency => makeDependency(dependency, element.id))) : Promise.resolve([]);
			}
			case 'furySources': {
				names?.pop(); // skip 'sources'
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				return module ? Promise.resolve(module.sources.map(source => makeSource(source, element.id))) : Promise.resolve([]);
			}
			default:
				return Promise.resolve([]);
		}
	}
}

export class UniverseItemsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		return Promise.resolve([]);
	}
}
