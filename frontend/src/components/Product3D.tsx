"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Move3d, Pause, Play, RotateCcw } from "@/lib/icons";

interface Props {

  image: string;

  backImage?: string;

  aspect?: string;

  autoRotate?: boolean;

  thicknessPx?: number;

  slices?: number;
  className?: string;
}

export default function Product3D({
  image,
  backImage,
  aspect = "90/55",
  autoRotate = true,
  thicknessPx = 10,
  slices = 8,
  className = "",
}: Props) {
  const [rotation, setRotation] = useState({ y: -28, x: 14 });
  const [paused, setPaused] = useState(!autoRotate);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; ry: number; rx: number } | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(0);

  useEffect(() => {
    if (paused || dragging) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
      return;
    }
    const tick = (t: number) => {
      const dt = lastTickRef.current ? t - lastTickRef.current : 16;
      lastTickRef.current = t;
      setRotation((r) => ({ ...r, y: r.y + dt * 0.022 }));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTickRef.current = 0;
    };
  }, [paused, dragging]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      ry: rotation.y,
      rx: rotation.x,
    };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setRotation({
      y: dragStartRef.current.ry + dx * 0.5,
      x: clamp(dragStartRef.current.rx - dy * 0.3, -45, 60),
    });
  };
  const onPointerUp = (e: React.PointerEvent) => {
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    setDragging(false);
    dragStartRef.current = null;
  };
  const resetView = () => setRotation({ y: -28, x: 14 });

  const yNorm = useMemo(() => {
    const y = ((rotation.y % 360) + 360) % 360;
    return y;
  }, [rotation.y]);

  const lightAngle = Math.cos((yNorm * Math.PI) / 180);
  const highlightOpacity = Math.max(0, lightAngle) * 0.55;
  const highlightShift = lightAngle * 35;

  const shadowScaleX = 0.65 + 0.35 * Math.abs(Math.sin((yNorm * Math.PI) / 180));
  const shadowOpacity = 0.18 + 0.12 * Math.abs(Math.cos((yNorm * Math.PI) / 180));

  const sliceArray = useMemo(
    () => Array.from({ length: slices }, (_, i) => i),
    [slices]
  );

  return (
    <div
      className={`relative overflow-hidden rounded-xl border border-ink-200 bg-gradient-to-br from-ink-50 via-white to-ink-50 ${className}`}
      style={{ perspective: "1400px" }}
    >

      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 30%, rgba(255,255,255,0.9), transparent 70%), radial-gradient(ellipse 90% 70% at 50% 110%, rgba(15,23,42,0.06), transparent 70%)",
        }}
      />

      <div
        className="relative w-full select-none touch-none cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: aspect, minHeight: 300 }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onDoubleClick={resetView}
      >

        <div
          className="absolute left-1/2 bottom-[12%] -translate-x-1/2 pointer-events-none"
          style={{
            width: "60%",
            height: "14%",
            background: `radial-gradient(ellipse at center, rgba(15,23,42,${shadowOpacity}) 0%, rgba(15,23,42,0) 65%)`,
            transform: `scaleX(${shadowScaleX})`,
            filter: "blur(6px)",
            transition: dragging ? "none" : "transform 0.1s linear",
          }}
        />

        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div
            className="relative"
            style={{
              width: "62%",
              aspectRatio: aspect,
              transformStyle: "preserve-3d",
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transition: dragging ? "none" : "transform 0.05s linear",
              filter: "drop-shadow(0 22px 28px rgba(15, 23, 42, 0.22)) drop-shadow(0 6px 10px rgba(15, 23, 42, 0.08))",
            }}
          >

            {sliceArray.map((i) => {
              const z = (i - (slices - 1) / 2) * (thicknessPx / slices);
              const isFront = i === slices - 1;
              const isBack = i === 0;
              return (
                <div
                  key={i}
                  className="absolute inset-0 rounded-md overflow-hidden"
                  style={{
                    transform: `translateZ(${z}px)`,
                    transformStyle: "preserve-3d",
                    backfaceVisibility: "hidden",
                    background: "#fff",
                    boxShadow: isFront || isBack ? "0 0 0 1px rgba(15,23,42,0.08)" : "none",
                  }}
                >
                  {isFront && (
                    <FaceContent
                      image={image}
                      highlightOpacity={highlightOpacity}
                      highlightShift={highlightShift}
                    />
                  )}
                  {isBack && (
                    <FaceContent
                      image={backImage || image}
                      mirrored={!backImage}
                      isBack
                      highlightOpacity={highlightOpacity * 0.6}
                      highlightShift={-highlightShift}
                    />
                  )}
                  {!isFront && !isBack && (

                    <div
                      className="w-full h-full"
                      style={{
                        background:
                          "linear-gradient(180deg, #f8fafc 0%, #eef2f7 50%, #f8fafc 100%)",
                      }}
                    />
                  )}
                </div>
              );
            })}

            <SideEdge transform={`translateY(-50%) rotateX(90deg)  translateZ(${thicknessPx / 2}px)`} axis="x" thickness={thicknessPx} />
            <SideEdge transform={`translateY(50%)  rotateX(-90deg) translateZ(${thicknessPx / 2}px)`} axis="x" thickness={thicknessPx} />
            <SideEdge transform={`translateX(-50%) rotateY(-90deg) translateZ(${thicknessPx / 2}px)`} axis="y" thickness={thicknessPx} />
            <SideEdge transform={`translateX(50%)  rotateY(90deg)  translateZ(${thicknessPx / 2}px)`} axis="y" thickness={thicknessPx} />
          </div>
        </div>
      </div>

      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/85 backdrop-blur-sm border border-ink-200 text-[10px] uppercase tracking-[0.14em] text-ink-600">
          <Move3d size={11} strokeWidth={2} />
          3D · перетащите · 2× клик — центр
        </span>
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            onClick={resetView}
            aria-label="Сбросить вид"
            className="h-8 w-8 grid place-items-center rounded-md bg-white/90 backdrop-blur-sm border border-ink-200 text-ink-700 hover:text-brand hover:border-brand/40 transition-colors"
          >
            <RotateCcw size={13} strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Запустить вращение" : "Остановить вращение"}
            className="h-8 w-8 grid place-items-center rounded-md bg-white/90 backdrop-blur-sm border border-ink-200 text-ink-700 hover:text-brand hover:border-brand/40 transition-colors"
          >
            {paused ? <Play size={13} strokeWidth={2} /> : <Pause size={13} strokeWidth={2} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function FaceContent({
  image,
  mirrored = false,
  isBack = false,
  highlightOpacity,
  highlightShift,
}: {
  image: string;
  mirrored?: boolean;
  isBack?: boolean;
  highlightOpacity: number;
  highlightShift: number;
}) {
  return (
    <div className="absolute inset-0">
      <img
        src={image}
        alt=""
        draggable={false}
        className="w-full h-full object-cover"
        style={mirrored ? { transform: "scaleX(-1)" } : undefined}
      />

      <div
        className="absolute inset-0 pointer-events-none mix-blend-screen"
        style={{
          opacity: highlightOpacity,
          background: `linear-gradient(115deg,
              transparent ${30 + highlightShift}%,
              rgba(255,255,255,0.85) ${50 + highlightShift}%,
              transparent ${72 + highlightShift}%)`,
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(15,23,42,0.16), transparent 60%)",
        }}
      />

      <div
        className="absolute inset-0 pointer-events-none rounded-md"
        style={{ boxShadow: "inset 0 0 0 1px rgba(15,23,42,0.06)" }}
        aria-hidden="true"
      />
      {isBack && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "linear-gradient(180deg, rgba(15,23,42,0.05), transparent 30%, transparent 70%, rgba(15,23,42,0.05))",
          }}
        />
      )}
    </div>
  );
}

function SideEdge({
  transform,
  axis,
  thickness,
}: {
  transform: string;
  axis: "x" | "y";
  thickness: number;
}) {
  return (
    <div
      className="absolute"
      style={{
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform,
        background:
          "linear-gradient(90deg, #ffffff 0%, #e2e8f0 35%, #cbd5e1 50%, #e2e8f0 65%, #ffffff 100%)",
        ...(axis === "x"
          ? { left: 0, right: 0, top: "50%", height: `${thickness}px`, marginTop: -thickness / 2 }
          : { top: 0, bottom: 0, left: "50%", width: `${thickness}px`, marginLeft: -thickness / 2 }),
        border: "1px solid rgba(15, 23, 42, 0.08)",
      }}
    />
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}
