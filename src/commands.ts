import * as vscode from 'vscode';
import * as fury from './fury';
import * as state from './state';
import { ferocityScheme } from './textDocumentContentProvider';
import { FerocityTreeDataProvider, FerocityTreeItem } from './tree/tree';
import { furyBin } from './settings';
import * as pcp from 'promisify-child-process';

export function refreshLayer(context: vscode.ExtensionContext, layerTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.layer.get(vscode.workspace.rootPath)
      .then((layer: fury.layer.Layer | fury.Error) => {
        if (fury.isError(layer)) {
          console.log('Error: ' + layer.message);
          vscode.window.showErrorMessage('Layer failed to refresh.');
        } else {
          console.log('Layer: ' + layer);
          context.workspaceState.update(state.layerKey, layer);
          layerTreeDataProvider.refresh();
          vscode.window.showInformationMessage('Layer refreshed.');
          vscode.commands.executeCommand('setContext', 'ferocity.initialized', true);
        }
      })
      .catch(handleConnectionError);
  };
}

export function refreshHierarchy(context: vscode.ExtensionContext, hierarchyTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.hierarchy.get(vscode.workspace.rootPath)
      .then((hierarchy: fury.hierarchy.Hierarchy | fury.Error) => {
        if (fury.isError(hierarchy)) {
          console.log('Error: ' + hierarchy.message);
          vscode.window.showErrorMessage('Hierarchy failed to refresh.');
        } else {
          console.log('Hierarchy: ' + hierarchy);
          context.workspaceState.update(state.hierarchyKey, hierarchy);
          hierarchyTreeDataProvider.refresh();
          vscode.window.showInformationMessage('Hierarchy refreshed.');
        }
      })
      .catch(handleConnectionError);
  };
}

export function refreshUniverse(context: vscode.ExtensionContext, universeTreeDataProvider: FerocityTreeDataProvider) {
  return () => {
    fury.universe.get(vscode.workspace.rootPath)
      .then((universe: fury.universe.Universe | fury.Error) => {
        if (fury.isError(universe)) {
          console.log('Error: ' + universe.message);
          vscode.window.showErrorMessage('Universe failed to refresh.');
        } else {
          console.log('Universe: ' + universe);
          context.workspaceState.update(state.universeKey, universe);
          universeTreeDataProvider.refresh();
          vscode.window.showInformationMessage('Universe refreshed.');
        }
      })
      .catch(handleConnectionError);
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

export function initializeLayer() {
  return () => {
    console.log('Initialize layer.');
    const workspace = vscode.workspace.rootPath;
    if (!workspace) {
      return;
    }

    pcp.exec(`${furyBin} layer init`, { cwd: workspace })
      .then(() => {
        console.log('Fury layer initialized.');
        vscode.commands.executeCommand('setContext', 'ferocity.initialized', true);
        vscode.window.showInformationMessage('Fury layer initialized.');

        vscode.commands.executeCommand('ferocity.refreshLayer');
        vscode.commands.executeCommand('ferocity.refreshHierarchy');
        vscode.commands.executeCommand('ferocity.refreshUniverse');
      })
      .catch(error => {
        console.log('Fury layer initialization error. Error: ' + error);
        vscode.window.showInformationMessage('Fury layer failed to initialize.');
      });
  };
}
