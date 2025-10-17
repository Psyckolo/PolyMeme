import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown } from "lucide-react";
import { PoolMeter } from "./PoolMeter";
import { CountdownBadge } from "./CountdownBadge";
import { ScanlineOverlay } from "./ScanlineOverlay";
import type { Market } from "@shared/schema";

interface PredictionCardProps {
  market: Market | null;
  isLoading?: boolean;
}

export function PredictionCard({ market, isLoading }: PredictionCardProps) {
  if (isLoading || !market) {
    return (
      <Card className="relative w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border animate-pulse">
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Loading today's prediction...
        </div>
      </Card>
    );
  }

  const totalPool = parseFloat(market.poolRight) + parseFloat(market.poolWrong);
  const rightPercentage = totalPool > 0 ? (parseFloat(market.poolRight) / totalPool) * 100 : 50;
  const wrongPercentage = totalPool > 0 ? (parseFloat(market.poolWrong) / totalPool) * 100 : 50;

  const lockTime = new Date(market.lockTime);
  const endTime = new Date(market.endTime);
  const now = new Date();

  const getStatusLabel = () => {
    if (market.status === "SETTLED") return "Settled";
    if (market.status === "REFUND") return "Refunded";
    if (now > lockTime) return "Locked";
    return "Lock in";
  };

  const getStatusVariant = () => {
    if (market.status === "SETTLED") return "locked";
    if (market.status === "REFUND") return "locked";
    if (now > lockTime) return "locked";
    return "default";
  };

  const thresholdPercent = (market.thresholdBps / 100).toFixed(1);

  return (
    <Card 
      className="relative w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border overflow-hidden"
      style={{
        boxShadow: "0 0 30px rgba(255, 0, 255, 0.2), 0 0 60px rgba(0, 255, 255, 0.1)"
      }}
      data-testid="card-prediction"
    >
      <ScanlineOverlay />
      
      {/* Header with Asset Info */}
      <div className="flex items-center gap-4 mb-6">
        {market.assetLogo && (
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-border">
            <img 
              src={market.assetLogo} 
              alt={market.assetName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-3xl font-bold font-display" data-testid="text-asset-name">{market.assetName}</h3>
          <Badge variant="outline" className="mt-1" data-testid="badge-asset-type">
            {market.assetType}
          </Badge>
        </div>
        <CountdownBadge
          targetTime={now > lockTime ? endTime : lockTime}
          label={getStatusLabel()}
          variant={getStatusVariant()}
        />
      </div>

      {/* Prediction Direction */}
      <div className="flex items-center justify-center gap-6 my-8 p-6 bg-muted/20 rounded-lg backdrop-blur-sm">
        {market.direction === "UP" ? (
          <ArrowUp className="w-16 h-16 text-[hsl(var(--neon-green))]" strokeWidth={3} />
        ) : (
          <ArrowDown className="w-16 h-16 text-destructive" strokeWidth={3} />
        )}
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">AI Predicts</p>
          <p className="text-5xl font-bold font-mono" data-testid="text-prediction">
            {market.direction}
            <span className={market.direction === "UP" ? "text-[hsl(var(--neon-green))]" : "text-destructive"}>
              {" "}{market.direction === "UP" ? "+" : ""}{thresholdPercent}%
            </span>
          </p>
        </div>
      </div>

      {/* Pool Meters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <PoolMeter
          label="AI RIGHT"
          amount={market.poolRight}
          percentage={rightPercentage}
          variant="right"
        />
        <PoolMeter
          label="AI WRONG"
          amount={market.poolWrong}
          percentage={wrongPercentage}
          variant="wrong"
        />
      </div>

      {/* Settlement Info */}
      {market.status === "SETTLED" && market.winner && (
        <div className="mt-6 p-4 bg-accent/20 rounded-lg border border-accent text-center">
          <p className="text-sm text-muted-foreground mb-1">Winner</p>
          <p className="text-2xl font-bold font-mono">
            AI {market.winner === "RIGHT" ? "WAS RIGHT" : market.winner === "WRONG" ? "WAS WRONG" : "TIE"}
          </p>
        </div>
      )}
    </Card>
  );
}
