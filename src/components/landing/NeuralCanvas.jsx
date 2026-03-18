import { useEffect, useRef, useCallback } from 'react';
import { TAXONOMY } from '../../data/taxonomy';

const NODE_COUNT = 35;
const CONNECTION_DIST = 180;
const MOUSE_RADIUS = 160;
const MOUSE_PULL = 0.025;
const RETURN_SPEED = 0.015;
const MORPH_SPEED = 0.008;
const MORPH_INTERVAL = 8000;
const BASE_NODE_OPACITY = 0.2;
const BASE_LINE_OPACITY = 0.07;
const ACTIVE_NODE_OPACITY = 0.55;
const ACTIVE_LINE_OPACITY = 0.22;

// Colors from taxonomy, parsed to RGB for canvas
const NODE_COLORS = TAXONOMY.map((t) => {
  const hex = t.color;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
});

function isInExclusionZone(x, y, w, h) {
  // Center 36% width, 40% height — where text content sits
  const cx = w / 2, cy = h * 0.42;
  const zw = w * 0.36, zh = h * 0.40;
  return (
    x > cx - zw / 2 && x < cx + zw / 2 &&
    y > cy - zh / 2 && y < cy + zh / 2
  );
}

function generatePosition(w, h) {
  let x, y, attempts = 0;
  do {
    x = Math.random() * w;
    y = Math.random() * h;
    attempts++;
  } while (isInExclusionZone(x, y, w, h) && attempts < 20);
  return { x, y };
}

function createNodes(w, h) {
  const nodes = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const { x, y } = generatePosition(w, h);
    nodes.push({
      x, y,
      baseX: x, baseY: y,
      targetX: x, targetY: y,
      radius: 2 + Math.random() * 3,
      colorIdx: i % NODE_COLORS.length,
      opacity: BASE_NODE_OPACITY,
    });
  }
  return nodes;
}

function morphTargets(nodes, w, h) {
  for (const node of nodes) {
    const { x, y } = generatePosition(w, h);
    node.targetX = x;
    node.targetY = y;
  }
}

export default function NeuralCanvas() {
  const canvasRef = useRef(null);
  const nodesRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const rafRef = useRef(null);
  const morphTimerRef = useRef(null);
  const visibleRef = useRef(true);

  const initNodes = useCallback((w, h) => {
    nodesRef.current = createNodes(w, h);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      if (!nodesRef.current) {
        initNodes(rect.width, rect.height);
      } else {
        // Rescale existing nodes to new dimensions
        const oldW = nodesRef.current._width || rect.width;
        const oldH = nodesRef.current._height || rect.height;
        const sx = rect.width / oldW;
        const sy = rect.height / oldH;
        for (const n of nodesRef.current) {
          n.x *= sx; n.y *= sy;
          n.baseX *= sx; n.baseY *= sy;
          n.targetX *= sx; n.targetY *= sy;
        }
      }
      if (nodesRef.current) {
        nodesRef.current._width = rect.width;
        nodesRef.current._height = rect.height;
      }
    }

    resize();
    window.addEventListener('resize', resize);

    // Mouse tracking
    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    // Visibility observer
    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Morph timer
    morphTimerRef.current = setInterval(() => {
      if (nodesRef.current) {
        const rect = canvas.parentElement.getBoundingClientRect();
        morphTargets(nodesRef.current, rect.width, rect.height);
      }
    }, MORPH_INTERVAL);

    // Render loop
    function draw() {
      if (!visibleRef.current || !nodesRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const nodes = nodesRef.current;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mouse = mouseRef.current;

      ctx.clearRect(0, 0, w, h);

      // Update nodes
      for (const node of nodes) {
        // Morph toward target
        node.x += (node.targetX - node.x) * MORPH_SPEED;
        node.y += (node.targetY - node.y) * MORPH_SPEED;

        // Mouse magnetic pull
        let proximity = 0;
        if (mouse.active) {
          const dx = mouse.x - node.x;
          const dy = mouse.y - node.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < MOUSE_RADIUS) {
            proximity = 1 - dist / MOUSE_RADIUS;
            node.x += dx * MOUSE_PULL * proximity;
            node.y += dy * MOUSE_PULL * proximity;
          }
        }

        // Spring back when not near mouse
        if (proximity === 0) {
          node.x += (node.targetX - node.x) * RETURN_SPEED;
          node.y += (node.targetY - node.y) * RETURN_SPEED;
        }

        // Opacity based on proximity
        const targetOpacity = proximity > 0
          ? BASE_NODE_OPACITY + (ACTIVE_NODE_OPACITY - BASE_NODE_OPACITY) * proximity
          : BASE_NODE_OPACITY;
        node.opacity += (targetOpacity - node.opacity) * 0.08;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECTION_DIST) continue;

          const distFactor = 1 - dist / CONNECTION_DIST;
          let lineOpacity = BASE_LINE_OPACITY * distFactor;

          // Brighten connections near mouse
          if (mouse.active) {
            const midX = (a.x + b.x) / 2;
            const midY = (a.y + b.y) / 2;
            const mdx = mouse.x - midX, mdy = mouse.y - midY;
            const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
            if (mDist < MOUSE_RADIUS) {
              const mProx = 1 - mDist / MOUSE_RADIUS;
              lineOpacity = Math.max(lineOpacity, ACTIVE_LINE_OPACITY * mProx * distFactor);
            }
          }

          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(26, 26, 46, ${lineOpacity})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // Draw nodes
      for (const node of nodes) {
        const c = NODE_COLORS[node.colorIdx];
        const r = node.radius * (1 + (node.opacity - BASE_NODE_OPACITY) * 1.5);

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${node.opacity})`;
        ctx.fill();

        // Soft glow for brighter nodes
        if (node.opacity > BASE_NODE_OPACITY + 0.05) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 3);
          glow.addColorStop(0, `rgba(${c.r}, ${c.g}, ${c.b}, ${(node.opacity - BASE_NODE_OPACITY) * 0.3})`);
          glow.addColorStop(1, `rgba(${c.r}, ${c.g}, ${c.b}, 0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      // Cursor glow halo
      if (mouse.active) {
        const grad = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, MOUSE_RADIUS * 0.7);
        grad.addColorStop(0, 'rgba(212, 118, 78, 0.04)');
        grad.addColorStop(1, 'rgba(212, 118, 78, 0)');
        ctx.beginPath();
        ctx.arc(mouse.x, mouse.y, MOUSE_RADIUS * 0.7, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    if (prefersReduced) {
      // Single static frame
      requestAnimationFrame(() => {
        draw();
        cancelAnimationFrame(rafRef.current);
      });
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      clearInterval(morphTimerRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();
    };
  }, [initNodes]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
}
