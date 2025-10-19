import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import type { Market } from "@shared/schema";
import { ArrowUp, ArrowDown, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { formatPrice } from "@/lib/utils/price";

interface MarketsTimelineProps {
  selectedMarketId?: string;
  onSelectMarket?: (market: Market) => void;
}

export function MarketsTimeline({ selectedMarketId, onSelectMarket }: MarketsTimelineProps) {
  const { data: markets = [], isLoading } = useQuery<Market[]>({
    queryKey: ['/api/markets'],
  });

  if (isLoading) {
    return (
      <Card className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle>Markets Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading markets...</div>
        </CardContent>
      </Card>
    );
  }

  const now = new Date();
  
  const getMarketStatus = (market: Market) => {
    const lockTime = new Date(market.lockTime);
    if (market.status === "SETTLED") return "settled";
    if (now > lockTime) return "locked";
    return "active";
  };

  const activeMarkets = markets.filter(m => getMarketStatus(m) === "active");
  const lockedMarkets = markets.filter(m => getMarketStatus(m) === "locked");
  const settledMarkets = markets.filter(m => getMarketStatus(m) === "settled");

  const MarketCard = ({ market }: { market: Market }) => {
    const status = getMarketStatus(market);
    const isSelected = selectedMarketId === market.id;

    return (
      <div 
        className={`p-4 rounded-lg border transition-all ${
          isSelected 
            ? "border-primary bg-primary/10 ring-2 ring-primary/50" 
            : "border-border bg-muted/20 hover-elevate cursor-pointer"
        }`}
        onClick={() => onSelectMarket?.(market)}
        data-testid={`market-${market.id}`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            {market.assetLogo && (
              <img 
                src={market.assetLogo} 
                alt={market.assetName}
                className="w-10 h-10 rounded-full"
              />
            )}
            <div>
              <h4 className="font-bold font-display">{market.assetName}</h4>
              <Badge variant="outline" className="text-xs">{market.assetType}</Badge>
            </div>
          </div>
          
          {status === "active" && (
            <Badge className="bg-[hsl(var(--neon-cyan))]/20 text-[hsl(var(--neon-cyan))] border-[hsl(var(--neon-cyan))]">
              <Clock className="w-3 h-3 mr-1" />
              Active
            </Badge>
          )}
          {status === "locked" && (
            <Badge variant="secondary">
              <Clock className="w-3 h-3 mr-1" />
              Locked
            </Badge>
          )}
          {status === "settled" && market.winner && (
            <Badge className={market.winner === "RIGHT" ? "bg-[hsl(var(--neon-magenta))]/20 text-[hsl(var(--neon-magenta))]" : "bg-[hsl(var(--neon-cyan))]/20 text-[hsl(var(--neon-cyan))]"}>
              {market.winner === "RIGHT" ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
              AI {market.winner === "RIGHT" ? "RIGHT" : "WRONG"}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-2">
          {market.direction === "UP" ? (
            <ArrowUp className="w-5 h-5 text-[hsl(var(--neon-green))]" />
          ) : (
            <ArrowDown className="w-5 h-5 text-destructive" />
          )}
          <span className="font-mono font-bold">
            {market.direction}
          </span>
        </div>

        {market.price0 && market.assetType === 'TOKEN' && (
          <div className="mt-2 text-sm text-muted-foreground font-mono" data-testid="text-token-price">
            Starting: {formatPrice(parseFloat(market.price0))}
          </div>
        )}
        
        {market.price0 && market.assetType === 'NFT' && (
          <div className="mt-2 text-sm text-muted-foreground font-mono" data-testid="text-nft-floor">
            Starting: {parseFloat(market.price0).toFixed(3)} ETH
          </div>
        )}

        <div className="mt-2 space-y-1 text-xs">
          <div>
            <span className="text-muted-foreground">AI RIGHT: </span>
            <span className="font-mono text-[hsl(var(--neon-magenta))]">{parseFloat(market.poolRight).toFixed(0)} USDC</span>
          </div>
          <div>
            <span className="text-muted-foreground">AI WRONG: </span>
            <span className="font-mono text-[hsl(var(--neon-cyan))]">{parseFloat(market.poolWrong).toFixed(0)} USDC</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border-border" data-testid="card-markets-timeline">
      <CardHeader>
        <CardTitle>Markets Timeline</CardTitle>
        <CardDescription>Track all prediction markets - active, locked, and settled</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Active Markets */}
        {activeMarkets.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[hsl(var(--neon-cyan))] animate-pulse" />
              Active Markets ({activeMarkets.length})
            </h3>
            <div className="space-y-3">
              {activeMarkets.map(market => <MarketCard key={market.id} market={market} />)}
            </div>
          </div>
        )}

        {/* Locked Markets */}
        {lockedMarkets.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Locked Markets ({lockedMarkets.length})
            </h3>
            <div className="space-y-3">
              {lockedMarkets.map(market => <MarketCard key={market.id} market={market} />)}
            </div>
          </div>
        )}

        {/* Settled Markets */}
        {settledMarkets.length > 0 && (
          <div>
            <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Settled Markets ({settledMarkets.length})
            </h3>
            <div className="space-y-3">
              {settledMarkets.slice(0, 5).map(market => <MarketCard key={market.id} market={market} />)}
            </div>
            {settledMarkets.length > 5 && (
              <Link href="/dashboard">
                <a className="text-sm text-primary hover:underline mt-2 inline-block">
                  View all {settledMarkets.length} settled markets →
                </a>
              </Link>
            )}
          </div>
        )}

        {markets.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            No markets available yet
          </div>
        )}

      </CardContent>
    </Card>
  );
}
