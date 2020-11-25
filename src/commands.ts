import * as pcp from 'promisify-child-process';
import * as vscode from 'vscode';
import * as fury from './fury';
import { furyBin } from './settings';
import * as state from './state';
import { ferocityScheme } from './textDocumentContentProvider';
import { BinaryItem, ModuleItem, ProjectItem, SourceItem } from './tree/layerTree';
import { FerocityTreeDataProvider, FerocityTreeItem } from './tree/tree';

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
          vscode.commands.executeCommand('setContext', 'ferocity.initialized', true);
        }
      })
      .catch(handleConnectionError);
  };
}

export function addProject() {
  return (layerItem: FerocityTreeItem) => {
    const layer = layerItem.label;
    vscode.window.showInputBox({
      placeHolder: 'Project name'
    }).then(projectName => {
      console.log(`Add a project: ${projectName} to layer: ${layer}.`);
      if (projectName) {
        fury.layer.addProject(vscode.workspace.rootPath, projectName)
          .then(() => {
            console.log('Project added.');
            vscode.commands.executeCommand('ferocity.refreshLayer');
            vscode.commands.executeCommand('ferocity.refreshUniverse');
          })
          .catch((error) => {
            console.log('Failed to add a project. Error: ' + error);
            vscode.window.showErrorMessage('Failed to add a project.');
          });
      }
    });
  };
}

export function removeProject() {
  return (projectItem: FerocityTreeItem) => {
    const project = projectItem.label;
    console.log(`Remove a project: ${project}.`);

    if (project) {
      const yes = 'Yes';
      vscode.window
        .showWarningMessage('Are you sure you want to remove project: ' + project + '?', { modal: true }, yes)
        .then(confirmation => {
          if (confirmation === yes) {
            fury.layer.removeProject(vscode.workspace.rootPath, project)
              .then(() => {
                console.log('Project removed.');
                vscode.commands.executeCommand('ferocity.refreshLayer');
                vscode.commands.executeCommand('ferocity.refreshUniverse');
              })
              .catch((error) => {
                console.log('Failed to add a project. Error: ' + error);
                vscode.window.showErrorMessage('Failed to add a project.');
              });
          }
        });
    }
  };
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

export function addModule() {
  return onProjectItem((projectItem) => {
    const project = projectItem.label;
    input('Module name', (moduleName) => {
      console.log(`Add a module: ${moduleName} to project: ${project}.`);
      fury.layer.addModule(vscode.workspace.rootPath, project, moduleName)
        .then(() => {
          console.log('Module added.');
          vscode.commands.executeCommand('ferocity.refreshLayer');
        })
        .catch((error) => {
          console.log('Failed to add a module. Error: ' + error);
          vscode.window.showErrorMessage('Failed to add a module.');
        });
    });
  });
}

export function buildModule() {
  return onModuleItem((projectItem, moduleItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    if (ensureTerminalExists()) {
      selectTerminal().then(terminal => {
        if (terminal) {
          terminal.show(true);
          terminal.sendText(`fury build run -p ${project} -m ${module}`);
        }
      });
    }
  });
}

export function removeModule() {
  return onModuleItem((projectItem, moduleItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    console.log(`Remove a module: ${module} from the project: ${project}.`);
    confirm(`Are you sure you want to remove module: ${module}?`, () => {
      fury.layer.removeModule(vscode.workspace.rootPath, project, module)
        .then(() => {
          console.log(`Module '${module}' removed.`);
          vscode.commands.executeCommand('ferocity.refreshLayer');
        })
        .catch((error) => {
          console.log(`Failed to remove the '${module}' module. Error: ${error}`);
          vscode.window.showErrorMessage('Failed to remove a module.');
        });
    });
  });
}

export function updateModuleCompiler() {
  return onModuleItem((projectItem, moduleItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    const onDidPickItem = (compiler: string) => fury.layer.updateModuleCompiler(vscode.workspace.rootPath, project, module, compiler);
    fury.layer.getCompilerSuggestions(vscode.workspace.rootPath, project, module)
      .then((compilers) => pick('Compiler', compilers, onDidPickItem))
      .catch((error) => console.log('Failed to get compiler suggestions. Error: ' + error));
  });
}

export function updateModuleName() {
  return onModuleItem((projectItem, moduleItem) => edit(
    moduleItem.label,
    (newName) => {
      fury.layer
        .updateModuleName(vscode.workspace.rootPath, projectItem.label, moduleItem.label, newName)
        .then(() => vscode.commands.executeCommand('ferocity.refreshLayer'));
    }));
}

export function updateModuleType() {
  return onModuleItem((project, module) => pick(
    'Module type',
    ['app', 'bench', 'compiler', 'lib', 'plugin'],
    (newType) => {
      switch (newType) {
        case 'app':
          input('Main class', (mainClass) => fury.layer
            .updateModuleTypeToApp(vscode.workspace.rootPath, project.label, module.label, mainClass)
            .then(() => vscode.commands.executeCommand('ferocity.refreshLayer')));
          break;
      }
    }));
}

export function addSource() {
  return onModuleItem((projectItem, moduleItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    const onInput = (source: string) => fury.layer.addSource(vscode.workspace.rootPath, project, module, source)
      .then(() => vscode.commands.executeCommand('ferocity.refreshLayer'));
    input('Source', onInput);
  });
}

export function addBinary() {
  return onModuleItem((projectItem, moduleItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    input('Binary', (binary) => fury.layer.addBinary(vscode.workspace.rootPath, project, module, binary)
      .then(() => vscode.commands.executeCommand('ferocity.refreshLayer')));
  });
}

export function removeSource() {
  return onSourceItem((projectItem, moduleItem, sourceItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    const source = sourceItem.label;
    const yes = 'Yes';
    vscode.window
      .showWarningMessage('Are you sure you want to remove source: ' + source + '?', { modal: true }, yes)
      .then(confirmation => {
        if (confirmation === yes) {
          fury.layer.removeSource(vscode.workspace.rootPath, project, module, sourceItem.path)
            .then(() => {
              console.log('Source removed.');
              vscode.commands.executeCommand('ferocity.refreshLayer');
            })
            .catch((error) => {
              console.log('Failed to remove a source. Error: ' + error);
              vscode.window.showErrorMessage('Failed to remove a source.');
            });
        }
      });
  });
}

export function removeBinary() {
  return onBinaryItem((projectItem, moduleItem, binaryItem) => {
    const project = projectItem.label;
    const module = moduleItem.label;
    const binary = binaryItem.label;

    confirm(`Are you sure you want to remove binary: ${binary}?`, () => {
      fury.layer.removeBinary(vscode.workspace.rootPath, project, module, binary)
        .then(() => {
          console.log(`Binary '${binary}' removed.`);
          vscode.commands.executeCommand('ferocity.refreshLayer');
        })
        .catch((error) => {
          console.log(`Failed to remove the '${binary}' binary. Error: ${error}`);
          vscode.window.showErrorMessage(`Failed to remove the '${binary}' binary.`);
        });
    });
  });
}

export function revealSource() {
  return onSourceItem((projectItem, moduleItem, sourceItem) => {
    vscode.commands.executeCommand('revealInExplorer', vscode.Uri.file(sourceItem.path));
  });
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
        }
      })
      .catch(handleConnectionError);
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

