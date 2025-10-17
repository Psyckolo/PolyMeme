import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, TrendingUp } from "lucide-react";
import { PoolMeter } from "./PoolMeter";
import { CountdownBadge } from "./CountdownBadge";
import { ScanlineOverlay } from "./ScanlineOverlay";
import type { Market } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";

interface PredictionCardProps {
  market: Market | null;
  isLoading?: boolean;
}

interface PriceData {
  price0: string;
  currentPrice: string;
  priceChange: string;
}

export function PredictionCard({ market, isLoading }: PredictionCardProps) {
  // Fetch real-time price for tokens
  const { data: priceData } = useQuery<PriceData>({
    queryKey: ['/api/price', market?.id],
    enabled: !!market && market.assetType === 'TOKEN',
    refetchInterval: 30000, // Refresh every 30 seconds
  });

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

  const price0 = market.price0 ? parseFloat(market.price0) : 0;
  const currentPrice = priceData?.currentPrice ? parseFloat(priceData.currentPrice) : price0;
  const priceChange = priceData?.priceChange ? parseFloat(priceData.priceChange) : 0;

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

      {/* Price Display (for Tokens) */}
      {market.assetType === 'TOKEN' && price0 > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Starting Price</p>
            <p className="text-2xl font-mono font-bold" data-testid="text-price-start">
              ${price0.toFixed(4)}
            </p>
          </div>
          <div className="p-4 bg-muted/20 rounded-lg">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1 flex items-center gap-1">
              Current Price
              {priceData && <TrendingUp className="w-3 h-3" />}
            </p>
            <p className="text-2xl font-mono font-bold" data-testid="text-price-current">
              ${currentPrice.toFixed(4)}
              {priceChange !== 0 && (
                <span className={`text-sm ml-2 ${priceChange > 0 ? 'text-[hsl(var(--neon-green))]' : 'text-destructive'}`}>
                  {priceChange > 0 ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              )}
            </p>
          </div>
        </div>
      )}

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
