import { useEffect, useRef } from 'react';
import { TAXONOMY } from '../../data/taxonomy';

/**
 * Aurora borealis gradient streams.
 *
 * Multiple taxonomy-colored streams flow from left → through cursor → center.
 * Colors randomly rotate every ~8s through all 10 AI-UX interventions.
 * 3 accent streams exit center → right, angled by cursor position.
 * Central circle filled white for clean content area.
 */

const PALETTE = TAXONOMY.map((t) => {
  const hex = t.color;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
});
const ACCENT = { r: 212, g: 118, b: 78 };
const BG_COLOR = { r: 250, g: 248, b: 245 }; // #faf8f5

const STREAM_COUNT = 4;
const STREAM_WIDTH = 50;
const STREAM_OPACITY = 0.09;
const STREAM_SEGMENTS = 50;
const OUT_STREAM_COUNT = 3;
const COLOR_ROTATE_MS = 8000;
const COLOR_TRANSITION_MS = 1200;

function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function pickIndices(n, max) {
  const indices = [];
  const used = new Set();
  while (indices.length < n && indices.length < max) {
    const i = Math.floor(Math.random() * max);
    if (!used.has(i)) { used.add(i); indices.push(i); }
  }
  return indices;
}

/* ── dynamic neural network: compute target positions from entry/exit Ys ── */
const CIRCLE_NET_COLUMNS = 5; // entry, inner1, center, inner2, exit
const CIRCLE_NET_LERP = 0.04;

function computeCircleNetTargets(cx, cy, r, entryYs, exitYs) {
  const innerR = r * 0.95;
  const colXs = [-1.0, -0.5, 0, 0.5, 1.0].map(f => cx + f * innerR);
  const targets = []; // { x, y, col }

  // Column 0: entry nodes (one per incoming stream)
  for (const ey of entryYs) {
    targets.push({ x: colXs[0], y: ey, col: 0 });
  }

  // Column 1: converging toward center — lerp 60% from entry spread toward cy
  const entryAvg = entryYs.reduce((a, b) => a + b, 0) / (entryYs.length || 1);
  const entrySpread = Math.max(40, ...entryYs.map(y => Math.abs(y - entryAvg))) * 1.1;
  for (let i = 0; i < 3; i++) {
    const frac = (i + 0.5) / 3;
    const rawY = entryAvg - entrySpread + frac * entrySpread * 2;
    const y = rawY * 0.4 + cy * 0.6; // pull 60% toward center
    targets.push({ x: colXs[1], y, col: 1 });
  }

  // Column 2: tightest convergence — very close to cy
  const centerSpread = innerR * 0.08;
  for (let i = 0; i < 2; i++) {
    const frac = (i + 0.5) / 2;
    targets.push({ x: colXs[2], y: cy - centerSpread + frac * centerSpread * 2, col: 2 });
  }

  // Column 3: diverging from center — lerp 60% from cy toward exit spread
  const exitAvg = exitYs.reduce((a, b) => a + b, 0) / (exitYs.length || 1);
  const exitSpread = Math.max(40, ...exitYs.map(y => Math.abs(y - exitAvg))) * 1.1;
  for (let i = 0; i < 3; i++) {
    const frac = (i + 0.5) / 3;
    const rawY = exitAvg - exitSpread + frac * exitSpread * 2;
    const y = cy * 0.4 + rawY * 0.6; // pull 60% toward exit positions
    targets.push({ x: colXs[3], y, col: 3 });
  }

  // Column 4: exit nodes (one per outgoing stream)
  for (const ey of exitYs) {
    targets.push({ x: colXs[4], y: ey, col: 4 });
  }

  // Clamp all targets inside circle
  for (const t of targets) {
    const dx = t.x - cx, dy = t.y - cy;
    const d = Math.sqrt(dx * dx + dy * dy);
    if (d > innerR) {
      const scale = innerR / d;
      t.x = cx + dx * scale;
      t.y = cy + dy * scale;
    }
  }

  return targets;
}

