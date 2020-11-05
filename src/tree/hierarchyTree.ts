import * as fury from '../fury';
import { FerocityTreeItem } from './tree';

export function getHierarchyTree(hierarchy: fury.hierarchy.Hierarchy | undefined): FerocityTreeItem[] {
  return hierarchy ? getHierarchyItems(hierarchy) : [];
}

class HierarchyItem extends FerocityTreeItem {
  constructor(hierarchyName: string, children: FerocityTreeItem[]) {
    super(hierarchyName, true, children, 'ferocity.hierarchy.hierarchy-item');
  }
}

function getHierarchyItems(hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem[] {
  return [getHierarchyItem(hierarchy)];
}

function getHierarchyItem(hierarchy: fury.hierarchy.Hierarchy): FerocityTreeItem {
  const children = hierarchy.children.map(getHierarchyItem);
  return new HierarchyItem(hierarchy.name, children);
}