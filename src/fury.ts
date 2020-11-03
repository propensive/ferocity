import axios from 'axios';
import { sortDependencies } from './dependencyGraph';

export function buildDependencyGraph(project: layer.Project): string[][] {
  const dependencies = project.modules.flatMap(module => module.dependencies.map(dependencyName => [dependencyName, project.name + '/' + module.name]));
  return sortDependencies(dependencies);
}

export namespace universe {
  export interface Universe {
    projects: string[]
  }

  // TODO: handle undefined workspace
  export function get(workspace: string | undefined): Promise<Universe> {
    const getProjects = (universe: any) => universe.projects
      .map((project: any) => project.id)
      .sort((a: string, b: string) => a < b ? -1 : 1);

    console.log(`Get universe from workspace: ${workspace}`);
    const furyServerUrl = 'http://localhost:6325/universe?path=' + workspace;
    return axios
      .get(furyServerUrl)
      .then(response => ({
        projects: getProjects(response.data.result)
      }))
      .catch(error => {
        console.log(`Cannot get universe from workspace: ${error}.`);
        return error;
      });
  }
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
    id: string;
    path: string;
    isLocal: boolean;
  }

  // TODO: handle undefined workspace
  export function get(workspace: string | undefined): Promise<Layer> {
    const getDependencies = (module: any) => module.dependencies
      .sort((a: string, b: string) => a < b ? -1 : 1);
    // TODO: handle other types of sources
    const getSources = (module: any) => module.sources
      .map((source: any) => ({
        id: source.id,
        path: source.path,
        isLocal: source.editable
      }))
      .sort((a: Source, b: Source) => a.id < b.id ? -1 : 1);
    const getBinaries = (module: any) => module.binaries
      .map((binary: any) => binary.id)
      .sort((a: string, b: string) => a < b ? -1 : 1);
    const getModules = (project: any) => project.modules
      .map((module: any) => ({
        name: module.id,
        dependencies: getDependencies(module),
        sources: getSources(module),
        binaries: getBinaries(module)
      }))
      .sort((a: Module, b: Module) => a.name < b.name ? -1 : 1);
    const getProjects = (layer: any) => layer.projects
      .map((project: any) => ({
        name: project.id,
        modules: getModules(project)
      }))
      .sort((a: Project, b: Project) => a.name < b.name ? -1 : 1);
    console.log(`Get layer from workspace: ${workspace}`);
    const furyServerUrl = 'http://localhost:6325/layer?path=' + workspace;
    return axios
      .get(furyServerUrl)
      .then(response => ({
        name: '/',
        projects: getProjects(response.data.result)
      }))
      .catch(error => {
        console.log(`Cannot get layer from workspace: ${error}.`);
        return error;
      });
  }
}
