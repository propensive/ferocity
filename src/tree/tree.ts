import * as path from 'path';
import * as vscode from 'vscode';

export class FerocityTreeItem extends vscode.TreeItem {
	constructor(public readonly label: string, collapsible: boolean, public readonly children: FerocityTreeItem[], public readonly contextValue: string | undefined) {
		super(label);
		this.collapsibleState = collapsible ? vscode.TreeItemCollapsibleState.Collapsed : vscode.TreeItemCollapsibleState.None;
		this.contextValue = contextValue;
	}
}

export class FerocityTreeDataProvider implements vscode.TreeDataProvider<FerocityTreeItem> {
	private _onDidChangeTreeData: vscode.EventEmitter<FerocityTreeItem | undefined> = new vscode.EventEmitter<FerocityTreeItem | undefined>();
	readonly onDidChangeTreeData: vscode.Event<FerocityTreeItem | undefined> = this._onDidChangeTreeData.event;

	private treeItems: FerocityTreeItem[];

	constructor(private readonly getTreeItems: () => FerocityTreeItem[]) {
		this.treeItems = this.getTreeItems();
	}

	refresh(): void {
		this.treeItems = this.getTreeItems();
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
}

export function createIconPath(iconName: string) {
	return {
		'dark': path.join(__filename, '..', '..', '..', 'media', 'icons', 'dark', iconName + '.svg'),
		'light': path.join(__filename, '..', '..', '..', 'media', 'icons', 'light', iconName + '.svg')
	};
}
