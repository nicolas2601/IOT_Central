"use client";

import React from "react";
import "./effects.css";

export const FadeContent: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <div className={`fade-in ${className}`}>{children}</div>
);