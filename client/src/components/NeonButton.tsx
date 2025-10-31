import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NeonButtonProps {
  children: React.ReactNode;
  variant?: "right" | "wrong" | "default";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  type?: "button" | "submit" | "reset";
  testId?: string;
}

export function NeonButton({ 
  children, 
  variant = "default", 
  onClick, 
  disabled = false,
  className = "",
  size = "default",
  type = "button",
  testId
}: NeonButtonProps) {
  const getVariantStyles = () => {
    if (variant === "right") {
      return "bg-[hsl(var(--neon-magenta))] hover:bg-[hsl(var(--neon-magenta))] text-white border-2 border-[hsl(var(--neon-magenta))] shadow-[0_0_25px_rgba(255,0,255,0.5)] hover:shadow-[0_0_40px_rgba(255,0,255,0.8)] transition-all animate-pulse-glow";
    }
    if (variant === "wrong") {
      return "bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))] text-white border-2 border-[hsl(var(--neon-cyan))] shadow-[0_0_25px_rgba(0,255,255,0.5)] hover:shadow-[0_0_40px_rgba(0,255,255,0.8)] transition-all animate-pulse-glow";
    }
    return "";
  };

  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={disabled}
      size={size}
      className={cn(
        "font-semibold uppercase tracking-wide transform transition-all duration-200",
        "hover:scale-105 active:scale-95",
        getVariantStyles(),
        className
      )}
      data-testid={testId}
    >
      {children}
    </Button>
  );
}
