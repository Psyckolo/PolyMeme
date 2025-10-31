import { Button } from "@/components/ui/button";
import { useSolana } from "@/contexts/SolanaContext";
import { Wallet, Loader2 } from "lucide-react";

export function SolanaWalletButton() {
  const { mode, walletAddress, connectWallet, disconnectWallet, isConnecting } = useSolana();

  if (mode === 'simulated') {
    return null;
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (walletAddress) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={disconnectWallet}
        className="font-mono text-xs"
        data-testid="button-disconnect-sol-wallet"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {formatAddress(walletAddress)}
      </Button>
    );
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={connectWallet}
      disabled={isConnecting}
      className="bg-gradient-to-r from-[hsl(var(--neon-magenta))] to-[hsl(var(--neon-cyan))] hover:opacity-90 font-bold"
      data-testid="button-connect-sol-wallet"
    >
      {isConnecting ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Linking Phantom...
        </>
      ) : (
        <>
          <Wallet className="w-4 h-4 mr-2" />
          👻 Connect Phantom
        </>
      )}
    </Button>
  );
}
