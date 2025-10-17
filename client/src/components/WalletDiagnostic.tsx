import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Lock, CheckCircle2, XCircle, Wallet } from "lucide-react";
import { useEffect, useState } from "react";

type DiagnosticStatus = {
  hasMetaMask: boolean;
  hasMultipleWallets: boolean;
  isMetaMaskLocked: boolean;
  hasAccounts: boolean;
  detectedWallets: string[];
  canConnect: boolean;
};

export function WalletDiagnostic() {
  const [status, setStatus] = useState<DiagnosticStatus>({
    hasMetaMask: false,
    hasMultipleWallets: false,
    isMetaMaskLocked: false,
    hasAccounts: false,
    detectedWallets: [],
    canConnect: false,
  });
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const diagnose = async () => {
      const wallets: string[] = [];
      let metaMaskProvider = null;

      // Check for window.ethereum
      if (!window.ethereum) {
        setStatus({
          hasMetaMask: false,
          hasMultipleWallets: false,
          isMetaMaskLocked: false,
          hasAccounts: false,
          detectedWallets: [],
          canConnect: false,
        });
        return;
      }

      // Detect all wallets
      if ((window.ethereum as any).isMetaMask) wallets.push("MetaMask");
      if ((window.ethereum as any).isPhantom) wallets.push("Phantom");
      if ((window.ethereum as any).isCoinbaseWallet) wallets.push("Coinbase Wallet");
      if ((window.ethereum as any).isBraveWallet) wallets.push("Brave Wallet");

      // Check for multiple providers (EIP-6963)
      const providers = (window.ethereum as any).providers;
      if (Array.isArray(providers)) {
        metaMaskProvider = providers.find((p: any) => p.isMetaMask);
        providers.forEach((p: any) => {
          if (p.isPhantom && !wallets.includes("Phantom")) wallets.push("Phantom");
          if (p.isCoinbaseWallet && !wallets.includes("Coinbase Wallet")) wallets.push("Coinbase Wallet");
        });
      } else if ((window.ethereum as any).isMetaMask) {
        metaMaskProvider = window.ethereum;
      }

      const hasMultiple = wallets.length > 1 || (providers && providers.length > 1);

      // Try to check MetaMask status
      let hasAccounts = false;
      let isLocked = true;

      if (metaMaskProvider) {
        try {
          const accounts = await metaMaskProvider.request({ method: 'eth_accounts' });
          hasAccounts = accounts && accounts.length > 0;
          isLocked = !hasAccounts;
        } catch (error) {
          console.error("MetaMask diagnostic error:", error);
          isLocked = true;
        }
      }

      setStatus({
        hasMetaMask: !!metaMaskProvider,
        hasMultipleWallets: hasMultiple,
        isMetaMaskLocked: isLocked,
        hasAccounts,
        detectedWallets: wallets,
        canConnect: !!metaMaskProvider && hasAccounts,
      });
    };

    diagnose();

    // Re-check when window gains focus
    const handleFocus = () => diagnose();
    window.addEventListener('focus', handleFocus);

    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Don't show if everything is OK
  if (status.canConnect) return null;

  const StatusIcon = ({ ok }: { ok: boolean }) => 
    ok ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />;

  return (
    <Alert className="bg-gradient-to-r from-orange-950/40 to-red-950/40 border-2 border-orange-500/70 mb-6" data-testid="alert-wallet-diagnostic">
      <AlertTriangle className="h-5 w-5 text-orange-400 animate-pulse" />
      <AlertTitle className="text-orange-300 font-bold text-xl mb-3">
        🔧 Diagnostic Wallet - Action Requise
      </AlertTitle>
      <AlertDescription className="space-y-4">
        {/* Status Summary */}
        <div className="bg-black/40 p-4 rounded-lg border border-orange-500/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <StatusIcon ok={status.hasMetaMask} />
              <span>MetaMask {status.hasMetaMask ? "Détecté" : "Non Trouvé"}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon ok={!status.hasMultipleWallets} />
              <span>{status.hasMultipleWallets ? `${status.detectedWallets.length} Wallets (Conflit!)` : "Pas de conflit"}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon ok={!status.isMetaMaskLocked} />
              <span>MetaMask {status.isMetaMaskLocked ? "Verrouillé" : "Déverrouillé"}</span>
            </div>
            <div className="flex items-center gap-2">
              <StatusIcon ok={status.hasAccounts} />
              <span>{status.hasAccounts ? "Comptes OK" : "Aucun Compte"}</span>
            </div>
          </div>
        </div>

        {/* Wallets detected */}
        {status.detectedWallets.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <span className="text-sm text-orange-200">Wallets détectés :</span>
            {status.detectedWallets.map(wallet => (
              <Badge key={wallet} variant="outline" className="border-orange-500/50 text-orange-300">
                <Wallet className="w-3 h-3 mr-1" />
                {wallet}
              </Badge>
            ))}
          </div>
        )}

        {/* Primary issue - No MetaMask */}
        {!status.hasMetaMask && (
          <div className="bg-red-950/50 p-4 rounded-lg border border-red-500/50">
            <p className="font-bold text-red-300 mb-2">❌ MetaMask Non Installé</p>
            <p className="text-sm text-red-200 mb-3">Vous devez installer MetaMask pour utiliser ProphetX.</p>
            <Button 
              onClick={() => window.open('https://metamask.io/download/', '_blank')}
              className="bg-red-600 hover:bg-red-500"
              data-testid="button-install-metamask"
            >
              Installer MetaMask
            </Button>
          </div>
        )}

        {/* Multiple wallets conflict */}
        {status.hasMetaMask && status.hasMultipleWallets && (
          <div className="bg-orange-950/50 p-4 rounded-lg border border-orange-500/50">
            <p className="font-bold text-orange-300 mb-2">⚠️ Conflit Détecté : {status.detectedWallets.join(", ")}</p>
            <p className="text-sm text-orange-200 mb-3">
              Plusieurs wallets se battent pour le contrôle. Vous devez désactiver les autres.
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-orange-100">Solution Rapide :</p>
              <ol className="list-decimal list-inside space-y-1 text-orange-200/90">
                <li>Ouvrez <code className="bg-black/50 px-1">chrome://extensions</code> dans votre navigateur</li>
                <li>Désactivez temporairement <strong>tous les wallets sauf MetaMask</strong></li>
                <li>Rafraîchissez cette page (F5)</li>
              </ol>
            </div>
          </div>
        )}

        {/* MetaMask locked */}
        {status.hasMetaMask && !status.hasMultipleWallets && status.isMetaMaskLocked && (
          <div className="bg-yellow-950/50 p-4 rounded-lg border border-yellow-500/50">
            <p className="font-bold text-yellow-300 mb-2 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              🔒 MetaMask Est Verrouillé
            </p>
            <div className="space-y-2 text-sm">
              <p className="font-semibold text-yellow-100">Déverrouiller MetaMask :</p>
              <ol className="list-decimal list-inside space-y-1 text-yellow-200/90">
                <li>Cliquez sur l'icône <strong>🦊 MetaMask</strong> en haut à droite</li>
                <li>Entrez votre <strong>mot de passe</strong></li>
                <li>Cliquez sur <strong>"Déverrouiller"</strong></li>
                <li>Revenez ici - cette alerte disparaîtra automatiquement</li>
              </ol>
            </div>
          </div>
        )}

        {/* Debug button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="text-orange-300 hover:text-orange-200"
          data-testid="button-show-diagnostic-details"
        >
          {showDetails ? "Masquer" : "Afficher"} les détails techniques
        </Button>

        {showDetails && (
          <div className="bg-black/60 p-3 rounded text-xs font-mono text-green-400 overflow-auto">
            <pre>{JSON.stringify(status, null, 2)}</pre>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
