"use client";

import * as React from "react";
import { useEffect, useRef, useState } from "react";

interface AnimatedContentProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof React.JSX.IntrinsicElements;
  delay?: number;
}

export function AnimatedContent({ as = "div", delay = 0, className = "", children, ...rest }: AnimatedContentProps) {
  const Comp = as as any;
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Comp
      ref={ref}
      className={`animated-content ${visible ? "animated-content--visible" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
      {...rest}
    >
      {children}
    </Comp>
  );
}