import * as fury from '../fury';
import { createIconPath, FerocityTreeItem } from './tree';

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
	constructor(sourceName: string, isLocal: boolean) {
		super(sourceName, false, 'ferocity.layer.source-item');
		this.iconPath = isLocal ? createIconPath('file-symlink-directory') : createIconPath('repo');
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
		const sourceItem = new SourceItem(source.name, source.isLocal);
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
