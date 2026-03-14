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

  // Flatten to sequential layers — one node per layer for strictly horizontal flow.
  // Preserves topological order but ensures no two nodes share a layer.
  const sortedNodes = [...nodes].sort((a, b) => (layers[a.id] || 0) - (layers[b.id] || 0));
  sortedNodes.forEach((n, i) => { layers[n.id] = i; });

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
  const nodeSize = 100;
  const padding = 40;
  const numLayers = maxLayer + 1;

  const positioned = nodes.map(n => {
    const layer = layers[n.id];
    const siblings = layerGroups[layer];
    const indexInLayer = siblings.indexOf(n);
    const numInLayer = siblings.length;

    let x, y;
    if (horizontal) {
      const layerSpacing = Math.max(nodeSize + 80, (containerWidth - padding * 2) / Math.max(numLayers, 1));
      const siblingSpacing = Math.max(nodeSize + 20, (containerHeight - padding * 2) / Math.max(numInLayer, 1));
      x = padding + layer * layerSpacing + layerSpacing / 2;
      y = padding + indexInLayer * siblingSpacing + siblingSpacing / 2;
    } else {
      const layerSpacing = Math.max(nodeSize + 40, (containerHeight - padding * 2) / Math.max(numLayers, 1));
      const siblingSpacing = Math.max(nodeSize + 40, (containerWidth - padding * 2) / Math.max(numInLayer, 1));
      x = padding + indexInLayer * siblingSpacing + siblingSpacing / 2;
      y = padding + layer * layerSpacing + layerSpacing / 2;
    }

    return { ...n, x, y, layer };
  });

  // Build positioned node lookup for edge validation
  const posNodeMap = {};
  positioned.forEach(n => { posNodeMap[n.id] = n; });

  // If no valid edges exist, synthesize a sequential chain
  let finalEdges = edges;
  const hasValidEdges = edges.some(e => posNodeMap[e.from] && posNodeMap[e.to]);
  if (!hasValidEdges) {
    finalEdges = [];
    for (let i = 0; i < positioned.length - 1; i++) {
      finalEdges.push({ from: positioned[i].id, to: positioned[i + 1].id });
    }
  }

  // Compute required dimensions
  const xs = positioned.map(n => n.x);
  const ys = positioned.map(n => n.y);
  const computedWidth = Math.max(containerWidth, Math.max(...xs) + padding + nodeSize / 2);
  const computedHeight = Math.max(containerHeight, Math.max(...ys) + padding + nodeSize / 2);

  return {
    nodes: positioned,
    edges: finalEdges,
    width: computedWidth,
    height: computedHeight,
  };
}

// Get SVG path between two positioned nodes
export function getEdgePath(fromNode, toNode, horizontal = true) {
  if (!fromNode || !toNode) return '';

  const nodeRadius = 48; // half of rendered node width (w-24 = 96px / 2)
  const x1 = fromNode.x;
  const y1 = fromNode.y;
  const x2 = toNode.x;
  const y2 = toNode.y;

  if (horizontal) {
    const startX = x1 + nodeRadius;
    const endX = x2 - nodeRadius;
    const dx = (endX - startX) * 0.4;
    return `M ${startX} ${y1} C ${startX + dx} ${y1}, ${endX - dx} ${y2}, ${endX} ${y2}`;
  } else {
    const startY = y1 + nodeRadius;
    const endY = y2 - nodeRadius;
    const dy = (endY - startY) * 0.4;
    return `M ${x1} ${startY} C ${x1} ${startY + dy}, ${x2} ${endY - dy}, ${x2} ${endY}`;
  }
}
