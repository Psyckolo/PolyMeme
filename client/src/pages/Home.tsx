import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { GlitchText } from "@/components/GlitchText";
import { ParticleField } from "@/components/ParticleField";
import { PredictionCard } from "@/components/PredictionCard";
import { BetPanel } from "@/components/BetPanel";
import { ProphetChatDrawer } from "@/components/ProphetChatDrawer";
import { MetaMaskGuide } from "@/components/MetaMaskGuide";
import { WalletConflictGuide } from "@/components/WalletConflictGuide";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet, Ghost, LogOut } from "lucide-react";
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
    // Check if MetaMask is installed
    if (!window.ethereum) {
      toast({
        title: "MetaMask Non Installé",
        description: "Veuillez installer l'extension MetaMask pour continuer.",
        variant: "destructive",
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    // Try to get MetaMask specifically if multiple wallets exist
    let provider = window.ethereum;
    if ((window.ethereum as any).providers?.length > 0) {
      const providers = (window.ethereum as any).providers;
      const metamaskProvider = providers.find((p: any) => p.isMetaMask);
      if (metamaskProvider) {
        provider = metamaskProvider;
        console.log("Using MetaMask from providers array");
      }
    }

    const metaMaskConnector = connectors.find(c => c.id === 'injected' || c.name === 'MetaMask');
    if (metaMaskConnector) {
      try {
        console.log("Attempting to connect MetaMask...");
        await connect({ connector: metaMaskConnector });
        toast({
          title: "Wallet Connecté",
          description: "Votre wallet MetaMask est maintenant connecté.",
        });
      } catch (error: any) {
        console.error("MetaMask connection error:", error);
        
        // More helpful error messages
        let errorMsg = "Impossible de se connecter. Vérifiez que MetaMask est déverrouillé.";
        if (error.message?.includes("User rejected")) {
          errorMsg = "Connexion annulée. Veuillez approuver la connexion dans MetaMask.";
        } else if (error.message?.includes("already processing")) {
          errorMsg = "Une demande de connexion est déjà en cours. Vérifiez MetaMask.";
        }
        
        toast({
          title: "Erreur de Connexion",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "MetaMask Non Trouvé",
        description: "Impossible de trouver le connecteur MetaMask.",
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
                data-testid="button-connect-metamask"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Connect MetaMask
              </Button>
            )}
            
            <Button
              variant="outline"
              disabled
              className="opacity-40 cursor-not-allowed"
              data-testid="button-connect-phantom"
            >
              <Ghost className="w-4 h-4 mr-2" />
              Phantom
              <Badge variant="secondary" className="ml-2 text-xs">Soon</Badge>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 py-12 space-y-12">
        {/* Wallet warnings */}
        <MetaMaskGuide />
        <WalletConflictGuide />
        
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
