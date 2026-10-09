// Gravity Gallery — adapted from Originkit
import { useEffect, useRef, type CSSProperties } from "react";
import Matter from "matter-js";

// Add your images here; local files live in public/.
const DEFAULT_IMAGES = [
  {
    "src": "/star-1.png"
  },
  {
    "src": "https://images.unsplash.com/photo-1777146464379-c527ae8c92f0?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MzQ1fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1600711151461-05abd927b281?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Njg5fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1485178575877-1a13bf489dfe?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzEzfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1665699954779-5d391413aaff?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzIyfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1662311516094-fdb7c2c1aa34?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzMxfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1512061649570-b858b7f60d32?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NzUwfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1748485559590-06fa4035b322?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODI0fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1637028357803-78764289ffe5?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODM5fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1638305607135-3e555310c69c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODQ1fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1463085154687-27abe97620ab?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8ODc4fHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  },
  {
    "src": "https://images.unsplash.com/photo-1609840422197-0f9a4e97e3a3?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OTkwfHxVc2VyJTIwcHJvZmlsZSUyMGltYWdlJTIwdmlicmFudHxlbnwwfDB8MHx8fDI%3D"
  }
];
type Walls = { top: boolean; bottom: boolean; left: boolean; right: boolean };
interface GravityGalleryProps {
  images?: { src: string }[];
  count?: number; size?: number; shape?: "square" | "circle"; color?: string;
  friction?: number; mouseEnable?: boolean; mouseStiffness?: number;
  mouseAngularStiffness?: number; gravX?: number; gravY?: number;
  wallOptions?: Walls; style?: CSSProperties;
}
const ALL_WALLS: Walls = { top: true, bottom: true, left: true, right: true };

export default function GravityGallery({
  images = DEFAULT_IMAGES, count = 20, size = 126, shape = "square",
  color = "#FFFFFF", friction = 1, mouseEnable = true,
  mouseStiffness = 0.991, mouseAngularStiffness = 0,
  gravX = 0, gravY = 1, wallOptions = ALL_WALLS, style,
}: GravityGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const n = Math.max(1, Math.min(20, Math.round(count)));
  const sources = images.length ? images : DEFAULT_IMAGES;
  const { top, bottom, left, right } = wallOptions;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const elements = Array.from(container.querySelectorAll<HTMLElement>("[data-physics-body]"));
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cleanupSimulation = () => {};
    let previousWidth = 0, previousHeight = 0;
    const resize = () => {
      const width = container.clientWidth, height = container.clientHeight;
      if (!width || !height || (width === previousWidth && height === previousHeight)) return;
      previousWidth = width; previousHeight = height;
      cleanupSimulation();
      const cardSize = Math.max(24, Math.min(size, width / 3, height / 2));
      elements.forEach(el => { el.style.width = el.style.height = cardSize + "px"; });
      if (reducedMotion) {
        elements.forEach((el, i) => {
          el.style.visibility = "visible";
          const cols = Math.max(1, Math.floor(width / (cardSize + 12)));
          const staticSize = Math.min(cardSize, height / Math.ceil(n / cols) - 8);
          el.style.width = el.style.height = Math.max(16, staticSize) + "px";
          el.style.left = ((i % cols + 0.5) * width / cols) + "px";
          el.style.top = ((Math.floor(i / cols) + 0.5) * height / Math.ceil(n / cols)) + "px";
          el.style.transform = "translate(-50%, -50%)";
        });
        return;
      }
      const engine = Matter.Engine.create({ gravity: { x: gravX, y: gravY } });
      const thickness = 200;
      const walls: Matter.Body[] = [];
      if (top) walls.push(Matter.Bodies.rectangle(width / 2, -thickness / 2, width + 400, thickness, { isStatic: true }));
      if (bottom) walls.push(Matter.Bodies.rectangle(width / 2, height + thickness / 2, width + 400, thickness, { isStatic: true }));
      if (left) walls.push(Matter.Bodies.rectangle(-thickness / 2, height / 2, thickness, height + 400, { isStatic: true }));
      if (right) walls.push(Matter.Bodies.rectangle(width + thickness / 2, height / 2, thickness, height + 400, { isStatic: true }));
      Matter.Composite.add(engine.world, walls);
      const bodies = elements.map((_, i) => {
        const x = cardSize / 2 + ((i + 0.5) / n) * (width - cardSize);
        const y = cardSize / 2 + (i % 3) * Math.min(cardSize * 0.3, (height - cardSize) / 3);
        const options = { friction: Math.max(1, Math.min(10, friction)) / 10, frictionAir: 0.02 };
        return shape === "circle"
          ? Matter.Bodies.circle(x, y, cardSize / 2, options)
          : Matter.Bodies.rectangle(x, y, cardSize, cardSize, options);
      });
      Matter.Composite.add(engine.world, bodies);
      let drag: Matter.Constraint | null = null;
      let pointerId: number | null = null;
      const point = (event: PointerEvent) => {
        const rect = container.getBoundingClientRect();
        return { x: event.clientX - rect.left, y: event.clientY - rect.top };
      };
      const release = () => {
        if (drag) Matter.Composite.remove(engine.world, drag);
        drag = null;
        if (pointerId !== null && container.hasPointerCapture(pointerId)) container.releasePointerCapture(pointerId);
        pointerId = null;
        container.style.cursor = "grab";
      };
      const down = (event: PointerEvent) => {
        if (!mouseEnable || pointerId !== null || event.button !== 0) return;
        const p = point(event);
        const body = Matter.Query.point(bodies, p)[0];
        if (!body) return;
        pointerId = event.pointerId;
        container.setPointerCapture(pointerId);
        drag = Matter.Constraint.create({
          pointA: p, bodyB: body,
          pointB: { x: p.x - body.position.x, y: p.y - body.position.y },
          length: 0, stiffness: mouseStiffness, angularStiffness: mouseAngularStiffness,
        } as Matter.IConstraintDefinition & { angularStiffness: number });
        Matter.Composite.add(engine.world, drag);
        container.style.cursor = "grabbing";
        event.preventDefault();
      };
      const move = (event: PointerEvent) => {
        if (drag && event.pointerId === pointerId) drag.pointA = point(event);
      };
      const up = (event: PointerEvent) => { if (event.pointerId === pointerId) release(); };
      container.addEventListener("pointerdown", down);
      container.addEventListener("pointermove", move);
      container.addEventListener("pointerup", up);
      container.addEventListener("pointercancel", up);
      container.addEventListener("lostpointercapture", up);
      let frame = 0, lastTime = 0;
      const update = (time: number) => {
        const delta = lastTime ? Math.min(1000 / 60, time - lastTime) : 1000 / 60;
        lastTime = time;
        Matter.Engine.update(engine, delta);
        bodies.forEach((body, i) => {
          const el = elements[i];
          el.style.visibility = "visible";
          el.style.left = body.position.x + "px";
          el.style.top = body.position.y + "px";
          el.style.transform = `translate(-50%, -50%) rotate(${body.angle}rad)`;
        });
        frame = requestAnimationFrame(update);
      };
      frame = requestAnimationFrame(update);
      cleanupSimulation = () => {
        cancelAnimationFrame(frame);
        release();
        container.removeEventListener("pointerdown", down);
        container.removeEventListener("pointermove", move);
        container.removeEventListener("pointerup", up);
        container.removeEventListener("pointercancel", up);
        container.removeEventListener("lostpointercapture", up);
        Matter.Composite.clear(engine.world, false);
        Matter.Engine.clear(engine);
      };
    };
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    resize();
    return () => { observer.disconnect(); cleanupSimulation(); };
  }, [n, size, shape, friction, mouseEnable, mouseStiffness, mouseAngularStiffness, gravX, gravY, top, bottom, left, right]);

  return (
    <div ref={containerRef} role="img" aria-label="Galerie de photos soumises à la gravité, déplaçables à la souris ou au toucher"
      style={{ ...style, position: "relative", height: "100%", width: "100%", overflow: "hidden", cursor: mouseEnable ? "grab" : "default" }}
      onDragStart={event => event.preventDefault()}>
      {Array.from({ length: n }, (_, i) => (
        <div key={i} data-physics-body="" style={{
          position: "absolute", visibility: "hidden", width: size, height: size,
          borderRadius: shape === "circle" ? "50%" : 0, overflow: "hidden",
          background: color, cursor: mouseEnable ? "grab" : "default", touchAction: mouseEnable ? "none" : "auto",
        }}>
          <img src={sources[i % sources.length].src} alt="" draggable={false}
            style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
        </div>
      ))}
    </div>
  );
}
