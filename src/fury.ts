import axios from 'axios';
import { sortDependencies } from './dependencyGraph';

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

export enum SourceType {
  Local, Repo, Unknown
}

export interface Source {
  directory: string;
  type: SourceType;
}

export function buildDependencyGraph(project: Project): string[][] {
  const dependencies = project.modules.flatMap(module => module.dependencies.map(dependencyName => [dependencyName, project.name + '/' + module.name]));
  return sortDependencies(dependencies);
}

export namespace layer {
  // TODO: handle undefined workspace
  export function get(workspace: string | undefined): Promise<Layer> {
    const getSourceType = (sourceType: string) => {
      switch (sourceType) {
        case 'LocalSource':
          return SourceType.Local;
        case 'RepoSource':
          return SourceType.Repo;
        default:
          return SourceType.Unknown;
      }
    };
    const getDependencies = (module: any) => module.dependencies
      .map((dependency: any) => dependency.ref.id)
      .sort((a: string, b: string) => a < b ? -1 : 1);
    // TODO: handle other types of sources
    const getSources = (module: any) => module.sources
      .map((source: any) => ({
        'directory': source.dir.input,
        'type': getSourceType(source._type)
      }))
      .sort((a: Source, b: Source) => a.directory < b.directory ? -1 : 1);
    const getBinaries = (module: any) => module.binaries
      .map((binary: any) => binary.id.key)
      .sort((a: string, b: string) => a < b ? -1 : 1);
    const getModules = (project: any) => project.modules
      .map((module: any) => ({
        name: module.id.key,
        dependencies: getDependencies(module),
        sources: getSources(module),
        binaries: getBinaries(module)
      }))
      .sort((a: Module, b: Module) => a.name < b.name ? -1 : 1);
    const getProjects = (layer: any) => layer.projects
      .map((project: any) => ({
        name: project.id.key,
        modules: getModules(project)
      }))
      .sort((a: Project, b: Project) => a.name < b.name ? -1 : 1);
    console.log(`Get layer from workspace: ${workspace}`);
    const furyServerUrl = 'http://localhost:6325/layer?path=' + workspace;
    return axios
      .get(furyServerUrl)
      .then(response => ({
        name: '/',
        projects: getProjects(response.data)
      }));
  }
}
