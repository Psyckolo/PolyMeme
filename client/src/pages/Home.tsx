import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import { GlitchText } from "@/components/GlitchText";
import { ParticleField } from "@/components/ParticleField";
import { PredictionCard } from "@/components/PredictionCard";
import { BetPanel } from "@/components/BetPanel";
import { ProphetChatDrawer } from "@/components/ProphetChatDrawer";
import { MarketsTimeline } from "@/components/MarketsTimeline";
import { PastMarkets } from "@/components/PastMarkets";
import { RecentActivity } from "@/components/RecentActivity";
import { ModeSwitch } from "@/components/ModeSwitch";
import { SolanaWalletButton } from "@/components/SolanaWalletButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Ghost, LogOut, LayoutDashboard, TrendingUp, Shield, Zap, Activity, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Market } from "@shared/schema";
import heroImage from "@assets/generated_images/Cyberpunk_terminal_hero_background_7e72bdc2.png";

export default function Home() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const userAddress = user?.id || "";

  // Track previous auth state to show toast only on new logins
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Show success toast when auth state changes from false to true
  useEffect(() => {
    if (isAuthenticated && !wasAuthenticated) {
      toast({
        title: "Logged In",
        description: `Welcome ${user?.firstName || user?.email || "back"}!`,
      });
      setWasAuthenticated(true);
    } else if (!isAuthenticated && wasAuthenticated) {
      setWasAuthenticated(false);
    }
  }, [isAuthenticated, wasAuthenticated, toast, user]);

  // Fetch all markets
  const { data: allMarkets = [], isLoading: marketsLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    enabled: true,
  });

  // Selected market state (default to most recent)
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);

  // Set initial selected market to most recent when markets load
  useEffect(() => {
    if (allMarkets.length > 0 && !selectedMarket) {
      setSelectedMarket(allMarkets[0]);
    }
  }, [allMarkets, selectedMarket]);

  // Update selected market when markets data changes (after bet)
  useEffect(() => {
    if (selectedMarket && allMarkets.length > 0) {
      const updatedMarket = allMarkets.find(m => m.id === selectedMarket.id);
      if (updatedMarket) {
        setSelectedMarket(updatedMarket);
      }
    }
  }, [allMarkets]);

  // Filter active and past markets
  const activeMarkets = allMarkets.filter(m => m.status === "OPEN");
  const pastMarkets = allMarkets.filter(m => m.status === "SETTLED" || m.status === "REFUND").slice(0, 5);

  // Fetch user balance
  const { data: balanceData } = useQuery<{ balance: string }>({
    queryKey: ["/api/balance", userAddress],
    enabled: !!userAddress,
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async ({ side, amount, mode, currency }: { side: "RIGHT" | "WRONG"; amount: string; mode?: "simulated" | "mainnet"; currency?: "USDC" | "SOL" }) => {
      return apiRequest("POST", "/api/bet", {
        marketId: selectedMarket?.id,
        userAddress,
        side,
        amount,
        mode: mode || "simulated",
        currency: currency || "USDC",
      });
    },
    onSuccess: async () => {
      // Invalidate AND refetch all related queries immediately
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["/api/balance", userAddress] }),
        queryClient.invalidateQueries({ queryKey: ["/api/markets"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/positions", userAddress] }),
        queryClient.invalidateQueries({ queryKey: ["/api/stats", userAddress] }),
      ]);
      
      // Force refetch markets to update pool stats immediately
      await queryClient.refetchQueries({ queryKey: ["/api/markets"] });
      
      toast({
        title: "Bet Placed!",
        description: "Your prediction has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Bet Failed",
        description: error.message || "Failed to place bet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBet = async (side: "RIGHT" | "WRONG", amount: string, mode?: "simulated" | "mainnet", currency?: "USDC" | "SOL") => {
    if (!isAuthenticated || !userAddress) {
      toast({
        title: "Not Logged In",
        description: "Please log in with X (Twitter) to place a bet.",
        variant: "destructive",
      });
      return;
    }
    await placeBetMutation.mutateAsync({ side, amount, mode, currency });
  };

  const handleLogin = () => {
    window.location.href = "/auth/twitter";
  };

  const handleLogout = () => {
    window.location.href = "/auth/logout";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const handlePhantomLogin = () => {
    toast({
      title: "Coming Soon",
      description: "Phantom login will be available soon!",
    });
  };

  // Simplified connect button rendering
  const renderAuthButton = () => {
    if (!isAuthenticated) {
      return (
        <div className="flex items-center gap-2">
          <Button 
            onClick={handleLogin}
            className="bg-[#00ffff] hover:bg-[#00ffff]/90 text-black font-bold"
            data-testid="button-login"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Login with X
          </Button>
          <Button 
            onClick={handlePhantomLogin}
            variant="outline"
            className="border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/10"
            data-testid="button-login-phantom"
          >
            <Wallet className="mr-2 h-4 w-4" />
            Phantom soon
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-[#00ffff] text-[#00ffff]">
          <Ghost className="mr-1.5 h-3 w-3" />
          {user?.firstName || user?.email || "User"}
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="hover:bg-[#ff00ff]/10 hover:text-[#ff00ff]"
          data-testid="button-logout"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  };


  const handleAskProphet = async (question: string): Promise<string> => {
    try {
      const res = await apiRequest("POST", "/api/chat", { question, marketId: selectedMarket?.id });
      const data = await res.json();
      console.log("Chat response received:", data);
      console.log("Answer value:", data.answer, "Type:", typeof data.answer);
      
      // Server always returns a helpful response with fallbacks
      if (data.answer && data.answer.trim().length > 0) {
        return data.answer;
      }
      
      // This should rarely happen now
      console.warn("Received empty answer from server, using client fallback");
      return "The Prophet is currently unavailable. Please try again.";
    } catch (error) {
      console.error("Error asking Prophet:", error);
      return "Unable to connect to the Prophet. Please check your connection and try again.";
    }
  };

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <ParticleField />
      
      {/* Hero Background */}
      <div 
        className="absolute inset-0 opacity-15 bg-cover bg-center z-0"
        style={{ 
          backgroundImage: `url(${heroImage})`,
          backgroundBlendMode: "overlay",
        }}
      />
      
      {/* Dark gradient wash over hero */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-background z-0" />

      {/* Header */}
      <header className="relative z-10 border-b border-border backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-black">
              <GlitchText text="Polymeme" className="text-3xl" />
            </h1>
          </div>

          <ModeSwitch />
          
          <div className="flex items-center gap-3">
            <SolanaWalletButton />
            
            {isAuthenticated && (
              <Link href="/dashboard" data-testid="link-dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            
            {renderAuthButton()}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black font-display tracking-tight">
            <GlitchText text="POLY" className="inline-block" />
            <span className="text-[hsl(var(--neon-magenta))]">MEME</span>
          </h2>
          <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto leading-relaxed">
            Every day, the AI makes predictions on NFT floors and token prices.{" "}
            <span className="text-[hsl(var(--neon-magenta))] font-bold">Bet if it's RIGHT</span>
            {" "}or{" "}
            <span className="text-[hsl(var(--neon-cyan))] font-bold">if it's WRONG</span>.
          </p>
          
          <div className="mt-4">
            <a
              href="https://pump.fun/coin/9YtiWEDKHmVWPHQ8Uk4V2CMPBqj4ZzGNu26n4Ke3pump"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-mono text-[hsl(var(--neon-cyan))] hover:text-[hsl(var(--neon-cyan))]/80 transition-colors hover-elevate px-3 py-1.5 rounded-md border border-[hsl(var(--neon-cyan))]/30 bg-[hsl(var(--neon-cyan))]/5"
              data-testid="link-prox-token"
            >
              <span className="text-muted-foreground">$PROX address:</span>
              <span className="font-bold">9YtiWEDKHmVWPHQ8Uk4V2CMPBqj4ZzGNu26n4Ke3pump</span>
            </a>
          </div>
        </div>

        {/* How It Works */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-card/50 backdrop-blur-sm border-border" data-testid="card-how-it-works-1">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--neon-cyan))]/20 flex items-center justify-center mb-3">
                <TrendingUp className="w-6 h-6 text-[hsl(var(--neon-cyan))]" />
              </div>
              <CardTitle className="text-lg">AI Prediction</CardTitle>
              <CardDescription>
                GPT-5 analyzes market data and makes daily predictions on crypto assets
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border" data-testid="card-how-it-works-2">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-[hsl(var(--neon-magenta))]/20 flex items-center justify-center mb-3">
                <Zap className="w-6 h-6 text-[hsl(var(--neon-magenta))]" />
              </div>
              <CardTitle className="text-lg">Place Your Bet</CardTitle>
              <CardDescription>
                Bet USDC on AI RIGHT or AI WRONG. Pools close after 24 hours
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="bg-card/50 backdrop-blur-sm border-border" data-testid="card-how-it-works-3">
            <CardHeader>
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">Win & Claim</CardTitle>
              <CardDescription>
                Winners split the losing pool proportionally. Claim anytime in Dashboard
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Selected Market Prediction Card */}
        <PredictionCard market={selectedMarket} isLoading={marketsLoading} />

        {/* Bet Panel */}
        <BetPanel
          market={selectedMarket}
          userBalance={balanceData?.balance || "0"}
          isConnected={isAuthenticated}
          onBet={handleBet}
          onConnect={handleLogin}
        />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Markets Timeline */}
        <MarketsTimeline 
          selectedMarketId={selectedMarket?.id}
          onSelectMarket={setSelectedMarket}
        />

        {/* Past Markets */}
        <div className="max-w-5xl mx-auto">
          <PastMarkets markets={pastMarkets} />
        </div>

        {/* Disclaimer */}
        <div className="text-center text-sm text-muted-foreground border-t border-border pt-8">
          <p>⚠️ Experimental Game / Not Financial Advice</p>
        </div>
      </main>

      {/* Chat Drawer */}
      <ProphetChatDrawer onAsk={handleAskProphet} />
    </div>
  );
}