function computeCircleNetEdges(nodes) {
  const edges = [];
  // Connect each node to 2 nearest in next column only (no same-column edges)
  for (let i = 0; i < nodes.length; i++) {
    const ni = nodes[i];
    const candidates = [];
    for (let j = 0; j < nodes.length; j++) {
      if (i === j) continue;
      const nj = nodes[j];
      if (nj.col - ni.col === 1) {
        const dy = Math.abs(ni.y - nj.y);
        candidates.push({ j, dy });
      }
    }
    candidates.sort((a, b) => a.dy - b.dy);
    for (let c = 0; c < Math.min(2, candidates.length); c++) {
      edges.push([i, candidates[c].j]);
    }
  }
  return edges;
}

function lerpColor(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}

export default function StereogramCanvas() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1, y: -1, active: false });
  const smoothRef = useRef({ x: -1, y: -1 });
  const rafRef = useRef(null);
  const visibleRef = useRef(true);
  const streamsRef = useRef(null);
  const colorsRef = useRef(null);
  const circleNetRef = useRef(null); // { nodes: [{x,y,col}], edges: [[i,j]] }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let w = 0, h = 0;

    function initStreams() {
      const colorIndices = pickIndices(STREAM_COUNT, PALETTE.length);
      const streams = [];
      for (let i = 0; i < STREAM_COUNT; i++) {
        streams.push({
          startY: 0.15 + (i / (STREAM_COUNT - 1)) * 0.7,
          phase: Math.random() * Math.PI * 2,
          freq: 0.0004 + Math.random() * 0.0003,
          amp: 30 + Math.random() * 40,
          width: STREAM_WIDTH + Math.random() * 20 - 10,
          opacity: STREAM_OPACITY * (0.8 + Math.random() * 0.4),
        });
      }
      streamsRef.current = streams;
      colorsRef.current = {
        current: colorIndices,
        target: colorIndices,
        lastSwap: performance.now(),
        transitioning: false,
      };
    }

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = `${w}px`; canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!streamsRef.current) initStreams();
      circleNetRef.current = null; // reset on resize, will rebuild dynamically
    }
    resize();
    window.addEventListener('resize', resize);

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() { mouseRef.current.active = false; }
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    // Outgoing stream definitions (accent with variation)
    const outStreams = [];
    for (let i = 0; i < OUT_STREAM_COUNT; i++) {
      outStreams.push({
        phase: Math.random() * Math.PI * 2,
        freq: 0.0004 + Math.random() * 0.0002,
        amp: 20 + Math.random() * 15,
        width: STREAM_WIDTH * (0.85 + i * 0.15),
        opacity: STREAM_OPACITY * (1.1 - i * 0.15),
        // Color variation: shift accent hue slightly
        color: {
          r: Math.min(255, ACCENT.r + (i - 1) * 15),
          g: Math.max(0, ACCENT.g + (i - 1) * 8),
          b: Math.max(0, ACCENT.b + (i - 1) * 12),
        },
      });
    }

    function draw(now) {
      rafRef.current = requestAnimationFrame(draw);
      if (!visibleRef.current || !streamsRef.current || !colorsRef.current) return;

      const mouse = mouseRef.current;
      const smooth = smoothRef.current;
      const streams = streamsRef.current;
      const colors = colorsRef.current;

      // ── Rotate colors every 8s ──
      const timeSinceSwap = now - colors.lastSwap;
      if (timeSinceSwap > COLOR_ROTATE_MS && !colors.transitioning) {
        colors.target = pickIndices(STREAM_COUNT, PALETTE.length);
        colors.transitioning = true;
        colors.transitionStart = now;
      }
      if (colors.transitioning) {
        const elapsed = now - colors.transitionStart;
        if (elapsed >= COLOR_TRANSITION_MS) {
          colors.current = colors.target.slice();
          colors.transitioning = false;
          colors.lastSwap = now;
        }
      }
      const colorTransitionT = colors.transitioning
        ? Math.min(1, (now - colors.transitionStart) / COLOR_TRANSITION_MS)
        : 0;

      // Smooth cursor
      const defaultX = w * 0.35;
      const defaultY = h * 0.44;
      const targetX = mouse.active ? mouse.x : defaultX;
      const targetY = mouse.active ? mouse.y : defaultY;
      smooth.x += (targetX - smooth.x) * 0.05;
      smooth.y += (targetY - smooth.y) * 0.05;
      if (smooth.x < 0) { smooth.x = defaultX; smooth.y = defaultY; }

      ctx.clearRect(0, 0, w, h);

      const cx = w / 2, cy = h * 0.44;
      const circleR = Math.min(w, h) * 0.44;

      // ─── Incoming streams (left → cursor → center) ───
      for (let si = 0; si < streams.length; si++) {
        const stream = streams[si];

        // Get interpolated color
        const fromColor = PALETTE[colors.current[si]];
        const toColor = PALETTE[colors.target[si]];
        const c = colors.transitioning ? lerpColor(fromColor, toColor, colorTransitionT) : fromColor;

        const wave = Math.sin(now * stream.freq + stream.phase) * stream.amp;
        const wave2 = Math.cos(now * stream.freq * 0.7 + stream.phase + 1) * stream.amp * 0.5;
        const startY = stream.startY * h + wave;

        const p0x = -20, p0y = startY;
        const p1x = smooth.x * 0.45, p1y = smooth.y + wave2 * 0.6;
        const p2x = smooth.x + (cx - smooth.x) * 0.5, p2y = cy + wave2 * 0.3;
        const p3x = cx, p3y = cy;

        const sw = stream.width;
        const baseOpacity = stream.opacity * (0.85 + Math.sin(now * 0.001 + stream.phase) * 0.15);

        for (let s = 0; s <= STREAM_SEGMENTS; s++) {
          const t = s / STREAM_SEGMENTS;
          const x = bezier(t, p0x, p1x, p2x, p3x);
          const y = bezier(t, p0y, p1y, p2y, p3y);

          const edgeFade = Math.min(t * 4, 1) * Math.min((1 - t) * 3, 1);
          const opacity = baseOpacity * edgeFade;
          if (opacity < 0.002) continue;

          const radius = sw * (0.6 + 0.4 * (1 - t));

          ctx.globalAlpha = opacity;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.6)`);
          grad.addColorStop(0.4, `rgba(${c.r},${c.g},${c.b},0.2)`);
          grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ─── Outgoing streams (center → right, angled by cursor) ───
      const angleOffset = (smooth.y - cy) / h * 0.6; // cursor Y influence
      const fanSpread = 0.18; // radians between streams

      for (let oi = 0; oi < outStreams.length; oi++) {
        const os = outStreams[oi];
        const c = os.color;

        // Fan angle: center stream + spread
        const streamAngle = angleOffset + (oi - (OUT_STREAM_COUNT - 1) / 2) * fanSpread;
        const rightDist = w - cx;

        const wave = Math.sin(now * os.freq + os.phase) * os.amp;
        const wave2 = Math.cos(now * os.freq * 0.7 + os.phase + 1) * os.amp * 0.5;

        // End Y position based on angle
        const endY = cy + Math.sin(streamAngle) * rightDist * 0.8 + wave * 0.4;

        const p0x = cx, p0y = cy;
        const p1x = cx + rightDist * 0.3, p1y = cy + (endY - cy) * 0.25 + wave * 0.3;
        const p2x = cx + rightDist * 0.65, p2y = cy + (endY - cy) * 0.7 + wave2;
        const p3x = w + 30, p3y = endY;

        const sw = os.width;
        const baseOpacity = os.opacity * (0.85 + Math.sin(now * 0.0008 + os.phase) * 0.15);

        for (let s = 0; s <= STREAM_SEGMENTS; s++) {
          const t = s / STREAM_SEGMENTS;
          const x = bezier(t, p0x, p1x, p2x, p3x);
          const y = bezier(t, p0y, p1y, p2y, p3y);

          const edgeFade = Math.min(t * 4, 1) * Math.min((1 - t) * 5, 1);
          const opacity = baseOpacity * edgeFade;
          if (opacity < 0.002) continue;

          const radius = sw * (0.5 + 0.5 * t);

          ctx.globalAlpha = opacity;
          const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          grad.addColorStop(0, `rgba(${c.r},${c.g},${c.b},0.6)`);
          grad.addColorStop(0.4, `rgba(${c.r},${c.g},${c.b},0.2)`);
          grad.addColorStop(1, `rgba(${c.r},${c.g},${c.b},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // ─── Central Circle (white fill + dynamic neural network + stroke) ───
      ctx.globalAlpha = 1;
      ctx.fillStyle = 'rgb(255,255,255)';
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
      ctx.fill();

      // ─── Calculate stream entry/exit Y positions ───
      const entryYs = [];
      for (let si = 0; si < streams.length; si++) {
        const stream = streams[si];
        const wave = Math.sin(now * stream.freq + stream.phase) * stream.amp;
        const wave2 = Math.cos(now * stream.freq * 0.7 + stream.phase + 1) * stream.amp * 0.5;
        const startY = stream.startY * h + wave;
        const p0x = -20, p0y = startY;
        const p1x = smooth.x * 0.45, p1y = smooth.y + wave2 * 0.6;
        const p2x = smooth.x + (cx - smooth.x) * 0.5, p2y = cy + wave2 * 0.3;
        const p3x = cx, p3y = cy;
        const targetX = cx - circleR;
        for (let st = 0; st <= 40; st++) {
          const t = st / 40;
          if (bezier(t, p0x, p1x, p2x, p3x) >= targetX) {
            entryYs.push(bezier(t, p0y, p1y, p2y, p3y));
            break;
          }
        }
      }
      if (entryYs.length === 0) entryYs.push(cy);

      const exitYs = [];
      for (let oi = 0; oi < outStreams.length; oi++) {
        const os = outStreams[oi];
        const sa = angleOffset + (oi - (OUT_STREAM_COUNT - 1) / 2) * fanSpread;
        const rd = w - cx;
        const wv = Math.sin(now * os.freq + os.phase) * os.amp;
        const endY = cy + Math.sin(sa) * rd * 0.8 + wv * 0.4;
        // Approximate exit Y at circle right boundary
        const exitFrac = circleR / rd;
        exitYs.push(cy + (endY - cy) * exitFrac * 1.2);
      }
      if (exitYs.length === 0) exitYs.push(cy);

      // ─── Dynamic neural network inside circle ───
      const targets = computeCircleNetTargets(cx, cy, circleR, entryYs, exitYs);

      // Initialize or update circle network nodes
      let cNet = circleNetRef.current;
      if (!cNet || cNet.nodes.length !== targets.length) {
        // Initialize: place nodes at target positions
        cNet = {
          nodes: targets.map(t => ({ x: t.x, y: t.y, col: t.col })),
          edges: [],
        };
        cNet.edges = computeCircleNetEdges(cNet.nodes);
        circleNetRef.current = cNet;
      } else {
        // Lerp current positions toward targets
        for (let i = 0; i < cNet.nodes.length; i++) {
          cNet.nodes[i].x += (targets[i].x - cNet.nodes[i].x) * CIRCLE_NET_LERP;
          cNet.nodes[i].y += (targets[i].y - cNet.nodes[i].y) * CIRCLE_NET_LERP;
          cNet.nodes[i].col = targets[i].col;
        }
        // Recompute edges based on updated positions
        cNet.edges = computeCircleNetEdges(cNet.nodes);
      }

      // Draw clipped to circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, circleR - 1, 0, Math.PI * 2);
      ctx.clip();

      // Edges — fade toward center
      ctx.strokeStyle = 'rgb(26,26,46)';
      ctx.lineWidth = 0.6;
      for (const [ai, bi] of cNet.edges) {
        const a = cNet.nodes[ai], b = cNet.nodes[bi];
        const mx = (a.x + b.x) / 2;
        const distFactor = Math.min(1, Math.abs(mx - cx) / circleR);
        ctx.globalAlpha = 0.09 * (0.15 + 0.85 * distFactor);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }

      // Nodes — fade toward center
      ctx.fillStyle = 'rgb(26,26,46)';
      for (const node of cNet.nodes) {
        const distFactor = Math.min(1, Math.abs(node.x - cx) / circleR);
        ctx.globalAlpha = 0.14 * (0.15 + 0.85 * distFactor);
        ctx.beginPath();
        ctx.arc(node.x, node.y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();

      // Subtle stroke
      ctx.globalAlpha = 0.06;
      ctx.strokeStyle = 'rgb(26,26,46)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, circleR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;
    }

    if (prefersReduced) {
      if (!streamsRef.current) initStreams();
      draw(performance.now());
      cancelAnimationFrame(rafRef.current);
    } else {
      rafRef.current = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseleave', onMouseLeave);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    />
  );
}
