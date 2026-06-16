import { useEffect, useRef } from 'react';

/**
 * COMPLETE PARTICLE SYSTEM REWRITE — 2025
 * 
 * Changes:
 * - 3D z-axis: particles now fly in depth (toward/away from viewer)
 * - Minimal connections: max 1 nearest neighbor within 45px — no clusters
 * - Strong mouse attraction: particles orbit and follow mouse plastically
 * - Size/alpha/brightness vary by z-depth
 * - Simple thin threads only — no more gum-membrane radial glows
 * - Depth-sorted rendering for correct z-ordering
 * - Higher repulsion + grid-based initial distribution to prevent clustering
 */

interface Particle {
  // 2D screen position
  x: number;
  y: number;
  // Z-depth: -1 = far behind, 0 = mid, +1 = close to viewer
  z: number;
  // Velocity in 3D
  vx: number;
  vy: number;
  vz: number;
  baseVx: number;
  baseVy: number;
  baseVz: number;
  // Visual properties
  baseSize: number;      // size at z=0
  opacity: number;
  pulsePhase: number;
  pulseSpeed: number;
  depth: number;         // 0-1, used for internal calculations
  hue: number;
  sparklePhase: number;
  sparkleSpeed: number;
}

interface WindGust {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  radius: number;
  strength: number;
  life: number;
  maxLife: number;
  swirlDir: number;
}

