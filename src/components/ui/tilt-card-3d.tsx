"use client";

import { useState, useRef, type ReactNode, type MouseEvent } from "react";

interface TiltCard3DProps {
  children: ReactNode;
  className?: string;
  glowColor?: "blue" | "red" | "emerald" | "amber" | "default";
  maxTilt?: number;
}

export function TiltCard3D({
  children,
  className = "",
  glowColor = "default",
  maxTilt = 7,
}: TiltCard3DProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50, opacity: 0 });

  const glowStyles = {
    default: "hover:shadow-blue-500/20 hover:border-blue-400/30",
    blue: "hover:shadow-blue-600/30 hover:border-blue-400/40",
    red: "hover:shadow-red-600/30 hover:border-red-400/40",
    emerald: "hover:shadow-emerald-600/30 hover:border-emerald-400/40",
    amber: "hover:shadow-amber-600/30 hover:border-amber-400/40",
  }[glowColor];

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotateX = ((y - centerY) / centerY) * -maxTilt;
    const rotateY = ((x - centerX) / centerX) * maxTilt;

    setTransform(
      `perspective(1000px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) scale3d(1.02, 1.02, 1.02)`
    );
    setGlarePosition({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.15,
    });
  };

  const handleMouseLeave = () => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)");
    setGlarePosition((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: "transform 0.15s ease-out, box-shadow 0.2s ease-out",
        transformStyle: "preserve-3d",
      }}
      className={`relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B1325]/85 backdrop-blur-xl shadow-xl transition-colors duration-300 will-change-transform ${glowStyles} ${className}`}
    >
      {/* Reflejo especular 4D que sigue la posición del puntero */}
      <div
        className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
        style={{
          opacity: glarePosition.opacity,
          background: `radial-gradient(circle 260px at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.22), transparent 80%)`,
        }}
      />
      {children}
    </div>
  );
}
