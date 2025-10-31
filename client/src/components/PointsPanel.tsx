import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Trophy, Users, TrendingUp, Copy, Share2, Gift } from "lucide-react";
import { SiX } from "react-icons/si";
import type { UserStats } from "@shared/schema";

interface PointsPanelProps {
  userAddress: string;
}

export function PointsPanel({ userAddress }: PointsPanelProps) {
  const { toast } = useToast();
  const [referralInput, setReferralInput] = useState("");

  // Fetch user stats
  const { data: stats } = useQuery<UserStats>({
    queryKey: ['/api/stats', userAddress],
    enabled: !!userAddress,
  });

  // Fetch leaderboard
  const { data: leaderboard = [] } = useQuery<UserStats[]>({
    queryKey: ['/api/leaderboard'],
  });

  // Generate referral code mutation
  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/referral/generate", { userAddress });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats', userAddress] });
      toast({
        title: "Referral Code Generated!",
        description: "Share your code to earn bonus points.",
      });
    },
  });

  // Apply referral code mutation
  const applyCodeMutation = useMutation({
    mutationFn: async (code: string) => {
      return apiRequest("POST", "/api/referral/apply", {
        userAddress,
        referralCode: code.toUpperCase(),
      });
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/stats', userAddress] });
      setReferralInput("");
      toast({
        title: "Success!",
        description: data.message || "Referral code applied!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed",
        description: error.message || "Invalid referral code",
        variant: "destructive",
      });
    },
  });

  const copyReferralLink = () => {
    if (!stats?.referralCode) return;
    const link = `${window.location.origin}?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard",
    });
  };

  const shareOnX = () => {
    if (!stats?.referralCode) return;
    const link = `${window.location.origin}?ref=${stats.referralCode}`;
    const text = `Join me on Polymeme! 🎰\n\nDegen AI predicts crypto - bet RIGHT or WRONG!\n\nUse my code: ${stats.referralCode}\n\nBoth get bonus points! 💎`;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(link)}`;
    window.open(twitterUrl, '_blank');
  };

  const userRank = leaderboard.findIndex(s => s.userAddress.toLowerCase() === userAddress.toLowerCase()) + 1;

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-[hsl(var(--neon-magenta))]/10 to-transparent border-[hsl(var(--neon-magenta))]/30" data-testid="card-points">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[hsl(var(--neon-magenta))]" />
              Airdrop Points
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-display text-[hsl(var(--neon-magenta))]" data-testid="text-points">
              {stats?.points.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Rank #{userRank > 0 ? userRank : '-'}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[hsl(var(--neon-cyan))]/10 to-transparent border-[hsl(var(--neon-cyan))]/30" data-testid="card-volume">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[hsl(var(--neon-cyan))]" />
              Total Volume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-display text-[hsl(var(--neon-cyan))]" data-testid="text-volume">
              ${parseFloat(stats?.volumeTraded || "0").toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              USDC wagered
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[hsl(var(--neon-green))]/10 to-transparent border-[hsl(var(--neon-green))]/30" data-testid="card-referrals">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[hsl(var(--neon-green))]" />
              Referrals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black font-display text-[hsl(var(--neon-green))]" data-testid="text-referral-count">
              {stats?.referralCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Friends referred
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Points Earning */}
      <Card data-testid="card-earning-info">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="w-5 h-5" />
            How to Earn Points
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--neon-magenta))]/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Trade to Earn</p>
              <p className="text-sm text-muted-foreground">1 point per USDC wagered</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
            <div className="w-10 h-10 rounded-full bg-[hsl(var(--neon-cyan))]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[hsl(var(--neon-cyan))]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Refer Friends</p>
              <p className="text-sm text-muted-foreground">50 points per referral + 10 points for your friend</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Your Referral Code */}
        <Card data-testid="card-your-referral">
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <CardDescription>Share to earn 50 points per friend</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.referralCode ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 border border-border text-center">
                  <p className="text-2xl font-bold font-mono tracking-widest" data-testid="text-referral-code">
                    {stats.referralCode}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={copyReferralLink}
                    variant="outline"
                    className="flex-1 gap-2"
                    data-testid="button-copy-link"
                  >
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </Button>
                  <Button
                    onClick={shareOnX}
                    className="flex-1 gap-2 bg-black hover:bg-black/80 text-white"
                    data-testid="button-share-x"
                  >
                    <SiX className="w-4 h-4" />
                    Share on X
                  </Button>
                </div>
              </>
            ) : (
              <Button
                onClick={() => generateCodeMutation.mutate()}
                className="w-full gap-2"
                disabled={generateCodeMutation.isPending}
                data-testid="button-generate-code"
              >
                <Share2 className="w-4 h-4" />
                Generate Referral Code
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Apply Referral Code */}
        <Card data-testid="card-apply-referral">
          <CardHeader>
            <CardTitle>Have a Referral Code?</CardTitle>
            <CardDescription>Get 10 bonus points instantly</CardDescription>
          </CardHeader>
          <CardContent>
            {stats?.referredBy ? (
              <div className="text-center p-4">
                <Badge variant="outline" className="text-[hsl(var(--neon-green))]">
                  ✓ Referral Applied
                </Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  You were referred by {stats.referredBy.substring(0, 6)}...{stats.referredBy.substring(38)}
                </p>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter code (e.g. ABC123)"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value.toUpperCase())}
                  className="font-mono"
                  maxLength={6}
                  data-testid="input-referral-code"
                />
                <Button
                  onClick={() => applyCodeMutation.mutate(referralInput)}
                  disabled={!referralInput || applyCodeMutation.isPending}
                  data-testid="button-apply-code"
                >
                  Apply
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card data-testid="card-leaderboard">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
            Top Farmers
          </CardTitle>
          <CardDescription>Top 10 airdrop point leaders</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {leaderboard.slice(0, 10).map((entry, index) => {
              const isCurrentUser = entry.userAddress.toLowerCase() === userAddress.toLowerCase();
              return (
                <div
                  key={entry.id}
                  className={`flex items-center gap-3 p-3 rounded-lg ${
                    isCurrentUser ? 'bg-[hsl(var(--neon-magenta))]/10 border border-[hsl(var(--neon-magenta))]/30' : 'bg-muted/30'
                  }`}
                  data-testid={`leaderboard-row-${index + 1}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                    index === 0 ? 'bg-yellow-500/20 text-yellow-500' :
                    index === 1 ? 'bg-gray-400/20 text-gray-400' :
                    index === 2 ? 'bg-orange-500/20 text-orange-500' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-mono text-sm">
                      {entry.userAddress.substring(0, 6)}...{entry.userAddress.substring(38)}
                      {isCurrentUser && <Badge variant="outline" className="ml-2 text-[hsl(var(--neon-magenta))]">You</Badge>}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{entry.points.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">${parseFloat(entry.volumeTraded).toLocaleString()} vol</p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
