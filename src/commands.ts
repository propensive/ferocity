import * as vscode from 'vscode';
import * as fury from './fury';
import * as state from './state';
import { ferocityScheme } from './textDocumentContentProvider';
import { FerocityTreeDataProvider, FerocityTreeItem } from './tree/tree';

export function refreshLayer(context: vscode.ExtensionContext, layerTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.layer.get(vscode.workspace.rootPath)
      .then(layer => context.workspaceState.update(state.layerKey, layer))
      .catch(handleConnectionError);
    layerTreeDataProvider.refresh();
  };
}

export function refreshHierarchy(context: vscode.ExtensionContext, hierarchyTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.hierarchy.get(vscode.workspace.rootPath)
      .then(hierarchy => context.workspaceState.update(state.hierarchyKey, hierarchy))
      .catch(handleConnectionError);
    hierarchyTreeDataProvider.refresh();
  };
}

export function refreshUniverse(context: vscode.ExtensionContext, universeTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.universe.get(vscode.workspace.rootPath)
      .then(universe => context.workspaceState.update(state.universeKey, universe))
      .catch(handleConnectionError);
    universeTreeDataProvider.refresh();
  };
}

function handleConnectionError(error: any) {
  console.log('Fury server connection error: ' + error);
  vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

export function showDependencyGraph(context: vscode.ExtensionContext) {
  return async (projectItem: FerocityTreeItem) => {
    const layer: fury.layer.Layer | undefined = context.workspaceState.get(state.layerKey);
    const project: fury.layer.Project | undefined = layer ? layer.projects.find(project => project.name === projectItem.label) : undefined;
    const dependencies = project ? fury.layer.buildDependencyGraph(project) : [];
    context.workspaceState.update('dependencies', dependencies);

    const uri = vscode.Uri.parse('fury:' + 'Dependency Graph');
    await vscode.workspace.openTextDocument(uri);
    vscode.commands.executeCommand('markdown.showPreview', uri);
  };
}

export function revealProject(layerTreeDataProvider: FerocityTreeDataProvider, treeView: vscode.TreeView<FerocityTreeItem>) {
  return (projectName: string) => {
    console.log(`Revealing '${projectName}' project in the Layer panel.`);
    const projectItem = layerTreeDataProvider.getTreeItems()
      .flatMap(layerItem => layerItem.children)
      .find(projectItem => projectItem.label === projectName);
    if (projectItem) {
      treeView.reveal(projectItem, { expand: true });
    }
  };
}

export function openFile() {
  return (filePath: string, editable: boolean) => {
    if (editable) {
      const openPath = vscode.Uri.parse("file://" + filePath);
      vscode.workspace.openTextDocument(openPath).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    } else {
      const uri = vscode.Uri.parse(`${ferocityScheme}:${filePath}`);
      vscode.workspace.openTextDocument(uri).then(doc => {
        vscode.window.showTextDocument(doc, { preview: false });
      });
    }
  };
}
