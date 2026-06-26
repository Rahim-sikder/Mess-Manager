import type { ButtonHTMLAttributes } from "react";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const VARIANT_CLS: Record<Variant, string> = {
  primary:   "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-900 disabled:text-red-400",
  secondary: "border border-[#2A2A2A] bg-[#181818] text-gray-300 hover:bg-[#222222] hover:text-white active:bg-[#2A2A2A] disabled:text-gray-600",
  danger:    "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 disabled:bg-red-900 disabled:text-red-400",
  ghost:     "text-gray-400 hover:text-white hover:bg-[#222222] active:bg-[#2A2A2A] disabled:text-gray-600",
};

const SIZE_CLS: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2
        font-medium transition-colors
        disabled:cursor-not-allowed disabled:opacity-60
        ${VARIANT_CLS[variant]}
        ${SIZE_CLS[size]}
        ${className}
      `}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  );
}
