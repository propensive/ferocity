import * as fury from '../fury';
import { FerocityTreeItem } from './tree';

export function getHierarchyTree(hierarchy: fury.hierarchy.Hierarchy | undefined): FerocityTreeItem[] {
  return hierarchy ? getHierarchyItems(hierarchy) : [];
}

class HierarchyItem extends FerocityTreeItem {
  constructor(hierarchyName: string) {
    super(hierarchyName, true, 'ferocity.hierarchy.hierarchy-item');
  }
}

function getHierarchyItems(hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem[] {
  return [getHierarchyItem(hierarchy)];
}

function getHierarchyItem(hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem {
  const children = hierarchy.children.map(getHierarchyItem);
  const hierarchyItem = new HierarchyItem(hierarchy.name);
  hierarchyItem.children = children;
  return hierarchyItem;
}