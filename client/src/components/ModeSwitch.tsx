import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useSolana } from "@/contexts/SolanaContext";
import { Zap, Wallet } from "lucide-react";

export function ModeSwitch() {
  const { mode, setMode } = useSolana();

  return (
    <div className="flex items-center gap-3 px-4 py-2 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-[hsl(var(--neon-cyan))]" />
        <Label 
          htmlFor="mode-switch" 
          className={`text-sm font-medium cursor-pointer ${
            mode === 'simulated' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Simulated
        </Label>
      </div>

      <Switch
        id="mode-switch"
        checked={mode === 'mainnet'}
        onCheckedChange={(checked) => setMode(checked ? 'mainnet' : 'simulated')}
        className="data-[state=checked]:bg-[hsl(var(--neon-magenta))]"
        data-testid="switch-mode"
      />

      <div className="flex items-center gap-2">
        <Wallet className="w-4 h-4 text-[hsl(var(--neon-magenta))]" />
        <Label 
          htmlFor="mode-switch" 
          className={`text-sm font-medium cursor-pointer ${
            mode === 'mainnet' ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          Mainnet
        </Label>
        <Badge 
          variant="outline" 
          className="text-xs bg-[hsl(var(--neon-magenta))]/10 border-[hsl(var(--neon-magenta))]/30"
        >
          SOL
        </Badge>
      </div>
    </div>
  );
}
