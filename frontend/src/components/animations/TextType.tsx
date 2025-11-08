"use client";

import React, { useEffect, useState } from "react";

interface TextTypeProps {
  text: string;
  speed?: number; // ms per character
  className?: string;
}

export const TextType: React.FC<TextTypeProps> = ({ text, speed = 35, className = "" }) => {
  const [display, setDisplay] = useState("");

  useEffect(() => {
    setDisplay("");
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplay(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed]);

  return <span className={className}>{display}</span>;
};