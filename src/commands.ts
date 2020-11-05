import * as vscode from 'vscode';
import * as fury from './fury';
import { FerocityTreeDataProvider, FerocityTreeItem } from './tree/tree';

export namespace layer {
  export function refresh(context: vscode.ExtensionContext, layerTreeDataProvider: FerocityTreeDataProvider) {
    return () => {
      fury.layer.get(vscode.workspace.rootPath)
        .then(layer => context.workspaceState.update('layer', layer))
        .catch(handleConnectionError);
      layerTreeDataProvider.refresh();
    };
  }

  export function showDependencyGraph(context: vscode.ExtensionContext) {
    return async (projectItem: FerocityTreeItem) => {
      const layer: fury.layer.Layer | undefined = context.workspaceState.get('layer');
      const project: fury.layer.Project | undefined = layer ? layer.projects.find(project => project.name === projectItem.label) : undefined;
      const dependencies = project ? fury.layer.buildDependencyGraph(project) : [];
      context.workspaceState.update('dependencies', dependencies);

      const uri = vscode.Uri.parse('fury:' + 'Dependency Graph');
      await vscode.workspace.openTextDocument(uri);
      vscode.commands.executeCommand('markdown.showPreview', uri);
    };
  }
}

export namespace hierarchy {
  export function refresh(context: vscode.ExtensionContext, hierarchyTreeDataProvider: FerocityTreeDataProvider) {
    return () => {
      fury.hierarchy.get(vscode.workspace.rootPath)
        .then(hierarchy => context.workspaceState.update('hierarchy', hierarchy))
        .catch(handleConnectionError);
      hierarchyTreeDataProvider.refresh();
    };
  }
}

export namespace universe {
  export function refresh(context: vscode.ExtensionContext, universeTreeDataProvider: FerocityTreeDataProvider) {
    return () => {
      fury.universe.get(vscode.workspace.rootPath)
        .then(universe => context.workspaceState.update('universe', universe))
        .catch(handleConnectionError);
      universeTreeDataProvider.refresh();
    };
  }
}

function handleConnectionError(error: any) {
  console.log('Fury server connection error: ' + error);
  vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}
