import { promisify } from 'util';
import * as vscode from 'vscode';
import * as fury from './fury';

class LayerItem extends vscode.TreeItem {
	constructor(public readonly label: string, readonly contextValue: string, readonly parentId?: string) {
		super(label, LayerItem.getCollapsibleState(contextValue));
		this.contextValue = contextValue;
		this.id = parentId ? `${parentId}/${label}` : label;
	}

	private static getCollapsibleState(contextValue: string) {
		if (['furyDependency', 'furySource'].includes(contextValue)) {
			return vscode.TreeItemCollapsibleState.None;
		} else {
			return vscode.TreeItemCollapsibleState.Collapsed;
		}
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
				return Promise.resolve(layer.projects.map(project => new LayerItem(project.name, 'furyProject', element.id)));
			case 'furyProject': {
				const projectName = names?.pop();
				const project = layer.projects.find(project => project.name === projectName);
				return project ? Promise.resolve(project.modules.map(module => new LayerItem(module.name, 'furyModule', element.id))) : Promise.resolve([]);
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
				return module ? Promise.resolve(module.dependencies.map(dependency => new LayerItem(dependency, 'furyDependency', element.id))) : Promise.resolve([]);
			}
			case 'furySources': {
				names?.pop(); // skip 'sources'
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				return module ? Promise.resolve(module.sources.map(source => new LayerItem(source, 'furySource', element.id))) : Promise.resolve([]);
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
