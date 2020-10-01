import * as vscode from 'vscode';
import * as fury from './fury';

class FuryItem extends vscode.TreeItem {
	constructor(public readonly label: string, readonly contextValue: string, readonly parentId?: string) {
		super(label, FuryItem.getCollapsibleState(contextValue));
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

export class FuryItemsProvider implements vscode.TreeDataProvider<FuryItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FuryItem | undefined> = new vscode.EventEmitter<FuryItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FuryItem | undefined> = this._onDidChangeTreeData.event;

	constructor(private workspaceState: vscode.Memento) { }

	refresh(): void {
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: FuryItem): FuryItem {
		return element;
	}

	getChildren(element: FuryItem): Thenable<FuryItem[]> {
		const layer: fury.Layer | undefined = this.workspaceState.get('layer');
		if (!layer) {
			return Promise.resolve([]);
		}

		if (!element) {
			return Promise.resolve([new FuryItem(layer.name, 'furyLayer')]);
		}

		const names = element.id?.split('/');
		switch (element.contextValue) {
			case 'furyLayer':
				return Promise.resolve(layer.projects.map(project => new FuryItem(project.name, 'furyProject', element.id)));
			case 'furyProject': {
				const projectName = names?.pop();
				const project = layer.projects.find(project => project.name === projectName);
				return project ? Promise.resolve(project.modules.map(module => new FuryItem(module.name, 'furyModule', element.id))) : Promise.resolve([]);
			}
			case 'furyModule': {
				return Promise.resolve([
					new FuryItem('dependencies', 'furyDependencies', element.id),
					new FuryItem('sources', 'furySources', element.id)
				]);
			}
			case 'furyDependencies': {
				names?.pop(); // skip 'dependencies'
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				return module ? Promise.resolve(module.dependencies.map(dependency => new FuryItem(dependency, 'furyDependency', element.id))) : Promise.resolve([]);
			}
			case 'furySources': {
				names?.pop(); // skip 'sources'
				const moduleName = names?.pop();
				const projectName = names?.pop();
				const module = layer.projects.find(project => project.name === projectName)?.modules.find(module => module.name === moduleName);
				return module ? Promise.resolve(module.sources.map(source => new FuryItem(source, 'furySource', element.id))) : Promise.resolve([]);
			}
			default:
				return Promise.resolve([]);
		}
	}
}
