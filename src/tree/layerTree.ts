import * as fury from '../fury';
import { createIconPath, FerocityTreeItem } from './tree';

export function getLayerTree(layer: fury.layer.Layer | undefined): FerocityTreeItem[] {
	return layer ? getLayerItems(layer) : [];
}

class LayerItem extends FerocityTreeItem {
	constructor(layerName: string, projectItems: FerocityTreeItem[]) {
		super(layerName, true, projectItems, 'ferocity.layer.layer-item');
		this.iconPath = createIconPath('versions');
	}
}

class ProjectItem extends FerocityTreeItem {
	constructor(projectName: string, moduleItems: FerocityTreeItem[]) {
		super(projectName, true, moduleItems, 'ferocity.layer.project-item');
		this.iconPath = createIconPath('circuit-board');
	}
}

class ModuleItem extends FerocityTreeItem {
	constructor(moduleName: string, dependencyItems: FerocityTreeItem[], sourceItems: FerocityTreeItem[], binaryItems: FerocityTreeItem[]) {
		super(moduleName, true, [...dependencyItems, ...sourceItems, ...binaryItems], 'ferocity.layer.module-item');
		this.iconPath = createIconPath('circle-outline');
	}
}

class DependencyItem extends FerocityTreeItem {
	constructor(dependencyName: string) {
		super(dependencyName, false, [], 'ferocity.layer.dependency-item');
		this.iconPath = createIconPath('link');
	}
}

class SourceItem extends FerocityTreeItem {
	constructor(sourceName: string, isLocal: boolean) {
		super(sourceName, false, [], 'ferocity.layer.source-item');
		this.iconPath = isLocal ? createIconPath('file-symlink-directory') : createIconPath('repo');
	}
}

class BinaryItem extends FerocityTreeItem {
	constructor(binaryName: string) {
		super(binaryName, false, [], 'ferocity.layer.binary-item');
		this.iconPath = createIconPath('library');
	}
}

function getLayerItems(layer: fury.layer.Layer): FerocityTreeItem[] {
	return [new LayerItem(layer.name, getProjectItems(layer))];
}

function getProjectItems(layer: fury.layer.Layer): FerocityTreeItem[] {
	return layer.projects.flatMap(project => new ProjectItem(project.name, getModuleItems(project)));
}

function getModuleItems(project: fury.layer.Project): FerocityTreeItem[] {
	return project.modules.flatMap(module => new ModuleItem(
		module.name,
		getDependencyItems(module),
		getSourceItems(module),
		getBinaryItems(module))
	);
}

function getDependencyItems(module: fury.layer.Module): FerocityTreeItem[] {
	return module.dependencies.map(dependency => new DependencyItem(dependency));
}

function getSourceItems(module: fury.layer.Module): FerocityTreeItem[] {
	return module.sources.map(source => {
		const sourceItem = new SourceItem(source.name, source.isLocal);
		return sourceItem;
	});
}

function getBinaryItems(module: fury.layer.Module): FerocityTreeItem[] {
	return module.binaries.map(binary => new BinaryItem(binary));
}