/** Spatial hash for 2D cell lookup */
function cellKey(cx: number, cy: number): string {
  return `${cx},${cy}`;
}

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const gustsRef = useRef<WindGust[]>([]);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastGustSpawnRef = useRef(0);
  const nextGustTimeRef = useRef(3000 + Math.random() * 4000);
  const isAndroidRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const getThemeColors = () => {
      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      return {
        isDark,
        particleCore: isDark ? '100, 255, 230' : '100, 255, 220',
        particleGlow: isDark ? '0, 220, 200' : '0, 210, 190',
        connection: isDark ? '0, 200, 180' : '0, 190, 170',
        mouseConnection: isDark ? '80, 255, 240' : '60, 245, 230',
      };
    };

    let lastW = 0;
    let lastH = 0;

    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Only reinit if dimensions changed significantly (>15% — filters out mobile URL bar)
      const areaChange = Math.abs(w * h - lastW * lastH) / (lastW * lastH || 1);
      const needsReinit = areaChange > 0.15 || lastW === 0;
      
      canvas.width = w;
      canvas.height = h;
      lastW = w;
      lastH = h;
      
      isAndroidRef.current = /android/i.test(navigator.userAgent);
      if (needsReinit) {
        initParticles();
        gustsRef.current = [];
      }
    };

    /**
     * Grid-based distribution to prevent clustering.
     * Particles are placed on a grid with random jitter, then given random velocities.
     * This ensures even spatial distribution while maintaining organic movement.
     */
    const initParticles = () => {
      const area = canvas.width * canvas.height;
      // Fewer particles — quality over quantity, prevents cluttered look
      const baseCount = Math.floor(area / 6000);
      const cap = isAndroidRef.current ? 30 : 40; // Aggressively reduced for performance
      const count = Math.min(cap, baseCount);
      
      // Grid-based placement: divide canvas into cells, 1 particle per cell + jitter
      const cols = Math.ceil(Math.sqrt(count * (canvas.width / canvas.height)));
      const rows = Math.ceil(count / cols);
      const cellW = canvas.width / cols;
      const cellH = canvas.height / rows;
      
      particlesRef.current = [];
      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          if (particlesRef.current.length >= count) break;
          particlesRef.current.push(createParticle(canvas, i * cellW + cellW * 0.5, j * cellH + cellH * 0.5));
        }
      }
      // Add any remaining (if count > cols*rows, fill randomly)
      while (particlesRef.current.length < count) {
        particlesRef.current.push(createParticle(canvas, Math.random() * canvas.width, Math.random() * canvas.height));
      }
    };

    /**
     * Create a particle at a specific position (for grid-based init).
     * z is random: some particles appear behind (z<0), some in front (z>0)
     */    const createParticle = (canvas: HTMLCanvasElement, px?: number, py?: number): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.2 + Math.random() * 2.5; // VERY fast base speed
      const depth = Math.random();
      // Z-distribution: some particles fly toward viewer, some away
      const z = (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
      const baseSize = 1.0 + Math.random() * 2.2;
      const vx = Math.cos(angle) * speed;
      const vy = Math.sin(angle) * speed;
      const vz = (Math.random() - 0.5) * 0.4; // Faster z-drift

      const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
      const hue = isDark ? (Math.random() * 20 - 10) : 0;

      return {
        x: px ?? Math.random() * canvas.width,
        y: py ?? Math.random() * canvas.height,
        z,
        vx,
        vy,
        vz,
        baseVx: vx,
        baseVy: vy,
        baseVz: vz,
        baseSize,
        opacity: 0.5 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.025 + Math.random() * 0.06, // Faster pulsing for more life
        depth,
        hue,
        sparklePhase: Math.random() * Math.PI * 2,
        sparkleSpeed: 0.04 + Math.random() * 0.08,
      };
    };

    /**
     * Draw a particle with z-depth scaling:
     * - Closer particles (z>0): larger, brighter, more blurred
     * - Far particles (z<0): smaller, dimmer, sharper
     */
    const drawGlowingParticle = (
      x: number, y: number, z: number,
      size: number, alpha: number,
      coreColor: string, glowColor: string, blurPx: number, sparkleIntensity: number
    ) => {
      // Z-depth factor: positive z = closer = bigger/brighter
      const zFactor = 1 + z * 0.8;          // ~0.2 to 1.8
      const displaySize = size * zFactor;
      const displayAlpha = alpha * (0.4 + zFactor * 0.6);
      const displayBlur = blurPx * (2 - zFactor * 0.5); // far=sharper, near=blurrier
      
      const useBlur = displayBlur > 0.8;
      if (useBlur) ctx.filter = `blur(${displayBlur}px)`;

      // Outer glow
      const outerGrad = ctx.createRadialGradient(x, y, 0, x, y, displaySize * 2.0);
      outerGrad.addColorStop(0, `rgba(${glowColor}, ${displayAlpha * 0.4})`);
      outerGrad.addColorStop(0.5, `rgba(${glowColor}, ${displayAlpha * 0.12})`);
      outerGrad.addColorStop(1, `rgba(${glowColor}, 0)`);
      ctx.beginPath();
      ctx.arc(x, y, displaySize * 2.0, 0, Math.PI * 2);
      ctx.fillStyle = outerGrad;
      ctx.fill();

      ctx.filter = 'none';

      // Core bright point
      const coreAlpha = displayAlpha * (0.7 + sparkleIntensity * 0.5);
      const coreGrad = ctx.createRadialGradient(x, y, 0, x, y, displaySize * 0.5);
      coreGrad.addColorStop(0, `rgba(255, 255, 255, ${coreAlpha})`);
      coreGrad.addColorStop(0.4, `rgba(${coreColor}, ${coreAlpha * 0.85})`);
      coreGrad.addColorStop(1, `rgba(${coreColor}, 0)`);
      ctx.beginPath();
      ctx.arc(x, y, displaySize * 0.5, 0, Math.PI * 2);
      ctx.fillStyle = coreGrad;
      ctx.fill();

      // Sparkle point for close particles
      if (sparkleIntensity > 0.6 && zFactor > 0.7 && displaySize > 1.2) {
        ctx.beginPath();
        ctx.arc(x, y, displaySize * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleIntensity * displayAlpha})`;
        ctx.fill();
      }
    };

    // ================================================================
    // SPATIAL HASHING
    // ================================================================
    const CELL_SIZE = 100;

    const buildSpatialGrid = (ps: Particle[]): Map<string, Particle[]> => {
      const grid = new Map<string, Particle[]>();
      for (const p of ps) {
        const cx = Math.floor(p.x / CELL_SIZE);
        const cy = Math.floor(p.y / CELL_SIZE);
        const key = cellKey(cx, cy);
        let cell = grid.get(key);
        if (!cell) { cell = []; grid.set(key, cell); }
        cell.push(p);
      }
      return grid;
    };

    const getNeighbors = (p: Particle, grid: Map<string, Particle[]>): Particle[] => {
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);
      const neighbors: Particle[] = [];
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(cellKey(cx + dx, cy + dy));
          if (cell) {
            for (const other of cell) {
              if (other !== p) neighbors.push(other);
            }
          }
        }
      }
      return neighbors;
    };

    // ================================================================
    // FIND NEAREST NEIGHBOR for subtle connection
    // ================================================================
    const findNearestNeighbor = (p: Particle, grid: Map<string, Particle[]>, excludeIdx: number): Particle | null => {
      const cx = Math.floor(p.x / CELL_SIZE);
      const cy = Math.floor(p.y / CELL_SIZE);
      let nearest: Particle | null = null;
      let nearestDist = 45; // Only connect within 45px
      const maxDistSq = 45 * 45;
      
      for (let dx = -1; dx <= 1; dx++) {
        for (let dy = -1; dy <= 1; dy++) {
          const cell = grid.get(cellKey(cx + dx, cy + dy));
          if (!cell) continue;
          for (const other of cell) {
            if (other === p) continue;
            const idx = particlesRef.current.indexOf(other);
            if (idx <= excludeIdx) continue; // Avoid duplicates
            const ddx = p.x - other.x;
            const ddy = p.y - other.y;
            const distSq = ddx * ddx + ddy * ddy;
            if (distSq < maxDistSq && distSq < nearestDist * nearestDist) {
              nearest = other;
              nearestDist = Math.sqrt(distSq);
            }
          }
        }
      }
      return nearest;
    };

    const animate = () => {
      const w = canvas.width;
      const h = canvas.height;
      const colors = getThemeColors();

      ctx.clearRect(0, 0, w, h);

      timeRef.current += 16;
      const t = timeRef.current;

      // ORBS & STARS DISABLED for performance — only render particles now

      // ================================================================
      // WIND GUSTS
      // ================================================================
      if (t - lastGustSpawnRef.current > nextGustTimeRef.current) {
        lastGustSpawnRef.current = t;
        nextGustTimeRef.current = 3000 + Math.random() * 5000;
        const edge = Math.floor(Math.random() * 4);
        let gx: number, gy: number, gz: number, gvx: number, gvy: number, gvz: number;
        if (edge === 0) {
          gx = Math.random() * w; gy = -40; gz = (Math.random() - 0.5) * 0.5;
          gvx = (Math.random() - 0.5) * 0.5; gvy = 0.3 + Math.random() * 0.4; gvz = (Math.random() - 0.5) * 0.1;
        } else if (edge === 1) {
          gx = w + 40; gy = Math.random() * h; gz = (Math.random() - 0.5) * 0.5;
          gvx = -(0.3 + Math.random() * 0.4); gvy = (Math.random() - 0.5) * 0.5; gvz = (Math.random() - 0.5) * 0.1;
        } else if (edge === 2) {
          gx = Math.random() * w; gy = h + 40; gz = (Math.random() - 0.5) * 0.5;
          gvx = (Math.random() - 0.5) * 0.5; gvy = -(0.3 + Math.random() * 0.4); gvz = (Math.random() - 0.5) * 0.1;
        } else {
          gx = -40; gy = Math.random() * h; gz = (Math.random() - 0.5) * 0.5;
          gvx = 0.3 + Math.random() * 0.4; gvy = (Math.random() - 0.5) * 0.5; gvz = (Math.random() - 0.5) * 0.1;
        }
        gustsRef.current.push({
          x: gx, y: gy, z: gz,
          vx: gvx, vy: gvy, vz: gvz,
          radius: 160 + Math.random() * 200,
          strength: 0.02 + Math.random() * 0.04, // Much stronger gusts
          life: 0,
          maxLife: 3000 + Math.random() * 4000, // Shorter gusts, more frequent
          swirlDir: Math.random() > 0.5 ? 1 : -1,
        });
      }
      gustsRef.current = gustsRef.current.filter(g => g.life < g.maxLife);

      const ps = particlesRef.current;
      const grid = buildSpatialGrid(ps);

      // ================================================================
      // UPDATE PARTICLES
      // ================================================================
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];

        // --- Wind gust influence ---
        for (const gust of gustsRef.current) {
          const gdx = p.x - gust.x;
          const gdy = p.y - gust.y;
          const gdz = p.z - gust.z;
          const gdist = Math.sqrt(gdx * gdx + gdy * gdy + gdz * gdz * 0.3); // z weighted less
          if (gdist < gust.radius && gdist > 5) {
            const lifeProgress = gust.life / gust.maxLife;
            const lifeFade = lifeProgress < 0.2 ? lifeProgress / 0.2
              : lifeProgress > 0.7 ? (1 - lifeProgress) / 0.3 : 1;
            const proximity = 1 - gdist / gust.radius;
            const force = proximity * gust.strength * lifeFade;
            p.vx += gust.vx * force * 0.25;
            p.vy += gust.vy * force * 0.25;
            p.vz += gust.vz * force * 0.1;
            const nx = gdx / gdist;
            const ny = gdy / gdist;
            const nz = gdz / (gdist + 0.1);
            p.vx += -ny * force * gust.swirlDir * 0.2;
            p.vy += nx * force * gust.swirlDir * 0.2;
            p.vz += nz * force * gust.swirlDir * 0.1;
          }
        }

        // NO MOUSE INTERACTION — particles float freely without following cursor

        // --- Neighbor repulsion (prevents clustering) ---
        // Much stronger repulsion to actively prevent clusters
        const neighbors = getNeighbors(p, grid);
        for (const other of neighbors) {
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dz = p.z - other.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz * 0.3);
          
          if (dist < 40 && dist > 2) {
            // Strong repulsion at close range — pushes particles apart
            const repelForce = (1 - dist / 40) * 0.025;
            p.vx += (dx / dist) * repelForce;
            p.vy += (dy / dist) * repelForce;
            p.vz += (dz / (dist + 0.1)) * repelForce * 0.3;
          }
        }

        // --- Sinusoidal wandering ---
        const wanderAngle = t * 0.0008 + p.pulsePhase;
        p.vx += Math.sin(wanderAngle) * 0.004;
        p.vy += Math.cos(wanderAngle * 0.7) * 0.004;
        p.vz += Math.sin(wanderAngle * 1.3) * 0.002;

        // --- Random micro-drift ---
        p.vx += (Math.random() - 0.5) * 0.005;
        p.vy += (Math.random() - 0.5) * 0.005;
        p.vz += (Math.random() - 0.5) * 0.002;

        // --- Velocity spring back to base velocity ---
        const springK = 0.00005; // Much weaker spring = particles keep momentum longer
        p.vx += (p.baseVx - p.vx) * springK;
        p.vy += (p.baseVy - p.vy) * springK;
        p.vz += (p.baseVz - p.vz) * springK;

        // --- Speed limits ---
        const maxSpeed = 2.5 + p.depth * 1.0; // Much higher max speed
        const minSpeed = 0.08 + p.depth * 0.15; // Higher min speed keeps things lively
        const currentSpeed = Math.sqrt(p.vx * p.vx + p.vy * p.vy + p.vz * p.vz * 0.5);
        if (currentSpeed > maxSpeed) {
          const scale = maxSpeed / currentSpeed;
          p.vx *= scale;
          p.vy *= scale;
          p.vz *= scale;
        }
        if (currentSpeed < minSpeed && currentSpeed > 0) {
          const scale = minSpeed / currentSpeed;
          p.vx *= scale;
          p.vy *= scale;
          p.vz *= scale;
        }
      }

      // Update gust positions
      for (const gust of gustsRef.current) {
        gust.life += 16;
        gust.x += gust.vx;
        gust.y += gust.vy;
        gust.z += gust.vz;
      }

      // NO TRAILS — disabled for performance

      // ================================================================
      // DRAW CONNECTIONS (simple, minimal — only nearest neighbor)
      // Only draw 1 thread per particle pair, and only when very close
      // ================================================================
      ctx.lineCap = 'round';
      
      // Track which pairs we've drawn to avoid duplicates
      const drawnPairs = new Set<string>();
      
      for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const nearest = findNearestNeighbor(p, grid, i);
        
        if (!nearest) continue;
        const j = ps.indexOf(nearest);
        const pairKey = Math.min(i, j) + '_' + Math.max(i, j);
        if (drawnPairs.has(pairKey)) continue;
        drawnPairs.add(pairKey);

        const dx = p.x - nearest.x;
        const dy = p.y - nearest.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Only draw if within 45px and both particles reasonably close to mouse or each other
        if (dist > 45) continue;

        // Z-depth factor for connection visibility: only connect similar depths
        const zDiff = Math.abs(p.z - nearest.z);
        if (zDiff > 0.4) continue; // Don't connect particles with very different z

        const zAvg = (p.z + nearest.z) * 0.5;
        const zFactor = 1 + zAvg * 0.5; // ~0.5 to 1.5
        const proximity = 1 - dist / 45;
        const alpha = proximity * 0.06 * zFactor * ((p.depth + nearest.depth) * 0.5);

        if (alpha < 0.008) continue;

        // Single thin thread — no glow layer, just clean line
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nearest.x, nearest.y);
        const lineGrad = ctx.createLinearGradient(p.x, p.y, nearest.x, nearest.y);
        lineGrad.addColorStop(0, `rgba(${colors.mouseConnection}, ${alpha * 0.5})`);
        lineGrad.addColorStop(0.5, `rgba(${colors.connection}, ${alpha})`);
        lineGrad.addColorStop(1, `rgba(${colors.mouseConnection}, ${alpha * 0.5})`);
        ctx.strokeStyle = lineGrad;
        ctx.lineWidth = 0.5 * zFactor;
        ctx.stroke();
      }

      // ================================================================
      // DRAW PARTICLES (sorted by z for correct depth ordering)
      // Far particles (z<0) drawn first, close particles (z>0) drawn last
      // ================================================================
      // Sort by z: most negative (far) first, most positive (close) last
      const sortedIndices = ps.map((_, i) => i).sort((a, b) => ps[a].z - ps[b].z);

      for (const i of sortedIndices) {
        const p = ps[i];

        // Update position in 3D
        p.x += p.vx;
        p.y += p.vy;
        p.z += p.vz;

        // Soft boundary — bounce with z-clamping
        const margin = 30;
        if (p.x < margin) { p.x = margin; p.vx = Math.abs(p.vx) * 0.5; }
        if (p.x > w - margin) { p.x = w - margin; p.vx = -Math.abs(p.vx) * 0.5; }
        if (p.y < margin) { p.y = margin; p.vy = Math.abs(p.vy) * 0.5; }
        if (p.y > h - margin) { p.y = h - margin; p.vy = -Math.abs(p.vy) * 0.5; }
        // Z boundary: keep z within -0.8 to 0.8
        if (p.z < -0.8) { p.z = -0.8; p.vz = Math.abs(p.vz) * 0.3; }
        if (p.z > 0.8) { p.z = 0.8; p.vz = -Math.abs(p.vz) * 0.3; }

        p.pulsePhase += p.pulseSpeed;
        p.sparklePhase += p.sparkleSpeed;

        const pulseFactor = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(p.pulsePhase));
        const sparkleFactor = 0.5 + 0.5 * Math.sin(p.sparklePhase);
        const depthFactor = 0.1 + p.depth * 0.9;
        const breatheIntensity = 0.7 + 0.3 * Math.sin(t * 0.0012 + p.pulsePhase);
        const baseAlpha = p.opacity * pulseFactor * depthFactor * sparkleFactor * breatheIntensity;

        const coreSize = p.baseSize * (0.4 + pulseFactor * 0.6);
        const blurAmount = (1 - p.depth) * 2.0 + 0.5;

        const coreColor = p.hue !== 0
          ? (colors.isDark ? `${160 + p.hue * 5}, ${210 + p.hue * 3}, 255` : colors.particleCore)
          : colors.particleCore;
        const glowColor = p.hue !== 0
          ? (colors.isDark ? `${50 + p.hue * 6}, ${130 + p.hue * 5}, 200` : colors.particleGlow)
          : colors.particleGlow;

        // NO TRAILS — disabled for performance

        const sparkleIntensity = 0.3 + 0.7 * Math.abs(Math.sin(p.sparklePhase));
        drawGlowingParticle(p.x, p.y, p.z, coreSize, baseAlpha, coreColor, glowColor, blurAmount, sparkleIntensity);
      }

      // MOUSE CONNECTIONS DISABLED for performance

      // DUST PARTICLES DISABLED for performance — entire block removed

      // Vignette disabled for performance

      // DITHERING DISABLED for performance

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    resize();

    const handleResize = () => resize();

    window.addEventListener('resize', handleResize);

    animationFrameRef.current = requestAnimationFrame(animate);

    const themeObserver = new MutationObserver(() => {
      for (const p of particlesRef.current) {
        const newP = createParticle(canvas);
        p.hue = newP.hue;
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    return () => {
      window.removeEventListener('resize', handleResize);
      themeObserver.disconnect();
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: '-1px',
        left: '-1px',
        width: 'calc(100vw + 2px)',
        height: 'calc(100vh + 2px)',
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 1,
      }}
      aria-hidden={true}
    />
  );
}