function handleConnectionError(error: any) {
  console.log('Fury server connection error: ' + error);
  vscode.window.showErrorMessage('Cannot connect to the Fury server.');
}

function input(placeHolder: string, onInput: (input: string) => void, onDismissal?: () => void) {
  vscode.window.showInputBox({ placeHolder: placeHolder })
    .then(answer => {
      if (answer) {
        onInput(answer);
      } else if (onDismissal) {
        onDismissal();
      }
    });
}

function edit(value: string, onEdit: (edited: string) => void, onDismissal?: () => void) {
  vscode.window.showInputBox({ value: value, valueSelection: [0, value.length] })
    .then(answer => {
      if (answer) {
        onEdit(answer);
      } else if (onDismissal) {
        onDismissal();
      }
    });
}

function pick(placeHolder: string, items: string[], onDidPickItem: (item: string) => void) {
  vscode.window.showQuickPick(items, { placeHolder: placeHolder })
    .then((item) => {
      if (item) {
        onDidPickItem(item);
      }
    });
}

function confirm(message: string, onDidConfirm: () => void) {
  const doNothing = () => { };
  const yes = 'Yes';
  vscode.window.showWarningMessage(message, { modal: true }, yes)
    .then(answer => answer === yes ? onDidConfirm() : doNothing());
}

function onProjectItem(action: (projectItem: ProjectItem) => void) {
  return (projectItem: ProjectItem) => {
    action(projectItem);
  };
}

function onModuleItem(action: (project: ProjectItem, module: ModuleItem) => void) {
  return (moduleItem: ModuleItem) => {
    const projectItem = moduleItem.parent;
    action(projectItem, moduleItem);
  };
}

function onSourceItem(action: (project: ProjectItem, module: ModuleItem, source: SourceItem) => void) {
  return (sourceItem: SourceItem) => {
    const projectItem = sourceItem.parent.parent;
    const moduleItem = sourceItem.parent;
    action(projectItem, moduleItem, sourceItem);
  };
}

function onBinaryItem(action: (project: ProjectItem, module: ModuleItem, binary: BinaryItem) => void) {
  return (binaryItem: BinaryItem) => {
    const projectItem = binaryItem.parent.parent;
    const moduleItem = binaryItem.parent;
    action(projectItem, moduleItem, binaryItem);
  };
}

function selectTerminal(): Thenable<vscode.Terminal | undefined> {
  interface TerminalQuickPickItem extends vscode.QuickPickItem {
    terminal: vscode.Terminal;
  }
  const terminals = <vscode.Terminal[]>(<any>vscode.window).terminals;
  const items: TerminalQuickPickItem[] = terminals.map(t => {
    return {
      label: t.name,
      terminal: t
    };
  });
  return vscode.window.showQuickPick(items).then(item => {
    return item ? item.terminal : undefined;
  });
}

function ensureTerminalExists(): boolean {
  if ((<any>vscode.window).terminals.length === 0) {
    vscode.window.showErrorMessage('No active terminals');
    return false;
  }
  return true;
}
