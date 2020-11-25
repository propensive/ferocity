import axios from 'axios';
import { sortDependencies } from './dependencyGraph';

export interface Error {
  message: string;
}

export function isError<T>(result: T | Error): result is Error {
  return (result as Error).message !== undefined;
}

export namespace layer {
  export interface Layer {
    name: string;
    projects: Project[];
  }

  export interface Project {
    name: string;
    modules: Module[];
  }

  export interface Module {
    name: string;
    dependencies: string[];
    sources: Source[];
    binaries: string[];
  }

  export interface Source {
    name: string;
    path: string;
    isLocal: boolean;
  }

  export function get(workspace: string | undefined): Promise<Layer | Error> {
    console.log(`Getting a layer for workspace: ${workspace}.`);
    if (!workspace) {
      return Promise.reject('Unable to get a layer. Workspace undefined.');
    }
    const layerUrl = 'http://localhost:6325/layer?path=' + workspace;
    return axios
      .get(layerUrl)
      .then(response => getResultOrError(response, getLayer));
  }

  function getLayer(result: any) {
    return {
      name: '/',
      projects: getProjects(result)
    };
  }

  function getProjects(layer: any) {
    return layer.projects
      .map((project: any) => ({
        name: project.id,
        modules: getModules(project)
      }))
      .sort((a: Project, b: Project) => a.name < b.name ? -1 : 1);
  }

  function getModules(project: any) {
    return project.modules
      .map((module: any) => ({
        name: module.id,
        dependencies: getDependencies(module),
        sources: getSources(module),
        binaries: getBinaries(module)
      }))
      .sort((a: Module, b: Module) => a.name < b.name ? -1 : 1);
  }

  function getBinaries(module: any) {
    return module.binaries
      .map((binary: any) => binary.id)
      .sort((a: string, b: string) => a < b ? -1 : 1);
  }

  function getSources(module: any) {
    return module.sources
      .map((source: any) => ({
        name: source.id,
        path: source.path,
        isLocal: source.editable
      }))
      .sort((a: Source, b: Source) => a.name < b.name ? -1 : 1);
  }

  function getDependencies(module: any) {
    return module.dependencies.sort((a: string, b: string) => a < b ? -1 : 1);
  }

  export function buildDependencyGraph(project: Project): string[][] {
    const dependencies = project.modules.flatMap(module => module.dependencies.map(dependencyName => [dependencyName, project.name + '/' + module.name]));
    return sortDependencies(dependencies);
  }
}

export namespace hierarchy {
  export interface Hierarchy {
    name: string,
    children: Hierarchy[]
  }

  export function get(workspace: string | undefined): Promise<Hierarchy | Error> {
    console.log(`Getting a hierarchy for workspace: ${workspace}.`);
    if (!workspace) {
      return Promise.reject('Unable to get a hierarchy. Workspace undefined.');
    }

    const hierarchyUrl = 'http://localhost:6325/hierarchy?path=' + workspace;
    return axios
      .get(hierarchyUrl)
      .then(response => getResultOrError(response, getHierarchy));
  }

  function getHierarchy(hierarchy: any) {
    return {
      name: hierarchy.id,
      children: getChildren(hierarchy).map((child: any) => getHierarchy(child))
    };
  };

  function getChildren(hierarchy: any) {
    return hierarchy.children ? hierarchy.children : [];
  }
}

export namespace universe {
  export interface Universe {
    projects: string[]
  }

  export function get(workspace: string | undefined): Promise<Universe | Error> {
    console.log(`Getting a universe for workspace: ${workspace}.`);
    if (!workspace) {
      return Promise.reject('Unable to get a universe. Workspace undefined.');
    }

    const universeUrl = 'http://localhost:6325/universe?path=' + workspace;
    return axios
      .get(universeUrl)
      .then(response => getResultOrError(response, getUniverse));
  }

  function getUniverse(universe: any) {
    return {
      projects: getProjects(universe)
    };
  }

  function getProjects(universe: any) {
    return universe.projects
      .map((project: any) => project.id)
      .sort((a: string, b: string) => a < b ? -1 : 1);
  }
}

function getResultOrError<T>(response: any, map: (result: any) => T): T | Error {
  if (response.data.error === undefined) {
    return map(response.data.result);
  } else {
    return {
      message: response.data.error
    };
  }
}
