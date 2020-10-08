import * as vscode from 'vscode';

type Graph = { [index: string]: string[] };

function buildGraph(dependencies: string[][]): Graph {
  const graph: Graph = {};
  dependencies.forEach((dependency: string[]) => {
    if (!graph.hasOwnProperty(dependency[0])) {
      graph[dependency[0]] = [];
    }
    if (!graph.hasOwnProperty(dependency[1])) {
      graph[dependency[1]] = [];
    }
    graph[dependency[0]].push(dependency[1]);
  });

  return graph;
}

function calculateIndegrees(graph: Graph): { [index: string]: number } {
  const indegrees: { [index: string]: number } = {};
  for (const vertex in graph) {
    indegrees[vertex] = 0;
  }
  for (const vertex in graph) {
    graph[vertex].forEach(adjacentVertex => ++indegrees[adjacentVertex]);
  }

  return indegrees;
}

/**
 * Implementation of the Kahn's algorithm. 
 * https://en.wikipedia.org/wiki/Topological_sorting#Kahn's_algorithm
 * 
 * @returns a topologically sorted order or undefined if the graph contains at least one cycle.
 */
function topologicalSort(graph: Graph): string[] | undefined {
  const clonedGraph: Graph = {};
  for (const vertex in graph) {
    clonedGraph[vertex] = [...graph[vertex]];
  }

  const indegrees = calculateIndegrees(clonedGraph);
  const sourceVertices = Object.keys(indegrees).filter(vertex => indegrees[vertex] === 0);
  const order: string[] = [];
  while (sourceVertices.length !== 0) {
    const n = sourceVertices.pop();
    if (!n) {
      break;
    }
    order.push(n);
    while (clonedGraph[n].length !== 0) {
      const m = clonedGraph[n].pop();
      if (!m) {
        break;
      }
      --indegrees[m];
      if (indegrees[m] === 0) {
        sourceVertices.push(m);
      }
    }
    delete clonedGraph[n];
  }
  return Object.keys(clonedGraph).length === 0 ? order : undefined;
}

function arrayToMap(array: string[]): { [index: string]: number } {
  const result: { [index: string]: number } = {};
  for (let i = 0; i < array.length; ++i) {
    result[array[i]] = i;
  }
  return result;
}

function topologicalOrder(dependencies: string[][]): { [index: string]: number } | undefined {
  const graph = buildGraph(dependencies);
  const topologicallySorted = topologicalSort(graph);
  return topologicallySorted ? arrayToMap(topologicallySorted) : undefined;
}

export const dependencyGraphScheme = 'fury';

export class DependencyGraphContentProvider implements vscode.TextDocumentContentProvider {
  constructor(private workspaceState: vscode.Memento) { }

  provideTextDocumentContent(uri: vscode.Uri): string {
    const dependencies = this.workspaceState
      .get('dependencies', [])
      .map(dependency => {
        return '\t' + dependency[0] + '-->' + dependency[1] + ';';
      });

    return '::: mermaid\n'
      + 'graph TD;\n'
      + dependencies.join('\n')
      + '\n:::\n';
  }
}

export function sortDependencies(dependencies: string[][]): string[][] {
  const order = topologicalOrder(dependencies);
  return order ? dependencies.sort((a, b) => order[a[0]] < order[b[0]] ? 1 : -1) : dependencies;
}
