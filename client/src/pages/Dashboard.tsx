import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { PositionsTable } from "@/components/PositionsTable";
import { BalancePanel } from "@/components/BalancePanel";
import { PointsPanel } from "@/components/PointsPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Wallet, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import confetti from "canvas-confetti";
import type { Bet, Market } from "@shared/schema";

interface PositionWithMarket extends Bet {
  market?: Market;
}

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const userAddress = user?.id || "";
  
  // Get tab from URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialTab = urlParams.get("tab") || "positions";
  const [activeTab, setActiveTab] = useState(initialTab);

  // Fetch user balance
  const { data: balanceData } = useQuery<{ balance: string }>({
    queryKey: ["/api/balance", userAddress],
  });

  // Fetch user positions
  const { data: positions = [] } = useQuery<PositionWithMarket[]>({
    queryKey: ["/api/positions", userAddress],
  });

  // Deposit mutation
  const depositMutation = useMutation({
    mutationFn: async (amount: string) => {
      return apiRequest("POST", "/api/deposit", { userAddress, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance", userAddress] });
      toast({
        title: "Deposit Successful",
        description: "USDC has been added to your balance.",
      });
    },
    onError: () => {
      toast({
        title: "Deposit Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Withdraw mutation
  const withdrawMutation = useMutation({
    mutationFn: async (amount: string) => {
      return apiRequest("POST", "/api/withdraw", { userAddress, amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/balance", userAddress] });
      toast({
        title: "Withdrawal Successful",
        description: "USDC has been sent to your wallet.",
      });
    },
    onError: () => {
      toast({
        title: "Withdrawal Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  // Claim mutation
  const claimMutation = useMutation({
    mutationFn: async (marketId: string) => {
      return apiRequest("POST", "/api/claim", { marketId, userAddress });
    },
    onSuccess: () => {
      // Confetti celebration!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#ff00ff", "#00ffff", "#00ff88"],
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/balance", userAddress] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions", userAddress] });
      toast({
        title: "🎉 Claim Successful!",
        description: "Your winnings have been added to your balance.",
      });
    },
    onError: () => {
      toast({
        title: "Claim Failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleViewRationale = (marketId: string) => {
    // For now, just show a toast. In full version, open a modal/sheet
    toast({
      title: "AI Rationale",
      description: "Rationale viewer coming soon!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="gap-2"
            data-testid="button-back-home"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <Badge variant="outline" className="border-[#00ffff] text-[#00ffff]" data-testid="badge-user-name">
                  {user?.firstName || user?.email || "User"}
                </Badge>
                <Button 
                  onClick={() => window.location.href = "/api/logout"} 
                  variant="outline"
                  size="icon"
                  data-testid="button-disconnect"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button 
                  onClick={() => window.location.href = "/api/login"} 
                  variant="default"
                  data-testid="button-login"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Login with X
                </Button>
                <Button 
                  onClick={() => toast({ title: "Coming Soon", description: "MetaMask login will be available soon!" })}
                  variant="outline"
                  className="border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/10"
                  data-testid="button-login-metamask"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  Login Metamask
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-black font-display mb-8">Dashboard</h1>

        {!isAuthenticated ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Log in with X (Twitter) or MetaMask to view your dashboard</p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => window.location.href = "/api/login"}
                data-testid="button-login-dashboard"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Login with X
              </Button>
              <Button 
                onClick={() => toast({ title: "Coming Soon", description: "MetaMask login will be available soon!" })}
                variant="outline"
                className="border-[#ff00ff] text-[#ff00ff] hover:bg-[#ff00ff]/10"
                data-testid="button-login-metamask-dashboard"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Login Metamask
              </Button>
            </div>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-3xl grid-cols-5">
            <TabsTrigger value="positions" data-testid="tab-positions">Positions</TabsTrigger>
            <TabsTrigger value="balance" data-testid="tab-balance">Balance</TabsTrigger>
            <TabsTrigger value="points" data-testid="tab-points">Points</TabsTrigger>
            <TabsTrigger value="staking" data-testid="tab-staking">Staking</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            <PositionsTable
              positions={positions}
              onClaim={(marketId) => claimMutation.mutateAsync(marketId)}
              onViewRationale={handleViewRationale}
            />
          </TabsContent>

          <TabsContent value="balance" className="max-w-2xl">
            <BalancePanel
              balance={balanceData?.balance || "0"}
              onDeposit={(amount) => depositMutation.mutateAsync(amount)}
              onWithdraw={(amount) => withdrawMutation.mutateAsync(amount)}
              onWithdrawAll={() => withdrawMutation.mutateAsync(balanceData?.balance || "0")}
            />
          </TabsContent>

          <TabsContent value="points" className="space-y-4">
            <PointsPanel userAddress={userAddress} />
          </TabsContent>

          <TabsContent value="staking" className="space-y-4">
            <Card className="p-12 text-center">
              <h3 className="text-2xl font-bold mb-4">Staking - Coming Soon</h3>
              <p className="text-muted-foreground mb-6">
                Stake your ProphetX tokens to reduce betting fees and earn rewards.
              </p>
              <div className="max-w-md mx-auto text-left space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">Reduce trading fees from 2% to as low as 0.5%</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">Earn passive rewards from protocol revenue</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-primary">•</span>
                  <span className="text-sm">Unlock exclusive prediction markets and perks</span>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card className="p-12 text-center">
              <p className="text-muted-foreground">
                Market history coming soon! Your past predictions will appear here.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
        )}
      </main>
    </div>
  );
}
