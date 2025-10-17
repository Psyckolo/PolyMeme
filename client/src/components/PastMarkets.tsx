import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Trophy, TrendingUp } from "lucide-react";
import type { Market } from "@shared/schema";

interface PastMarketsProps {
  markets: Market[];
}

export function PastMarkets({ markets }: PastMarketsProps) {
  if (markets.length === 0) {
    return (
      <Card data-testid="card-past-markets-empty">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Past Predictions
          </CardTitle>
          <CardDescription>Settled markets will appear here</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-8">
            No settled markets yet. Check back later!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-past-markets">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Past Predictions
        </CardTitle>
        <CardDescription>Recently settled markets and outcomes</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {markets.map((market) => {
          const price0 = parseFloat(market.price0 || "0");
          const price1 = parseFloat(market.price1 || "0");
          const priceChange = price0 > 0 ? ((price1 - price0) / price0) * 100 : 0;
          const thresholdPercent = (market.thresholdBps / 100).toFixed(1);

          const isAiCorrect = market.winner === "RIGHT";
          const isTie = market.winner === "TIE";

          return (
            <div
              key={market.id}
              className="p-4 rounded-lg bg-muted/20 border border-border hover-elevate"
              data-testid={`past-market-${market.id}`}
            >
              <div className="flex items-center gap-3 mb-3">
                {market.assetLogo && (
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-border">
                    <img
                      src={market.assetLogo}
                      alt={market.assetName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-bold">{market.assetName}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {market.assetType}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      {market.direction === "UP" ? (
                        <ArrowUp className="w-3 h-3" />
                      ) : (
                        <ArrowDown className="w-3 h-3" />
                      )}
                      {market.direction} {thresholdPercent}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  {isTie ? (
                    <Badge variant="outline" className="text-xs">
                      TIE - Refunded
                    </Badge>
                  ) : (
                    <Badge
                      className={`text-xs ${
                        isAiCorrect
                          ? "bg-[hsl(var(--neon-magenta))]/20 text-[hsl(var(--neon-magenta))] border-[hsl(var(--neon-magenta))]/50"
                          : "bg-[hsl(var(--neon-cyan))]/20 text-[hsl(var(--neon-cyan))] border-[hsl(var(--neon-cyan))]/50"
                      }`}
                    >
                      <Trophy className="w-3 h-3 mr-1" />
                      {isAiCorrect ? "AI RIGHT" : "AI WRONG"}
                    </Badge>
                  )}
                </div>
              </div>

              {market.assetType === "TOKEN" && price0 > 0 && (
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Start</p>
                    <p className="font-mono font-bold">${price0.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">End</p>
                    <p className="font-mono font-bold">${price1.toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Change</p>
                    <p
                      className={`font-mono font-bold ${
                        priceChange > 0
                          ? "text-[hsl(var(--neon-green))]"
                          : "text-destructive"
                      }`}
                    >
                      {priceChange > 0 ? "+" : ""}
                      {priceChange.toFixed(2)}%
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
