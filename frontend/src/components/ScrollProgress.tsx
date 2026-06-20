"use client";

import { motion, useScroll, useSpring } from "framer-motion";

// Тонкая полоса прогресса чтения вверху страницы — заполняется по мере скролла.
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    mass: 0.3,
  });

  return (
    <motion.div
      aria-hidden
      style={{ scaleX }}
      className="fixed top-0 left-0 right-0 z-[100] h-[2px] origin-left bg-gradient-to-r from-brand via-brand to-accent"
    />
  );
}
