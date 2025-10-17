import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Minus } from "lucide-react";

interface BalancePanelProps {
  balance: string;
  onDeposit: (amount: string) => Promise<void>;
  onWithdraw: (amount: string) => Promise<void>;
  onWithdrawAll: () => Promise<void>;
}

export function BalancePanel({ balance, onDeposit, onWithdraw, onWithdrawAll }: BalancePanelProps) {
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) return;
    
    setIsDepositing(true);
    try {
      await onDeposit(depositAmount);
      setDepositAmount("");
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) return;
    
    setIsWithdrawing(true);
    try {
      await onWithdraw(withdrawAmount);
      setWithdrawAmount("");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleWithdrawAll = async () => {
    setIsWithdrawing(true);
    try {
      await onWithdrawAll();
      setWithdrawAmount("");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Balance */}
      <Card className="p-8 text-center bg-gradient-to-br from-card to-muted/20">
        <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">Available Balance</p>
        <p className="text-6xl font-bold font-mono" data-testid="text-balance">
          {parseFloat(balance).toLocaleString()}
          <span className="text-2xl text-muted-foreground ml-2">USDC</span>
        </p>
      </Card>

      {/* Deposit Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Plus className="w-5 h-5 text-[hsl(var(--neon-green))]" />
          <h3 className="text-xl font-bold">Deposit USDC</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="deposit-amount" className="text-sm">Amount</Label>
            <Input
              id="deposit-amount"
              type="number"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Enter amount to deposit"
              className="font-mono"
              min="0"
              step="0.01"
              data-testid="input-deposit"
            />
          </div>
          <div className="flex gap-2">
            {["10", "50", "100", "1000"].map((preset) => (
              <button
                key={preset}
                onClick={() => setDepositAmount(preset)}
                className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md font-mono"
                data-testid={`button-deposit-preset-${preset}`}
              >
                {preset}
              </button>
            ))}
          </div>
          <Button
            onClick={handleDeposit}
            disabled={!depositAmount || parseFloat(depositAmount) <= 0 || isDepositing}
            className="w-full bg-[hsl(var(--neon-green))] hover:bg-[hsl(var(--neon-green))]"
            data-testid="button-deposit"
          >
            {isDepositing ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Depositing...</>
            ) : (
              "Deposit"
            )}
          </Button>
        </div>
      </Card>

      {/* Withdraw Section */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Minus className="w-5 h-5 text-[hsl(var(--neon-cyan))]" />
          <h3 className="text-xl font-bold">Withdraw USDC</h3>
        </div>
        <div className="space-y-3">
          <div>
            <Label htmlFor="withdraw-amount" className="text-sm">Amount</Label>
            <Input
              id="withdraw-amount"
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Enter amount to withdraw"
              className="font-mono"
              min="0"
              step="0.01"
              max={balance}
              data-testid="input-withdraw"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWithdrawAmount((parseFloat(balance) * 0.25).toFixed(2))}
              className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md"
              data-testid="button-withdraw-25"
            >
              25%
            </button>
            <button
              onClick={() => setWithdrawAmount((parseFloat(balance) * 0.5).toFixed(2))}
              className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md"
              data-testid="button-withdraw-50"
            >
              50%
            </button>
            <button
              onClick={() => setWithdrawAmount((parseFloat(balance) * 0.75).toFixed(2))}
              className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md"
              data-testid="button-withdraw-75"
            >
              75%
            </button>
            <button
              onClick={() => setWithdrawAmount(balance)}
              className="px-3 py-1 text-xs bg-muted hover-elevate active-elevate-2 rounded-md"
              data-testid="button-withdraw-max"
            >
              Max
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleWithdraw}
              disabled={!withdrawAmount || parseFloat(withdrawAmount) <= 0 || isWithdrawing}
              variant="outline"
              data-testid="button-withdraw"
            >
              {isWithdrawing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Withdrawing...</>
              ) : (
                "Withdraw"
              )}
            </Button>
            <Button
              onClick={handleWithdrawAll}
              disabled={parseFloat(balance) <= 0 || isWithdrawing}
              className="bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]"
              data-testid="button-withdraw-all"
            >
              {isWithdrawing ? "Processing..." : "Withdraw All"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
