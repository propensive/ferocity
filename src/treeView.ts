import * as vscode from 'vscode';
import * as fury from './fury';
import * as path from 'path';

export class LayerItem extends vscode.TreeItem {
	constructor(public readonly label: string, readonly contextValue: string, readonly parentId?: string) {
		super(label, LayerItem.getCollapsibleState(contextValue));
		this.id = parentId ? `${parentId}/${label}` : label;
		this.contextValue = contextValue;
	}

	private static getCollapsibleState(contextValue: string) {
		if (['furyDependency', 'furySource', 'furyBinary'].includes(contextValue)) {
			return vscode.TreeItemCollapsibleState.None;
		} else {
			return vscode.TreeItemCollapsibleState.Collapsed;
		}
	}
}

function makeIconPath(iconName: string) {
	return {
		'dark': path.join(__filename, '..', '..', 'media', 'icons', 'dark', iconName + '.svg'),
		'light': path.join(__filename, '..', '..', 'media', 'icons', 'light', iconName + '.svg')
	};
}

function makeLayer(layerName: string) {
	const layerItem = new LayerItem(layerName, 'furyLayer');
	layerItem.iconPath = makeIconPath('versions');
	return layerItem;
}

function makeProject(projectName: string, elementId?: string): LayerItem {
	const layerItem = new LayerItem(projectName, 'furyProject', elementId);
	layerItem.iconPath = makeIconPath('circuit-board');
	return layerItem;
}

function makeModule(moduleName: string, elementId?: string): LayerItem {
	const layerItem = new LayerItem(moduleName, 'furyModule', elementId);
	layerItem.iconPath = makeIconPath('circle-outline');
	return layerItem;
}

function makeDependency(dependencyName: string, elementId?: string): LayerItem {
	const layerItem = new LayerItem(dependencyName, 'furyDependency', elementId);
	layerItem.iconPath = makeIconPath('link');
	return layerItem;
}

function makeSource(source: fury.Source, elementId?: string): LayerItem {
	const makeSourceIconPath = (source: fury.Source) => source.isLocal ? makeIconPath('file-symlink-directory') : makeIconPath('repo');

	const layerItem = new LayerItem(source.id, 'furySource', elementId);
	layerItem.iconPath = makeSourceIconPath(source);
	return layerItem;
}

function makeBinary(binaryName: string, elementId?: string) {
	const layerItem = new LayerItem(binaryName, 'furyBinary', elementId);
	layerItem.iconPath = makeIconPath('library');
	return layerItem;
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
			return Promise.resolve([makeLayer(layer.name)]);
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
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				if (!module) {
					return Promise.resolve([]);
				} else {
					const dependencies = module.dependencies.map(dependency => makeDependency(dependency, element.id));
					const sources = module.sources.map(source => makeSource(source, element.id));
					const binaries = module.binaries.map(binary => makeBinary(binary, element.id));
					return Promise.resolve(dependencies.concat(sources).concat(binaries));
				}
			}
			default:
				return Promise.resolve([]);
		}
	}
}



export class UniverseItemsProvider implements vscode.TreeDataProvider<vscode.TreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<vscode.TreeItem | undefined> = new vscode.EventEmitter<vscode.TreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<vscode.TreeItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceState: vscode.Memento) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: vscode.TreeItem): vscode.TreeItem {
		return element;
	}

	getChildren(element: vscode.TreeItem): Thenable<vscode.TreeItem[]> {
		const universe: fury.Universe | undefined = this.workspaceState.get('universe');
		if (!universe) {
			return Promise.resolve([]);
		}

		if (!element) {
			return Promise.resolve(makeUniverse(universe));
		} else {
			return Promise.resolve([]);
		}

		function makeUniverse(universe: fury.Universe): vscode.TreeItem[] {
			return universe.projects.map(projectName => new vscode.TreeItem(projectName));
		}
	}
}