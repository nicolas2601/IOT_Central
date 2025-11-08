"use client";

import React, { useRef } from "react";
import "./effects.css";

export const ClickSpark: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => {
  const ref = useRef<HTMLDivElement>(null);

  const handleClick = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const max = Math.max(
      Math.hypot(x, y),
      Math.hypot(x - rect.width, y),
      Math.hypot(x, y - rect.height),
      Math.hypot(x - rect.width, y - rect.height)
    );
    const spark = document.createElement("div");
    spark.className = "spark";
    spark.style.width = `${max * 2}px`;
    spark.style.height = `${max * 2}px`;
    spark.style.left = `${x - max}px`;
    spark.style.top = `${y - max}px`;
    el.appendChild(spark);
    spark.animate(
      [
        { transform: "scale(0)", opacity: 1 },
        { transform: "scale(1)", opacity: 0 }
      ],
      { duration: 700, easing: "ease-out" }
    ).onfinish = () => spark.remove();
  };

  return (
    <div ref={ref} className={`click-spark ${className}`} onClick={handleClick}>
      {children}
    </div>
  );
};