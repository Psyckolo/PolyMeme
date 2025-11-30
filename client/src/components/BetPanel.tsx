import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NeonButton } from "./NeonButton";
import { useSolana } from "@/contexts/SolanaContext";
import { Loader2 } from "lucide-react";
import type { Market } from "@shared/schema";

interface BetPanelProps {
  market: Market | null;
  userBalance: string;
  isConnected: boolean;
  onBet: (side: "RIGHT" | "WRONG", amount: string, mode?: "simulated" | "mainnet", currency?: "USDC" | "SOL") => Promise<void>;
  onConnect: () => void;
}

export function BetPanel({ market, userBalance, isConnected, onBet, onConnect }: BetPanelProps) {
  const { mode, walletAddress, solBalance } = useSolana();
  const [amount, setAmount] = useState("");
  const [isPlacingBet, setIsPlacingBet] = useState(false);

  const currency = mode === "mainnet" ? "SOL" : "USDC";
  const displayBalance = mode === "mainnet" ? solBalance.toFixed(4) : userBalance;

  const handleBet = async (side: "RIGHT" | "WRONG") => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsPlacingBet(true);
    try {
      await onBet(side, amount, mode, currency);
      setAmount("");
    } finally {
      setIsPlacingBet(false);
    }
  };

  if (!isConnected) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Connect to start aping predictions</p>
          <NeonButton onClick={onConnect} size="lg" testId="button-connect-wallet">
            🔗 Connect Twitter
          </NeonButton>
        </div>
      </Card>
    );
  }

  if (!market || market.status !== "OPEN") {
    return (
      <Card className="w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border">
        <div className="text-center text-muted-foreground">
          {!market ? "⏳ No active market - check back soon anon" : "🔒 Market locked - settlement incoming"}
        </div>
      </Card>
    );
  }

  const lockTime = new Date(market.lockTime);
  const now = new Date();
  const isLocked = now > lockTime;

  if (isLocked) {
    return (
      <Card className="w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border">
        <div className="text-center text-muted-foreground">
          🔒 Market locked - Oracle settling... WAGMI
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-3xl mx-auto p-8 bg-card border-2 border-card-border space-y-6">
      {/* Balance Display */}
      <div className="flex items-center justify-between p-4 bg-muted/20 rounded-lg border border-muted/40">
        <span className="text-sm text-muted-foreground uppercase tracking-wider">💰 Bag</span>
        <span className="font-mono text-xl font-bold" data-testid="text-user-balance">
          {parseFloat(displayBalance).toLocaleString(undefined, { maximumFractionDigits: 4 })} <span className="text-sm text-muted-foreground">{currency}</span>
        </span>
      </div>

      {/* Amount Input */}
      <div className="space-y-2">
        <Label htmlFor="bet-amount" className="text-sm uppercase tracking-wide text-muted-foreground">
          🎲 Bet Size ({currency})
        </Label>
        <Input
          id="bet-amount"
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="How much you sending?"
          className="font-mono text-lg"
          min="0"
          step="0.01"
          data-testid="input-bet-amount"
        />
        <div className="flex gap-2">
          {currency === "SOL" 
            ? ["0.1", "0.5", "1", "5"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md font-mono font-bold"
                  data-testid={`button-preset-${preset}`}
                >
                  {preset} SOL
                </button>
              ))
            : ["10", "50", "100", "500"].map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(preset)}
                  className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md font-mono font-bold"
                  data-testid={`button-preset-${preset}`}
                >
                  ${preset}
                </button>
              ))
          }
        </div>
      </div>

      {/* Bet Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <NeonButton
          variant="right"
          onClick={() => handleBet("RIGHT")}
          disabled={!amount || parseFloat(amount) <= 0 || isPlacingBet}
          size="lg"
          className="text-lg py-6"
          testId="button-bet-right"
        >
          {isPlacingBet ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> SENDING...</>
          ) : (
            "🚀 AI RIGHT"
          )}
        </NeonButton>
        <NeonButton
          variant="wrong"
          onClick={() => handleBet("WRONG")}
          disabled={!amount || parseFloat(amount) <= 0 || isPlacingBet}
          size="lg"
          className="text-lg py-6"
          testId="button-bet-wrong"
        >
          {isPlacingBet ? (
            <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> SENDING...</>
          ) : (
            "🔻 AI WRONG"
          )}
        </NeonButton>
      </div>

      {/* Deposit/Withdraw Link */}
      <div className="text-center">
        <a 
          href="/dashboard?tab=balance" 
          className="text-sm text-primary hover:text-primary/80 underline"
          data-testid="link-manage-balance"
        >
          Manage Balance (Deposit/Withdraw)
        </a>
      </div>
    </Card>
  );
}
