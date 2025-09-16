import { cn } from "@/lib/utils"

interface GabaiCheckIconProps {
  size?: "sm" | "md" | "lg"
  className?: string
  spin?: boolean
}

export function GabaiCheckIcon({ size = "md", className, spin = false }: GabaiCheckIconProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  return (
    <svg
      className={cn(
        sizeClasses[size],
        spin && "animate-spin",
        className
      )}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      data-testid="gabai-check-icon"
    >
      {/* Speech bubble background */}
      <path
        d="M20 15 C20 8, 25 3, 32 3 L68 3 C75 3, 80 8, 80 15 L80 45 C80 52, 75 57, 68 57 L45 57 L25 75 L25 57 L32 57 C25 57, 20 52, 20 45 Z"
        fill="currentColor"
        className="text-blue-500"
      />
      {/* Checkmark */}
      <path
        d="M35 35 L45 45 L65 25"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}