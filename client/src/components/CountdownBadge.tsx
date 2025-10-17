import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface CountdownBadgeProps {
  targetTime: Date;
  label: string;
  variant?: "default" | "warning" | "locked";
}

export function CountdownBadge({ targetTime, label, variant = "default" }: CountdownBadgeProps) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetTime.getTime() - now;

      if (distance < 0) {
        setTimeLeft("00:00:00");
        setIsUrgent(false);
        return;
      }

      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );

      // Mark as urgent if less than 5 minutes
      setIsUrgent(distance < 5 * 60 * 1000);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetTime]);

  const getBadgeVariant = () => {
    if (variant === "locked") return "secondary";
    if (isUrgent) return "destructive";
    if (variant === "warning") return "secondary";
    return "outline";
  };

  return (
    <Badge 
      variant={getBadgeVariant()} 
      className={`font-mono text-base px-4 py-2 ${isUrgent ? "animate-pulse" : ""}`}
      data-testid="badge-countdown"
    >
      <Clock className="w-4 h-4 mr-2" />
      {label} {timeLeft}
    </Badge>
  );
}
