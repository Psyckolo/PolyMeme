import { useQuery, useMutation } from "@tanstack/react-query";
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { GlitchText } from "@/components/GlitchText";
import { ParticleField } from "@/components/ParticleField";
import { PredictionCard } from "@/components/PredictionCard";
import { BetPanel } from "@/components/BetPanel";
import { ProphetChatDrawer } from "@/components/ProphetChatDrawer";
import { MetaMaskGuide } from "@/components/MetaMaskGuide";
import { WalletDiagnostic } from "@/components/WalletDiagnostic";
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
        title: "⚠️ MetaMask Non Installé",
        description: "Installez MetaMask puis rafraîchissez la page.",
        variant: "destructive",
      });
      window.open('https://metamask.io/download/', '_blank');
      return;
    }

    // Diagnostic: Find MetaMask provider
    let metaMaskProvider = null;
    const providers = (window.ethereum as any).providers;
    
    if (Array.isArray(providers) && providers.length > 0) {
      // Multiple wallets detected - find MetaMask
      metaMaskProvider = providers.find((p: any) => p.isMetaMask);
      
      if (!metaMaskProvider) {
        toast({
          title: "⚠️ Conflit de Wallets",
          description: "Désactivez les autres wallets et gardez seulement MetaMask. Allez dans chrome://extensions",
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
      
      console.log(`Found MetaMask among ${providers.length} providers`);
    } else if ((window.ethereum as any).isMetaMask) {
      metaMaskProvider = window.ethereum;
      console.log("Using direct MetaMask provider");
    } else {
      toast({
        title: "⚠️ MetaMask Non Détecté",
        description: "Vérifiez que MetaMask est installé et activé. Désactivez les autres wallets.",
        variant: "destructive",
      });
      return;
    }

    // Check if MetaMask is locked
    try {
      const accounts = await metaMaskProvider.request({ method: 'eth_accounts' });
      if (!accounts || accounts.length === 0) {
        toast({
          title: "🔒 MetaMask Verrouillé",
          description: "Cliquez sur l'icône 🦊 MetaMask et entrez votre mot de passe pour déverrouiller.",
          variant: "destructive",
          duration: 8000,
        });
        return;
      }
    } catch (error: any) {
      console.error("MetaMask locked check failed:", error);
      toast({
        title: "🔒 MetaMask Verrouillé ou Erreur",
        description: "Déverrouillez MetaMask puis réessayez.",
        variant: "destructive",
      });
      return;
    }

    // Everything checks out - try to connect
    const metaMaskConnector = connectors.find(c => c.id === 'injected' || c.name === 'MetaMask');
    if (metaMaskConnector) {
      try {
        console.log("Attempting to connect MetaMask...");
        await connect({ connector: metaMaskConnector });
        toast({
          title: "✅ Wallet Connecté",
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
        } else if (error.message?.includes("account")) {
          errorMsg = "MetaMask est verrouillé. Déverrouillez-le et réessayez.";
        }
        
        toast({
          title: "❌ Erreur de Connexion",
          description: errorMsg,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "⚠️ Connecteur Non Trouvé",
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
        {/* Complete wallet diagnostic */}
        <WalletDiagnostic />
        <MetaMaskGuide />
        
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
