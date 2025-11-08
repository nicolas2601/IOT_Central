"use client";

import React from "react";
import "./effects.css";

interface ShinyTextProps {
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  children: React.ReactNode;
}

export const ShinyText: React.FC<ShinyTextProps> = ({ as = "h1", className = "", children }) => {
  const Tag = as as any;
  return <Tag className={`shiny-text ${className}`}>{children}</Tag>;
};