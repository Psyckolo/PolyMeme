import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Link } from "wouter";
import { GlitchText } from "@/components/GlitchText";
import { ParticleField } from "@/components/ParticleField";
import { PredictionCard } from "@/components/PredictionCard";
import { BetPanel } from "@/components/BetPanel";
import { ProphetChatDrawer } from "@/components/ProphetChatDrawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, Ghost, LogOut, LayoutDashboard, TrendingUp, Shield, Zap, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Market } from "@shared/schema";
import heroImage from "@assets/generated_images/Cyberpunk_terminal_hero_background_7e72bdc2.png";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { toast } = useToast();
  const userAddress = address || "";

  // Fetch today's market
  const { data: market, isLoading: marketLoading } = useQuery<Market>({
    queryKey: ["/api/market/today"],
    enabled: true,
  });

  // Fetch user balance
  const { data: balanceData } = useQuery<{ balance: string }>({
    queryKey: ["/api/balance", userAddress],
    enabled: !!userAddress,
  });

  // Place bet mutation
  const placeBetMutation = useMutation({
    mutationFn: async ({ side, amount }: { side: "RIGHT" | "WRONG"; amount: string }) => {
      return apiRequest("POST", "/api/bet", {
        marketId: market?.id,
        userAddress,
        side,
        amount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance", userAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/market/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions", userAddress] });
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

  const handleBet = async (side: "RIGHT" | "WRONG", amount: string) => {
    if (!isConnected || !userAddress) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to place a bet.",
        variant: "destructive",
      });
      return;
    }
    await placeBetMutation.mutateAsync({ side, amount });
  };

  const handleConnect = async () => {
    console.log("Connect button clicked, connectors:", connectors);
    const metaMaskConnector = connectors.find(c => c.id === 'injected');
    
    if (!metaMaskConnector) {
      toast({
        title: "Wallet Not Found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Connecting with connector:", metaMaskConnector);
      await connect({ connector: metaMaskConnector });
      toast({
        title: "Wallet Connected",
        description: "Successfully connected to your wallet",
      });
    } catch (error: any) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  const handleDisconnect = () => {
    disconnect();
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected.",
    });
  };

  const handleAskProphet = async (question: string): Promise<string> => {
    try {
      const res = await apiRequest("POST", "/api/chat", { question, marketId: market?.id });
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
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-display font-black">
              <GlitchText text="ProphetX" className="text-3xl" />
            </h1>
            <Badge variant="outline" className="text-xs" data-testid="badge-data-mode">
              {market?.status === "SETTLED" ? "Live Data" : "Simulated"}
            </Badge>
          </div>
          
          <div className="flex items-center gap-3">
            {isConnected && (
              <Link href="/dashboard" data-testid="link-dashboard">
                <Button variant="outline" size="sm">
                  <LayoutDashboard className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            )}
            
            {isConnected ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="font-mono" data-testid="badge-wallet-address">
                  {userAddress.substring(0, 6)}...{userAddress.substring(38)}
                </Badge>
                <Button 
                  onClick={handleDisconnect} 
                  variant="outline"
                  size="icon"
                  data-testid="button-disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={handleConnect} 
                variant="default"
                className="bg-primary hover:bg-primary"
                data-testid="button-connect-wallet"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-4xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black font-display tracking-tight">
            <GlitchText text="PROPHET" className="inline-block" />
            <span className="text-[hsl(var(--neon-cyan))]">X</span>
          </h2>
          <p className="text-xl md:text-2xl text-foreground max-w-2xl mx-auto leading-relaxed">
            Every day, the AI makes one prediction on NFT floors or token prices.{" "}
            <span className="text-[hsl(var(--neon-magenta))] font-bold">Bet if it's RIGHT</span>
            {" "}or{" "}
            <span className="text-[hsl(var(--neon-cyan))] font-bold">if it's WRONG</span>.
          </p>
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
                GPT-5 analyzes market data and makes one daily prediction on crypto assets
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

        {/* Recent Activity */}
        <Card className="max-w-5xl mx-auto bg-card/50 backdrop-blur-sm border-border" data-testid="card-recent-activity">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-primary" />
              <CardTitle>Recent Market Activity</CardTitle>
            </div>
            <CardDescription>Live betting activity from ProphetX users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-3xl font-black font-display text-[hsl(var(--neon-magenta))]">18</div>
                <div className="text-sm text-muted-foreground mt-1">Active Bets</div>
              </div>
              <div>
                <div className="text-3xl font-black font-display text-[hsl(var(--neon-cyan))]">$547</div>
                <div className="text-sm text-muted-foreground mt-1">Total Volume</div>
              </div>
              <div>
                <div className="text-3xl font-black font-display text-primary">$127</div>
                <div className="text-sm text-muted-foreground mt-1">Largest Bet</div>
              </div>
            </div>
            
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                <span className="text-muted-foreground">0x7a2f...b3c4</span>
                <Badge variant="outline" className="text-[hsl(var(--neon-magenta))]">AI RIGHT</Badge>
                <span className="font-mono">$85</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                <span className="text-muted-foreground">0x9e1c...4a7d</span>
                <Badge variant="outline" className="text-[hsl(var(--neon-cyan))]">AI WRONG</Badge>
                <span className="font-mono">$42</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                <span className="text-muted-foreground">0x3b8f...2e6a</span>
                <Badge variant="outline" className="text-[hsl(var(--neon-magenta))]">AI RIGHT</Badge>
                <span className="font-mono">$127</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                <span className="text-muted-foreground">0x6d4a...8c9f</span>
                <Badge variant="outline" className="text-[hsl(var(--neon-cyan))]">AI WRONG</Badge>
                <span className="font-mono">$68</span>
              </div>
              <div className="flex items-center justify-between text-sm py-2 border-t border-border/50">
                <span className="text-muted-foreground">0x1f7b...5d2e</span>
                <Badge variant="outline" className="text-[hsl(var(--neon-magenta))]">AI RIGHT</Badge>
                <span className="font-mono">$93</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Prediction Card */}
        <PredictionCard market={market || null} isLoading={marketLoading} />

        {/* Bet Panel */}
        <BetPanel
          market={market || null}
          userBalance={balanceData?.balance || "0"}
          isConnected={isConnected}
          onBet={handleBet}
          onConnect={handleConnect}
        />

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
