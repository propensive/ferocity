import * as fs from 'fs';
import * as path from 'path';
import * as fury from '../fury';
import { createIconPath, FerocityTreeDataProvider, FerocityTreeItem } from './tree';

export class LayerTreeDataProvider extends FerocityTreeDataProvider {
	constructor(createTreeItems: () => FerocityTreeItem[]) {
		super(createTreeItems);
	}

	getChildren(element: FerocityTreeItem): Thenable<FerocityTreeItem[]> {
		if (element instanceof SourceItem) {
			return this.getSourceChildren(element);
		} else {
			return super.getChildren(element);
		}
	}

	getSourceChildren(sourceItem: SourceItem): Thenable<FerocityTreeItem[]> {
		return new Promise<FerocityTreeItem[]>((resolve, reject) => {
			fs.readdir(sourceItem.path, (err, fileNames) => {
				if (err) {
					reject(err);
				} else {
					try {
						const fileItems = fileNames
							.flatMap(fileName => this.getSourceItems(sourceItem, fileName))
							.sort(this.compareSourceItems);
						resolve(fileItems);
					} catch (error) {
						console.log(`Unable to list sources in: ${sourceItem.path}. Error: ${error}`);
						reject(`Unable to list sources in: ${sourceItem.path}`);
					}
				}
			});
		});
	}

	private getSourceItems(sourceItem: SourceItem, fileName: string) {
		const filePath = path.join(sourceItem.path, fileName);
		const fileStats = fs.lstatSync(filePath);
		if (fileStats.isFile()) {
			return [new SourceItem(SourceItemType.File, fileName, sourceItem.isLocal, filePath, sourceItem)];
		} else if (fileStats.isDirectory()) {
			return [new SourceItem(SourceItemType.Directory, fileName, sourceItem.isLocal, filePath, sourceItem)];
		} else {
			return [];
		}
	}

	private compareSourceItems(sourceA: SourceItem, sourceB: SourceItem) {
		if (sourceA.type === sourceB.type) {
			return sourceA.label < sourceB.label ? -1 : 1;
		} else {
			return sourceA.type === SourceItemType.Directory ? -1 : 1;
		}
	}
}

export function createLayerTree(layer: fury.layer.Layer | undefined): FerocityTreeItem[] {
	return layer ? getLayerItems(layer) : [];
}

export class LayerItem extends FerocityTreeItem {
	constructor(layerName: string) {
		super(layerName, true, 'ferocity.layer.layer-item');
		this.iconPath = createIconPath('versions');
	}
}

export class ProjectItem extends FerocityTreeItem {
	constructor(projectName: string, public readonly parent: LayerItem) {
		super(projectName, true, 'ferocity.layer.project-item', parent);
		this.iconPath = createIconPath('circuit-board');
	}
}

export class ModuleItem extends FerocityTreeItem {
	constructor(moduleName: string, moduleType: string, public readonly parent: ProjectItem) {
		super(moduleName, true, 'ferocity.layer.module-item', parent);
		this.description = moduleType;
		this.iconPath = createIconPath('circle-outline');
	}
}

export class DependencyItem extends FerocityTreeItem {
	constructor(dependencyName: string, public readonly parent: ModuleItem) {
		super(dependencyName, false, 'ferocity.layer.dependency-item', parent);
		this.iconPath = createIconPath('link');
	}
}

export enum SourceItemType {
	Source, Directory, File
}

export class SourceItem extends FerocityTreeItem {
	constructor(
		public readonly type: SourceItemType,
		sourceName: string,
		public readonly isLocal: boolean,
		public readonly path: string,
		public readonly parent: ModuleItem | SourceItem
	) {
		super(sourceName, SourceItem.isCollapsible(type), SourceItem.getContextValue(type), parent);
		this.iconPath = this.getIconPath();
		this.command = this.getCommand();
	}

	private static isCollapsible(type: SourceItemType) {
		return type !== SourceItemType.File;
	}

	private static getContextValue(type: SourceItemType) {
		switch (type) {
			case SourceItemType.Source:
				return 'ferocity.layer.source-item';
			case SourceItemType.Directory:
				return 'ferocity.layer.source-directory-item';
			case SourceItemType.File:
				return 'ferocity.layer.source-file-item';
			default:
				return '';
		}
	}

	private getIconPath() {
		switch (this.type) {
			case SourceItemType.Source:
				return this.isLocal ? createIconPath('file-symlink-directory') : createIconPath('repo');
			case SourceItemType.File:
				return this.path.endsWith('.scala') ? createIconPath('scala') : undefined;
			default:
				return undefined;
		}
	}

	private getCommand() {
		switch (this.type) {
			case SourceItemType.File:
				return {
					title: 'Open File',
					command: 'ferocity.openFile',
					arguments: [this.path, this.isLocal]
				};
			default:
				return undefined;
		}
	}
}

export class BinaryItem extends FerocityTreeItem {
	constructor(binaryName: string, public readonly parent: ModuleItem) {
		super(binaryName, false, 'ferocity.layer.binary-item', parent);
		this.iconPath = createIconPath('library');
	}
}

function getLayerItems(layer: fury.layer.Layer): LayerItem[] {
	const layerItem = new LayerItem(layer.name);
	layerItem.children = getProjectItems(layer, layerItem);
	return [layerItem];
}

function getProjectItems(layer: fury.layer.Layer, layerItem: LayerItem): ProjectItem[] {
	return layer.projects.flatMap(project => {
		const projectItem = new ProjectItem(project.name, layerItem);
		projectItem.children = getModuleItems(project, projectItem);
		return projectItem;
	});
}

function getModuleItems(project: fury.layer.Project, projectItem: ProjectItem): ModuleItem[] {
	return project.modules.flatMap(module => {
		const moduleItem = new ModuleItem(module.name, module.type, projectItem);
		moduleItem.children = [...getDependencyItems(module, moduleItem), ...getSourceItems(module, moduleItem), ...getBinaryItems(module, moduleItem)];
		return moduleItem;
	});
}

function getDependencyItems(module: fury.layer.Module, moduleItem: ModuleItem): DependencyItem[] {
	return module.dependencies.map(dependency => new DependencyItem(dependency, moduleItem));
}

function getSourceItems(module: fury.layer.Module, moduleItem: ModuleItem): SourceItem[] {
	return module.sources.map(source => new SourceItem(SourceItemType.Source, source.name, source.isLocal, source.path, moduleItem));
}

function getBinaryItems(module: fury.layer.Module, moduleItem: ModuleItem): BinaryItem[] {
	return module.binaries.map(binary => new BinaryItem(binary, moduleItem));
}
