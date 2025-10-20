import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChevronDown, ChevronUp, Trophy } from "lucide-react";
import type { Bet, Market } from "@shared/schema";

interface PositionWithMarket extends Bet {
  market?: Market;
}

interface PositionsTableProps {
  positions: PositionWithMarket[];
  onClaim: (marketId: string) => Promise<void>;
  onViewRationale: (marketId: string) => void;
}

export function PositionsTable({ positions, onClaim, onViewRationale }: PositionsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);

  const handleClaim = async (marketId: string) => {
    setClaiming(marketId);
    try {
      await onClaim(marketId);
    } finally {
      setClaiming(null);
    }
  };

  const canClaim = (position: PositionWithMarket) => {
    if (!position.market || position.claimed) return false;
    if (position.market.status !== "SETTLED") return false;
    if (position.market.winner === "TIE") return true;
    return position.market.winner === position.side;
  };

  if (positions.length === 0) {
    return (
      <Card className="p-12 text-center">
        <p className="text-muted-foreground">No positions yet. Place a bet to get started!</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Market</TableHead>
            <TableHead>Side</TableHead>
            <TableHead>Stake</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {positions.map((position) => {
            const isExpanded = expandedRow === position.id;
            const isWinner = canClaim(position);
            
            return (
              <>
                <TableRow 
                  key={position.id} 
                  className="hover-elevate cursor-pointer"
                  onClick={() => setExpandedRow(isExpanded ? null : position.id)}
                  data-testid={`row-position-${position.id}`}
                >
                  <TableCell className="font-medium">
                    {position.market?.assetName || "Unknown Market"}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={position.side === "RIGHT" ? "default" : "secondary"}
                      className={position.side === "RIGHT" ? "bg-[hsl(var(--neon-magenta))]/80 text-white border-[hsl(var(--neon-magenta))] shadow-[0_0_10px_rgba(255,0,255,0.4)]" : "bg-[hsl(var(--neon-cyan))]/80 text-white border-[hsl(var(--neon-cyan))] shadow-[0_0_10px_rgba(0,255,255,0.4)]"}
                    >
                      AI {position.side}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono" data-testid={`text-stake-${position.id}`}>
                    {parseFloat(position.amount).toLocaleString()} USDC
                  </TableCell>
                  <TableCell>
                    {position.claimed ? (
                      <Badge variant="outline">Claimed</Badge>
                    ) : position.market?.status === "SETTLED" ? (
                      isWinner ? (
                        <Badge variant="default" className="bg-[hsl(var(--neon-green))]/80 text-white border-[hsl(var(--neon-green))] shadow-[0_0_10px_rgba(0,255,136,0.4)]">
                          <Trophy className="w-3 h-3 mr-1" /> Won
                        </Badge>
                      ) : (
                        <Badge variant="destructive">Lost</Badge>
                      )
                    ) : position.market?.status === "LOCKED" ? (
                      <Badge className="bg-[hsl(var(--neon-cyan))]/30 text-[hsl(var(--neon-cyan))] border-[hsl(var(--neon-cyan))]/60 shadow-[0_0_10px_rgba(0,255,255,0.4)]">LOCKED</Badge>
                    ) : (
                      <Badge variant="secondary">{position.market?.status || "Pending"}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {isWinner && !position.claimed && (
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClaim(position.marketId);
                        }}
                        disabled={claiming === position.marketId}
                        className="bg-[hsl(var(--neon-green))] hover:bg-[hsl(var(--neon-green))]"
                        data-testid={`button-claim-${position.id}`}
                      >
                        {claiming === position.marketId ? "Claiming..." : "Claim"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExpandedRow(isExpanded ? null : position.id);
                      }}
                      data-testid={`button-expand-${position.id}`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </TableCell>
                </TableRow>
                
                {isExpanded && position.market && (
                  <TableRow>
                    <TableCell colSpan={5} className="bg-muted/20">
                      <div className="p-4 space-y-2">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Asset Type:</span>
                            <span className="ml-2 font-medium">{position.market.assetType}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Direction:</span>
                            <span className="ml-2 font-medium">{position.market.direction} {(position.market.thresholdBps / 100).toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Ticket ID:</span>
                            <span className="ml-2 font-mono text-xs">{position.ticketId}</span>
                          </div>
                          {position.payout && (
                            <div>
                              <span className="text-muted-foreground">Payout:</span>
                              <span className="ml-2 font-mono font-bold">{parseFloat(position.payout).toLocaleString()} USDC</span>
                            </div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewRationale(position.marketId)}
                          className="text-primary hover:text-primary"
                          data-testid={`button-rationale-${position.id}`}
                        >
                          View AI Rationale
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
