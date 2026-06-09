"use client";

import {
  motion,
  useInView,
  useMotionValue,
  useTransform,
  useSpring,
  type Variants,
} from "framer-motion";
import { useRef, useEffect, useState, type ReactNode } from "react";

const ease = [0.22, 1, 0.36, 1] as const;

interface Props {
  children: ReactNode;
  delay?: number;
  y?: number;
  x?: number;
  className?: string;
  once?: boolean;
  as?: "div" | "section" | "li" | "header" | "footer" | "span";
  duration?: number;
  margin?: string;
}

export default function Reveal({
  children,
  delay = 0,
  y = 18,
  x = 0,
  className = "",
  once = true,
  as = "div",
  duration = 0.6,
  margin = "-80px",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: margin as any });
  const Tag = motion[as] as any;

  return (
    <Tag
      ref={ref}
      initial={{ opacity: 0, y, x }}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : { opacity: 0, y, x }}
      transition={{ duration, delay, ease }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export function Stagger({
  children,
  className = "",
  stagger = 0.06,
  as = "div",
  margin = "-80px",
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: "div" | "ol" | "ul" | "dl" | "section";
  margin?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: margin as any });
  const Tag = motion[as] as any;

  return (
    <Tag
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export function StaggerItem({
  children,
  className = "",
  y = 14,
  x = 0,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  x?: number;
  as?: "div" | "li" | "dd";
}) {
  const Tag = motion[as] as any;
  return (
    <Tag
      variants={{
        hidden: { opacity: 0, y, x },
        show: {
          opacity: 1,
          y: 0,
          x: 0,
          transition: { duration: 0.55, ease },
        },
      }}
      className={className}
    >
      {children}
    </Tag>
  );
}

export function CountUp({
  target,
  suffix = "",
  prefix = "",
  className = "",
  duration = 1.4,
}: {
  target: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { damping: 30, stiffness: 80 });
  const [display, setDisplay] = useState("0");

  useEffect(() => {
    if (inView) mv.set(target);
  }, [inView, target, mv]);

  useEffect(() => {
    const unsub = spring.on("change", (v) => {
      setDisplay(Math.round(v).toLocaleString("ru-RU"));
    });
    return unsub;
  }, [spring]);

  return (
    <motion.span
      ref={ref}
      initial={{ opacity: 0, y: 8 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease }}
      className={className}
    >
      {prefix}{display}{suffix}
    </motion.span>
  );
}

export function HoverLift({
  children,
  className = "",
  lift = -4,
}: {
  children: ReactNode;
  className?: string;
  lift?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: lift, transition: { duration: 0.25, ease } }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={inView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.6, delay, ease }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function DrawLine({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  return (
    <motion.div
      ref={ref}
      initial={{ scaleX: 0 }}
      animate={inView ? { scaleX: 1 } : {}}
      transition={{ duration: 0.7, ease }}
      style={{ transformOrigin: "left" }}
      className={`h-px bg-ink-200 ${className}`}
    />
  );
}
