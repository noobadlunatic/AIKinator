import { useEffect, useRef, useCallback } from 'react';
import { TAXONOMY } from '../../data/taxonomy';

/**
 * Magnetic Field variant — cursor is a signal source that:
 * - Repels nearby nodes (parting/wake effect)
 * - Creates visible field distortion rings around cursor
 * - Sends signal ripples outward that activate nodes in sequence
 * - Active connections glow with accent color energy
 */

const NODE_COUNT = 40;
const CONNECTION_DIST = 170;
const FIELD_RADIUS = 180;       // How far the magnetic field reaches
const REPEL_STRENGTH = 0.04;    // Push force
const RETURN_SPEED = 0.02;      // Spring back speed
const MORPH_SPEED = 0.006;
const MORPH_INTERVAL = 10000;
const RIPPLE_SPEED = 200;       // px per second for the signal ripple
const RIPPLE_LIFETIME = 1200;   // ms before ripple fades

const NODE_COLORS = TAXONOMY.map((t) => {
  const hex = t.color;
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
});

// Accent color for field energy
const ACCENT = { r: 212, g: 118, b: 78 };

function isInExclusionZone(x, y, w, h) {
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
      homeX: x, homeY: y,
      targetX: x, targetY: y,
      radius: 2 + Math.random() * 2.5,
      colorIdx: i % NODE_COLORS.length,
      activation: 0, // 0-1, how "lit up" by signal
    });
  }
  return nodes;
}

export default function NeuralCanvasField() {
  const canvasRef = useRef(null);
  const nodesRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, active: false });
  const rippleRef = useRef(null); // { x, y, startTime }
  const lastMoveRef = useRef(0);
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
        const oldW = nodesRef.current._width || rect.width;
        const oldH = nodesRef.current._height || rect.height;
        const sx = rect.width / oldW;
        const sy = rect.height / oldH;
        for (const n of nodesRef.current) {
          n.x *= sx; n.y *= sy;
          n.homeX *= sx; n.homeY *= sy;
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

    function onMouseMove(e) {
      const rect = canvas.getBoundingClientRect();
      const now = Date.now();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;

      // Spawn a signal ripple on significant movement (throttled)
      if (now - lastMoveRef.current > 400) {
        rippleRef.current = { x: mouseRef.current.x, y: mouseRef.current.y, startTime: now };
        lastMoveRef.current = now;
      }
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }

    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);

    const observer = new IntersectionObserver(
      ([entry]) => { visibleRef.current = entry.isIntersecting; },
      { threshold: 0.05 }
    );
    observer.observe(canvas);

    morphTimerRef.current = setInterval(() => {
      if (nodesRef.current) {
        const rect = canvas.parentElement.getBoundingClientRect();
        for (const node of nodesRef.current) {
          const pos = generatePosition(rect.width, rect.height);
          node.targetX = pos.x;
          node.targetY = pos.y;
        }
      }
    }, MORPH_INTERVAL);

    function draw() {
      if (!visibleRef.current || !nodesRef.current) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      const nodes = nodesRef.current;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const mouse = mouseRef.current;
      const now = Date.now();

      ctx.clearRect(0, 0, w, h);

      // Check active ripple
      let ripple = rippleRef.current;
      let rippleRadius = 0;
      let rippleAlpha = 0;
      if (ripple) {
        const elapsed = now - ripple.startTime;
        if (elapsed > RIPPLE_LIFETIME) {
          rippleRef.current = null;
          ripple = null;
        } else {
          rippleRadius = (elapsed / 1000) * RIPPLE_SPEED;
          rippleAlpha = 1 - elapsed / RIPPLE_LIFETIME;
        }
      }

      // Update nodes
      for (const node of nodes) {
        // Morph toward target
        node.homeX += (node.targetX - node.homeX) * MORPH_SPEED;
        node.homeY += (node.targetY - node.homeY) * MORPH_SPEED;

        // Default: spring toward home
        let pushX = 0, pushY = 0;

        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < FIELD_RADIUS && dist > 0) {
            // Repel — push AWAY from cursor
            const force = (1 - dist / FIELD_RADIUS) * REPEL_STRENGTH;
            pushX = (dx / dist) * force * FIELD_RADIUS;
            pushY = (dy / dist) * force * FIELD_RADIUS;
          }
        }

        // Apply repulsion + spring return to home
        node.x += pushX + (node.homeX - node.x) * RETURN_SPEED;
        node.y += pushY + (node.homeY - node.y) * RETURN_SPEED;

        // Activation from ripple
        let targetActivation = 0;
        if (ripple && rippleRadius > 0) {
          const dx = node.x - ripple.x;
          const dy = node.y - ripple.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          // Node activates as the ripple passes through it
          const diff = Math.abs(dist - rippleRadius);
          if (diff < 40) {
            targetActivation = (1 - diff / 40) * rippleAlpha;
          }
        }

        // Also activate by proximity to cursor
        if (mouse.active) {
          const dx = node.x - mouse.x;
          const dy = node.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < FIELD_RADIUS) {
            targetActivation = Math.max(targetActivation, (1 - dist / FIELD_RADIUS) * 0.7);
          }
        }

        node.activation += (targetActivation - node.activation) * 0.1;
      }

      // Draw connections
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > CONNECTION_DIST) continue;

          const distFactor = 1 - dist / CONNECTION_DIST;
          const activation = Math.max(a.activation, b.activation);

          if (activation > 0.05) {
            // Active connection — glow with accent color
            const alpha = 0.08 + activation * 0.25;
            const lineWidth = 0.8 + activation * 1.2;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${alpha * distFactor})`;
            ctx.lineWidth = lineWidth;
            ctx.stroke();
          } else {
            // Passive connection
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(26, 26, 46, ${0.05 * distFactor})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw signal ripple ring
      if (ripple && rippleRadius > 0 && rippleAlpha > 0) {
        ctx.beginPath();
        ctx.arc(ripple.x, ripple.y, rippleRadius, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${rippleAlpha * 0.15})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw nodes
      for (const node of nodes) {
        const c = NODE_COLORS[node.colorIdx];
        const act = node.activation;
        const baseOpacity = 0.15;
        const opacity = baseOpacity + act * 0.5;
        const r = node.radius * (1 + act * 0.8);

        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);

        if (act > 0.1) {
          // Blend toward accent color when activated
          const blend = act * 0.6;
          const cr = Math.round(c.r * (1 - blend) + ACCENT.r * blend);
          const cg = Math.round(c.g * (1 - blend) + ACCENT.g * blend);
          const cb = Math.round(c.b * (1 - blend) + ACCENT.b * blend);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, ${opacity})`;
        } else {
          ctx.fillStyle = `rgba(${c.r}, ${c.g}, ${c.b}, ${opacity})`;
        }
        ctx.fill();

        // Glow halo on activated nodes
        if (act > 0.15) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, r * 4, 0, Math.PI * 2);
          const glow = ctx.createRadialGradient(node.x, node.y, r, node.x, node.y, r * 4);
          glow.addColorStop(0, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${act * 0.2})`);
          glow.addColorStop(1, `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, 0)`);
          ctx.fillStyle = glow;
          ctx.fill();
        }
      }

      // Field distortion rings around cursor
      if (mouse.active) {
        for (let ring = 1; ring <= 3; ring++) {
          const radius = ring * 45;
          const alpha = (0.06 / ring);
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, radius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${ACCENT.r}, ${ACCENT.g}, ${ACCENT.b}, ${alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    if (prefersReduced) {
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
