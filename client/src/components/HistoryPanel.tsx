import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import type { Market } from "@shared/schema";

interface HistoryPanelProps {
  userAddress: string;
}

export function HistoryPanel({ userAddress }: HistoryPanelProps) {
  const { data: markets = [], isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  const settledMarkets = markets
    .filter((m) => m.status === "SETTLED")
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime());

  if (isLoading) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">Loading history...</p>
      </Card>
    );
  }

  if (settledMarkets.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">
          No settled markets yet. Check back after markets close!
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Market History</h2>
      
      <div className="grid gap-4">
        {settledMarkets.map((market) => {
          const price0 = parseFloat(market.price0 || "0");
          const price1 = parseFloat(market.price1 || "0");
          const priceChange = price0 > 0 ? ((price1 - price0) / price0) * 100 : 0;
          const isPriceUp = price1 > price0;
          
          return (
            <Card key={market.id} className="hover-elevate" data-testid={`card-history-${market.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span>{market.assetId.toUpperCase().replace(/-/g, " ")}</span>
                      <Badge 
                        variant="outline" 
                        className={market.assetType === "TOKEN" ? "border-[#00ffff] text-[#00ffff]" : "border-[#ff00ff] text-[#ff00ff]"}
                      >
                        {market.assetType}
                      </Badge>
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">
                      Settled: {new Date(market.endTime).toLocaleDateString()} {new Date(market.endTime).toLocaleTimeString()}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <Badge 
                      variant={market.winner === "RIGHT" ? "default" : market.winner === "WRONG" ? "secondary" : "outline"}
                      className={
                        market.winner === "RIGHT" 
                          ? "bg-[#ff00ff] text-white border-[#ff00ff]" 
                          : market.winner === "WRONG"
                          ? "bg-[#00ffff] text-black border-[#00ffff]"
                          : ""
                      }
                      data-testid={`badge-winner-${market.id}`}
                    >
                      AI {market.winner}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">AI Prediction</p>
                    <div className="flex items-center gap-1 font-bold">
                      {market.direction === "UP" ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={market.direction === "UP" ? "text-green-500" : "text-red-500"}>
                        {market.direction}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Actual Result</p>
                    <div className="flex items-center gap-1 font-bold">
                      {isPriceUp ? (
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-500" />
                      )}
                      <span className={isPriceUp ? "text-green-500" : "text-red-500"}>
                        {isPriceUp ? "UP" : "DOWN"} {priceChange.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <p className="text-muted-foreground">Start Price</p>
                    <p className="font-mono font-bold">
                      {market.assetType === "TOKEN" 
                        ? `$${price0.toFixed(6)}` 
                        : `${price0.toFixed(3)} ETH`}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Final Price</p>
                    <p className="font-mono font-bold">
                      {market.assetType === "TOKEN" 
                        ? `$${price1.toFixed(6)}` 
                        : `${price1.toFixed(3)} ETH`}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground">Total Pool</p>
                    <p className="font-mono font-bold">
                      {(parseFloat(market.poolRight) + parseFloat(market.poolWrong)).toFixed(0)} USDC
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
                  <div>
                    <span className="text-muted-foreground">RIGHT Pool: </span>
                    <span className="font-mono text-[#ff00ff]">{parseFloat(market.poolRight).toFixed(0)} USDC</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">WRONG Pool: </span>
                    <span className="font-mono text-[#00ffff]">{parseFloat(market.poolWrong).toFixed(0)} USDC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
