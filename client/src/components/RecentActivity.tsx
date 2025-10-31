import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Activity } from "lucide-react";

interface RecentBet {
  id: string;
  userAddress: string;
  prediction: "RIGHT" | "WRONG";
  amount: string;
  createdAt: string;
}

interface ActivityStats {
  activeBets: number;
  totalVolume: string;
  largestBet: string;
  recentBets: RecentBet[];
}

export function RecentActivity() {
  const { data: stats, isLoading } = useQuery<ActivityStats>({
    queryKey: ['/api/recent-activity'],
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  if (isLoading || !stats) {
    return (
      <Card className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Recent Market Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading activity...</div>
        </CardContent>
      </Card>
    );
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <Card 
      className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border-border"
      data-testid="card-recent-activity"
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
          Recent Market Activity
        </CardTitle>
        <CardDescription>Live betting activity from Polymeme degens</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Statistics */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <p className="text-4xl font-bold font-mono text-[hsl(var(--neon-magenta))]" data-testid="text-active-bets">
              {stats.activeBets}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Active Bets</p>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <p className="text-4xl font-bold font-mono text-[hsl(var(--neon-cyan))]" data-testid="text-total-volume">
              ${Math.floor(parseFloat(stats.totalVolume))}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Total Volume</p>
          </div>
          <div className="text-center p-4 bg-muted/20 rounded-lg">
            <p className="text-4xl font-bold font-mono text-[hsl(var(--neon-magenta))]" data-testid="text-largest-bet">
              ${Math.floor(parseFloat(stats.largestBet))}
            </p>
            <p className="text-sm text-muted-foreground mt-1">Largest Bet</p>
          </div>
        </div>

        {/* Recent Bets List */}
        {stats.recentBets.length > 0 ? (
          <div className="space-y-2">
            {stats.recentBets.map((bet) => (
              <div 
                key={bet.id}
                className="flex items-center justify-between p-3 bg-muted/10 rounded-lg hover-elevate"
                data-testid={`bet-${bet.id}`}
              >
                <span className="text-sm font-mono text-muted-foreground" data-testid="text-user-address">
                  {formatAddress(bet.userAddress)}
                </span>
                <span 
                  className={`text-sm font-bold ${
                    bet.prediction === "RIGHT" 
                      ? "text-[hsl(var(--neon-magenta))]" 
                      : "text-[hsl(var(--neon-cyan))]"
                  }`}
                  data-testid="text-prediction"
                >
                  AI {bet.prediction}
                </span>
                <span className="text-sm font-mono font-bold" data-testid="text-amount">
                  ${Math.floor(parseFloat(bet.amount))}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            No recent bets yet. Be the first to bet!
          </div>
        )}
      </CardContent>
    </Card>
  );
}
