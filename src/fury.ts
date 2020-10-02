import axios from 'axios';

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
    const getDependencies = (module: any) => module.dependencies.map((dependency: any) => dependency.ref.id);
    // TODO: handle other types of sources
    const getSources = (module: any) => module.sources.map((source: any) => ({
      'directory': source.dir.input,
      'type': getSourceType(source._type)
    }));
    const getBinaries = (module: any) => module.binaries.map((binary: any) => binary.id.key);
    const getModules = (project: any) => project.modules.map((module: any) => ({
      name: module.id.key,
      dependencies: getDependencies(module),
      sources: getSources(module),
      binaries: getBinaries(module)
    }));
    const getProjects = (layer: any) => layer.projects.map((project: any) => ({
      name: project.id.key,
      modules: getModules(project)
    }));
    console.log(`Get layer from workspace: ${workspace}`);
    const furyServerUrl = 'http://localhost:6325/?path=' + workspace;
    return axios.get(furyServerUrl).then(response => ({
      name: '/',
      projects: getProjects(response.data)
    }));
  }
}
