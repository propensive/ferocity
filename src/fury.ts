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
  sources: string[];
}

export namespace layer {
  // TODO: handle undefined workspace
  export function get(workspace: string | undefined): Promise<Layer> {
    const getDependencies = (module: any) => module.dependencies.map((dependency: any) => dependency.ref.id);
    const getSources = (module: any) => module.sources.map((source: any) => source.dir.input);
    const getModules = (project: any) => project.modules.map((module: any) => ({
      name: module.id.key,
      dependencies: getDependencies(module),
      sources: getSources(module)
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
