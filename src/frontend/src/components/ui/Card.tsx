"use client";

import type { ReactNode } from "react";

type CardVariant = "default" | "elevated" | "glass";

interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: "sm" | "md" | "lg" | "none";
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

const variantClasses: Record<CardVariant, string> = {
  default:
    "bg-surface border-border",
  elevated:
    "bg-surface shadow-md",
  glass:
    "bg-surface/80 backdrop-blur-xl border-border/50",
};

const paddingClasses = {
  none: "",
  sm: "p-3",
  md: "p-5",
  lg: "p-6",
};

export default function Card({
  children,
  variant = "default",
  padding = "md",
  className = "",
  onClick,
  hover = false,
}: CardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl transition-all duration-200 ${variantClasses[variant]} ${paddingClasses[padding]} ${
        hover
          ? "hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
