import * as fury from '../fury';
import { FerocityTreeItem } from './tree';

export function createHierarchyTree(hierarchy: fury.hierarchy.Hierarchy | undefined): FerocityTreeItem[] {
  return hierarchy ? getHierarchyItems(hierarchy) : [];
}

class HierarchyItem extends FerocityTreeItem {
  constructor(hierarchyName: string, parent?: HierarchyItem) {
    super(hierarchyName, true, 'ferocity.hierarchy.hierarchy-item', parent);
  }
}

function getHierarchyItems(hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem[] {
  return [getHierarchyItem(undefined, hierarchy)];
}

function getHierarchyItem(parent: HierarchyItem | undefined, hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem {
  const hierarchyItem = new HierarchyItem(hierarchy.name, parent);
  const children = hierarchy.children.map(child => getHierarchyItem(hierarchyItem, child));
  hierarchyItem.children = children;
  return hierarchyItem;
}