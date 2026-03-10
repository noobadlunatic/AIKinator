// Layered DAG layout algorithm for journey map visualization.
// Assigns (x, y) positions to nodes based on topological order.

export function computeLayout(nodes, edges, containerWidth, containerHeight, horizontal = true) {
  if (!nodes?.length) return { nodes: [], edges: [] };

  // Build adjacency and in-degree maps
  const adj = {};
  const inDegree = {};
  nodes.forEach(n => { adj[n.id] = []; inDegree[n.id] = 0; });
  edges.forEach(e => {
    if (adj[e.from]) adj[e.from].push(e.to);
    if (inDegree[e.to] !== undefined) inDegree[e.to]++;
  });

  // Topological sort (BFS / Kahn's algorithm) to assign layers
  const queue = [];
  const layers = {};
  Object.entries(inDegree).forEach(([id, deg]) => {
    if (deg === 0) { queue.push(id); layers[id] = 0; }
  });

  while (queue.length > 0) {
    const id = queue.shift();
    for (const next of (adj[id] || [])) {
      inDegree[next]--;
      layers[next] = Math.max(layers[next] || 0, layers[id] + 1);
      if (inDegree[next] === 0) queue.push(next);
    }
  }

  // Handle disconnected nodes
  nodes.forEach(n => {
    if (layers[n.id] === undefined) layers[n.id] = 0;
  });

  // Group nodes by layer
  const layerGroups = {};
  let maxLayer = 0;
  nodes.forEach(n => {
    const layer = layers[n.id];
    if (!layerGroups[layer]) layerGroups[layer] = [];
    layerGroups[layer].push(n);
    maxLayer = Math.max(maxLayer, layer);
  });

  // Compute positions
  const nodeSize = 120;
  const padding = 40;
  const numLayers = maxLayer + 1;

  const positioned = nodes.map(n => {
    const layer = layers[n.id];
    const siblings = layerGroups[layer];
    const indexInLayer = siblings.indexOf(n);
    const numInLayer = siblings.length;

    let x, y;
    if (horizontal) {
      const layerSpacing = Math.max(nodeSize + 40, (containerWidth - padding * 2) / Math.max(numLayers, 1));
      const siblingSpacing = Math.max(nodeSize, (containerHeight - padding * 2) / Math.max(numInLayer, 1));
      x = padding + layer * layerSpacing + layerSpacing / 2;
      y = padding + indexInLayer * siblingSpacing + siblingSpacing / 2;
    } else {
      const layerSpacing = Math.max(nodeSize + 20, (containerHeight - padding * 2) / Math.max(numLayers, 1));
      const siblingSpacing = Math.max(nodeSize + 20, (containerWidth - padding * 2) / Math.max(numInLayer, 1));
      x = padding + indexInLayer * siblingSpacing + siblingSpacing / 2;
      y = padding + layer * layerSpacing + layerSpacing / 2;
    }

    return { ...n, x, y, layer };
  });

  // Compute required dimensions
  const xs = positioned.map(n => n.x);
  const ys = positioned.map(n => n.y);
  const computedWidth = Math.max(containerWidth, Math.max(...xs) + padding + nodeSize / 2);
  const computedHeight = Math.max(containerHeight, Math.max(...ys) + padding + nodeSize / 2);

  return {
    nodes: positioned,
    edges: edges,
    width: computedWidth,
    height: computedHeight,
  };
}

// Get SVG path between two positioned nodes
export function getEdgePath(fromNode, toNode, horizontal = true) {
  if (!fromNode || !toNode) return '';

  const offset = 40;
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  if (horizontal) {
    const cx1 = x1 + offset;
    const cx2 = x2 - offset;
    return `M ${x1 + 50} ${y1} C ${cx1 + 50} ${y1}, ${cx2 - 50} ${y2}, ${x2 - 50} ${y2}`;
  } else {
    const cy1 = y1 + offset;
    const cy2 = y2 - offset;
    return `M ${x1} ${y1 + 40} C ${x1} ${cy1 + 40}, ${x2} ${cy2 - 40}, ${x2} ${y2 - 40}`;
  }
}
