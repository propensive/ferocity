export function getLayers(): Promise<string[]> {
  console.log("Get layers.");
  return Promise.resolve(['/']);
}

export function getProjects(layer: string): Promise<string[]> {
  console.log("Get projects.");
  return Promise.resolve(['project1', 'project2']);
}

export function getModules(project: string): Promise<string[]> {
  console.log("Get modules.");
	return Promise.resolve(['module1', 'module2', 'module3', 'module4']);
}

export function getDependencies(module: string): Promise<string[]> {
  console.log("Get dependencies.");
  return Promise.resolve(['dependency1', 'dependency2', 'dependency3']);
}