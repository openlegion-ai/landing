"use client";

import { motion, useReducedMotion } from "framer-motion";

interface AnimateInProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
  scale?: boolean;
}

export function AnimateIn({ children, delay = 0, className = "", scale = false }: AnimateInProps) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 32, ...(scale ? { scale: 0.97 } : {}) }}
      whileInView={reduce ? undefined : { opacity: 1, y: 0, ...(scale ? { scale: 1 } : {}) }}
      viewport={{ once: true, margin: "-60px" }}
      transition={reduce ? { duration: 0 } : { duration: 0.55, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: reduce ? 0 : 0.1 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      variants={
        reduce
          ? {
              hidden: { opacity: 1, y: 0 },
              visible: { opacity: 1, y: 0, transition: { duration: 0 } },
            }
          : {
              hidden: { opacity: 0, y: 32 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: "easeOut" } },
            }
      }
      className={className}
    >
      {children}
    </motion.div>
  );
}
