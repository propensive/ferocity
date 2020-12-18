import * as path from 'path';
import * as vscode from 'vscode';

export class FerocityTreeItem extends vscode.TreeItem {
	public readonly id: string;
	children: FerocityTreeItem[] = [];

	constructor(public readonly label: string, collapsible: boolean, public readonly contextValue: string, public readonly parent?: FerocityTreeItem) {
		super(label);
		this.id = parent ? parent.id + '.' + label : label;
		this.collapsibleState = collapsible ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
		this.contextValue = contextValue;
	}
}

export class FerocityTreeDataProvider implements vscode.TreeDataProvider<FerocityTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FerocityTreeItem | undefined> = new vscode.EventEmitter<FerocityTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FerocityTreeItem | undefined> = this._onDidChangeTreeData.event;

	private treeItems: FerocityTreeItem[];

	constructor(private readonly createTreeItems: () => FerocityTreeItem[]) {
		this.treeItems = this.createTreeItems();
	}

	refresh(): void {
		this.treeItems = this.createTreeItems();
		this._onDidChangeTreeData.fire(undefined);
	}

	getTreeItem(element: FerocityTreeItem): FerocityTreeItem {
		return element;
}

	getChildren(element: FerocityTreeItem): Thenable<FerocityTreeItem[]> {
		if (!element) {
			return Promise.resolve(this.treeItems);
		}
		return Promise.resolve(element.children);
	}

	getParent?(element: FerocityTreeItem): vscode.ProviderResult<FerocityTreeItem> {
		return element.parent ? Promise.resolve(element.parent) : undefined;
	}

	getTreeItems(): FerocityTreeItem[] {
		return this.treeItems;
	}
}

export function createIconPath(iconName: string) {
	return {
		'dark': path.join(__filename, '..', '..', '..', 'media', 'icons', 'dark', iconName + '.svg'),
		'light': path.join(__filename, '..', '..', '..', 'media', 'icons', 'light', iconName + '.svg')
	};
}
