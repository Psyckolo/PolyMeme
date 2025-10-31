import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSolana } from "@/contexts/SolanaContext";
import { Wallet, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function SolanaBalanceCard() {
  const { mode, walletAddress, solBalance, connectWallet } = useSolana();
  const [isRefreshing, setIsRefreshing] = useState(false);

  if (mode === 'simulated') {
    return null;
  }

  const refreshBalance = async () => {
    if (!walletAddress) return;
    setIsRefreshing(true);
    try {
      const provider = (window as any).solana;
      const connection = new (window as any).solanaWeb3.Connection(
        'https://api.mainnet-beta.solana.com'
      );
      const balance = await connection.getBalance(provider.publicKey);
      // We'd need to update the context here, but for now just log
      console.log('Balance:', balance / 1e9, 'SOL');
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!walletAddress) {
    return (
      <Card className="bg-gradient-to-br from-[hsl(var(--neon-magenta))]/10 to-transparent border-[hsl(var(--neon-magenta))]/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
            Solana Wallet
          </CardTitle>
          <CardDescription>Connect your Phantom wallet to bet with SOL</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={connectWallet}
            className="w-full bg-gradient-to-r from-[hsl(var(--neon-magenta))] to-[hsl(var(--neon-cyan))]"
            data-testid="button-connect-wallet-dashboard"
          >
            <Wallet className="w-4 h-4 mr-2" />
            Connect Phantom Wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-[hsl(var(--neon-magenta))]/10 to-transparent border-[hsl(var(--neon-magenta))]/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-[hsl(var(--neon-magenta))]" />
            SOL Balance
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshBalance}
            disabled={isRefreshing}
            data-testid="button-refresh-sol-balance"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
        <CardDescription className="font-mono text-xs">
          {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-black font-display text-[hsl(var(--neon-magenta))]" data-testid="text-sol-balance">
          {solBalance.toFixed(4)} SOL
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Available for betting on mainnet markets
        </p>
      </CardContent>
    </Card>
  );
}
