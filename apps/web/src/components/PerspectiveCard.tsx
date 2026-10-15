"use client";

import React, { useRef, useState, useCallback } from "react";

interface PerspectiveCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
  depth?: number;
}

export function PerspectiveCard({
  children,
  className = "",
  intensity = 5,
  depth = 6,
}: PerspectiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((centerY - y) / centerY) * intensity;
      const rotateY = ((x - centerX) / centerX) * intensity;

      setRotation({ x: rotateX, y: rotateY });
    },
    [intensity]
  );

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setRotation({ x: 0, y: 0 });
      }}
      className={`relative perspective-1000 ${className}`}
      style={{ transformStyle: "preserve-3d" }}
    >
      <div
        className="w-full h-full rounded-xl transition-transform duration-200 ease-out"
        style={{
          transform: isHovered
            ? `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateY(-2px)`
            : "rotateX(0deg) rotateY(0deg) translateY(0px)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
