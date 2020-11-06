import * as vscode from 'vscode';
import * as fury from '../fury';
import * as fs from 'fs';
import * as path from 'path';
import { createIconPath, FerocityTreeDataProvider, FerocityTreeItem } from './tree';

export class LayerTreeDataProvider extends FerocityTreeDataProvider {
	constructor(createTreeItems: () => FerocityTreeItem[]) {
		super(createTreeItems);
	}

	getChildren(element: FerocityTreeItem): Thenable<FerocityTreeItem[]> {
		if (element instanceof SourceItem || element instanceof SourceDirectoryItem) {
			return new Promise<FerocityTreeItem[]>((resolve, reject) => {
				fs.readdir(element.path, (err, fileNames) => {
					if (err) {
						reject(err);
					} else {
						try {
							const fileItems = fileNames
								.flatMap(fileName => {
									const filePath = path.join(element.path, fileName);
									const fileStats = fs.lstatSync(filePath);
									if (fileStats.isFile()) {
										const sourceFileItem = new SourceFileItem(fileName, filePath, element.isLocal);
										return [{ type: 'f', item: sourceFileItem }];
									} else if (fileStats.isDirectory()) {
										const sourceDirectoryItem = new SourceDirectoryItem(fileName, filePath, element.isLocal);
										return [{ type: 'd', item: sourceDirectoryItem }];
									} else {
										return [];
									}
								})
								.sort((resultA, resultB) => {
									if (resultA.type === resultB.type) {
										return resultA.item.label < resultB.item.label ? -1 : 1;
									} else {
										return resultA.type === 'd' ? -1 : 1;
									}
								})
								.map(result => result.item);
							resolve(fileItems);
						} catch (error) {
							console.log(`Unable to list sources in: ${element.path}. Error: ${error}`);
							reject(`Unable to list sources in: ${element.path}`);
						}
					}
				});
			});
		} else {
			return super.getChildren(element);
		}
	}
}

export function getLayerTree(layer: fury.layer.Layer | undefined): FerocityTreeItem[] {
	return layer ? getLayerItems(layer) : [];
}

class LayerItem extends FerocityTreeItem {
	constructor(layerName: string) {
		super(layerName, true, 'ferocity.layer.layer-item');
		this.iconPath = createIconPath('versions');
	}
}

class ProjectItem extends FerocityTreeItem {
	constructor(projectName: string) {
		super(projectName, true, 'ferocity.layer.project-item');
		this.iconPath = createIconPath('circuit-board');
	}
}

class ModuleItem extends FerocityTreeItem {
	constructor(moduleName: string) {
		super(moduleName, true, 'ferocity.layer.module-item');
		this.iconPath = createIconPath('circle-outline');
	}
}

class DependencyItem extends FerocityTreeItem {
	constructor(dependencyName: string) {
		super(dependencyName, false, 'ferocity.layer.dependency-item');
		this.iconPath = createIconPath('link');
	}
}

class SourceItem extends FerocityTreeItem {
	constructor(sourceName: string, public readonly isLocal: boolean, public readonly path: string) {
		super(sourceName, true, 'ferocity.layer.source-item');
		this.iconPath = isLocal ? createIconPath('file-symlink-directory') : createIconPath('repo');
	}
}

class SourceDirectoryItem extends FerocityTreeItem {
	constructor(directoryName: string, public readonly path: string, public readonly isLocal: boolean) {
		super(directoryName, true, 'ferocity.layer.source-directory-item');
	}
}

class SourceFileItem extends FerocityTreeItem {
	constructor(fileName: string, path: string, isLocal: boolean) {
		super(fileName, false, 'ferocity.layer.source-file-item');
		this.command = {
			title: 'Open File',
			command: 'ferocity.openFile',
			arguments: [path, isLocal]
		};
	}
}

class BinaryItem extends FerocityTreeItem {
	constructor(binaryName: string) {
		super(binaryName, false, 'ferocity.layer.binary-item');
		this.iconPath = createIconPath('library');
	}
}

function getLayerItems(layer: fury.layer.Layer): FerocityTreeItem[] {
	const layerItem = new LayerItem(layer.name);
	layerItem.children = getProjectItems(layer, layerItem);
	return [layerItem];
}

function getProjectItems(layer: fury.layer.Layer, layerItem: FerocityTreeItem): FerocityTreeItem[] {
	return layer.projects.flatMap(project => {
		const projectItem = new ProjectItem(project.name);
		projectItem.parent = layerItem;
		projectItem.children = getModuleItems(project, projectItem);
		return projectItem;
	});
}

function getModuleItems(project: fury.layer.Project, projectItem: FerocityTreeItem): FerocityTreeItem[] {
	return project.modules.flatMap(module => {
		const moduleItem = new ModuleItem(module.name);
		moduleItem.parent = projectItem;
		moduleItem.children = [...getDependencyItems(module, moduleItem), ...getSourceItems(module, moduleItem), ...getBinaryItems(module, moduleItem)];
		return moduleItem;
	});
}

function getDependencyItems(module: fury.layer.Module, moduleItem: FerocityTreeItem): FerocityTreeItem[] {
	return module.dependencies.map(dependency => {
		const dependencyItem = new DependencyItem(dependency);
		dependencyItem.parent = moduleItem;
		return dependencyItem;
	});
}

function getSourceItems(module: fury.layer.Module, moduleItem: FerocityTreeItem): FerocityTreeItem[] {
	return module.sources.map(source => {
		const sourceItem = new SourceItem(source.name, source.isLocal, source.path);
		sourceItem.parent = moduleItem;
		return sourceItem;
	});
}

function getBinaryItems(module: fury.layer.Module, moduleItem: FerocityTreeItem): FerocityTreeItem[] {
	return module.binaries.map(binary => {
		const binaryItem = new BinaryItem(binary);
		binaryItem.parent = moduleItem;
		return binaryItem;
	});
}
