"use client";

import React from "react";
import "./effects.css";

export const StarBorder: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <div className={`star-border ${className}`}>{children}</div>
);