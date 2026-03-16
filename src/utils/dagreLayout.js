import dagre from '@dagrejs/dagre';

const NODE_WIDTH = 180;
const NODE_HEIGHT = 110;

export function getLayoutedElements(nodes, edges) {
  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({
    rankdir: 'LR',
    nodesep: 150,
    ranksep: 160,
    marginx: 50,
    marginy: 50,
  });

  // If no valid edges, synthesize a sequential chain
  const nodeIds = new Set(nodes.map(n => n.id));
  let validEdges = edges.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

  if (validEdges.length === 0 && nodes.length > 1) {
    validEdges = nodes.slice(0, -1).map((node, i) => ({
      id: `e-seq-${node.id}-${nodes[i + 1].id}`,
      source: node.id,
      target: nodes[i + 1].id,
      type: 'smoothstep',
    }));
  }

  nodes.forEach(node => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  validEdges.forEach(edge => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  let maxX = 0;
  let maxY = 0;

  const layoutedNodes = nodes.map(node => {
    const dagNode = g.node(node.id);
    const x = dagNode.x - NODE_WIDTH / 2;
    const y = dagNode.y - NODE_HEIGHT / 2;
    maxX = Math.max(maxX, x + NODE_WIDTH);
    maxY = Math.max(maxY, y + NODE_HEIGHT);
    return {
      ...node,
      position: { x, y },
    };
  });

  // Add margins to the computed dimensions
  const width = maxX + 160;
  const height = maxY + 80;

  return { nodes: layoutedNodes, edges: validEdges, width, height };
}
