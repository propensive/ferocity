import * as fury from '../fury';
import { FerocityTreeItem } from './tree';

export function getUniverseTree(universe: fury.universe.Universe | undefined): FerocityTreeItem[] {
  return universe ? getProjectItems(universe) : [];
}

class ProjectItem extends FerocityTreeItem {
  constructor(projectName: string) {
    super(projectName, false, [], 'ferocity.universe.project-item');
  }
}

function getProjectItems(universe: fury.universe.Universe): FerocityTreeItem[] {
  return universe.projects.map(project => new ProjectItem(project));
}
