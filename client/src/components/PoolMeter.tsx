import { Progress } from "@/components/ui/progress";

interface PoolMeterProps {
  label: string;
  amount: string;
  percentage: number;
  variant: "right" | "wrong";
  className?: string;
}

export function PoolMeter({ label, amount, percentage, variant, className = "" }: PoolMeterProps) {
  const color = variant === "right" ? "neon-magenta" : "neon-cyan";
  const bgColor = variant === "right" 
    ? "bg-[hsl(var(--neon-magenta))]" 
    : "bg-[hsl(var(--neon-cyan))]";

  return (
    <div className={`space-y-3 ${className}`} data-testid={`pool-${variant}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </span>
        <span className="font-mono text-lg font-bold" style={{ color: `hsl(var(--${color}))` }}>
          {percentage.toFixed(1)}%
        </span>
      </div>
      
      <div className="space-y-2">
        <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted/20 backdrop-blur-sm">
          <div
            className={`h-full ${bgColor} transition-all duration-500 ease-out`}
            style={{ 
              width: `${percentage}%`,
              boxShadow: variant === "right"
                ? "0 0 20px rgba(255, 0, 255, 0.5)"
                : "0 0 20px rgba(0, 255, 255, 0.5)"
            }}
          />
        </div>
        
        <div className="flex items-center justify-between">
          <span className="font-mono text-2xl font-bold" data-testid={`text-pool-amount-${variant}`}>
            {parseFloat(amount).toLocaleString()} <span className="text-sm text-muted-foreground">USDC</span>
          </span>
        </div>
      </div>
    </div>
  );
}
