'use client';

import { motion } from 'framer-motion';

interface FadeInSectionProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function FadeInSection({ children, delay = 0, className }: FadeInSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.35, ease: 'easeOut', delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}