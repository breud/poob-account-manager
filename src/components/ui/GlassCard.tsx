import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  delay?: number;
  onClick?: () => void;
}

export function GlassCard({
  children,
  className = '',
  hover = false,
  glow = false,
  delay = 0,
  onClick,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      whileHover={
        hover
          ? { y: -3, transition: { duration: 0.2, ease: 'easeOut' } }
          : undefined
      }
      onClick={onClick}
      className={`glass rounded-2xl ${glow ? 'glow-accent' : ''} ${hover ? 'cursor-pointer' : ''} ${className}`}
    >
      {children}
    </motion.div>
  );
}
