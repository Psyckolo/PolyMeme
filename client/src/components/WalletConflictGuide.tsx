import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useEffect, useState } from "react";

export function WalletConflictGuide() {
  const [hasConflict, setHasConflict] = useState(false);
  const [detectedWallets, setDetectedWallets] = useState<string[]>([]);

  useEffect(() => {
    const checkWalletConflict = () => {
      const wallets: string[] = [];
      
      // Check for multiple wallet providers
      if (window.ethereum) {
        if ((window.ethereum as any).isMetaMask) wallets.push("MetaMask");
        if ((window.ethereum as any).isPhantom) wallets.push("Phantom");
        if ((window.ethereum as any).isCoinbaseWallet) wallets.push("Coinbase Wallet");
        if ((window.ethereum as any).isBraveWallet) wallets.push("Brave Wallet");
        
        // Check for providers array (EIP-6963)
        const providers = (window.ethereum as any).providers;
        if (Array.isArray(providers) && providers.length > 1) {
          setHasConflict(true);
          setDetectedWallets(wallets.length > 0 ? wallets : [`${providers.length} wallets détectés`]);
        } else if (wallets.length > 1) {
          setHasConflict(true);
          setDetectedWallets(wallets);
        }
      }
    };

    checkWalletConflict();
  }, []);

  if (!hasConflict) return null;

  return (
    <Alert className="bg-orange-950/30 border-2 border-orange-500/60 mb-6" data-testid="alert-wallet-conflict">
      <AlertTriangle className="h-5 w-5 text-orange-500" />
      <AlertTitle className="text-orange-400 font-bold">⚠️ Conflit de Wallets Détecté</AlertTitle>
      <AlertDescription className="text-orange-100 mt-2">
        <p className="mb-3">
          Plusieurs wallets sont installés : <strong>{detectedWallets.join(", ")}</strong>
        </p>
        <div className="bg-orange-950/50 p-3 rounded border border-orange-600/30">
          <p className="font-bold mb-2">Solution Rapide :</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Ouvrez l'extension <strong>MetaMask</strong> dans votre navigateur</li>
            <li>Dans les paramètres MetaMask, allez dans <strong>Avancé</strong></li>
            <li>Activez <strong>"Utiliser MetaMask comme wallet par défaut"</strong></li>
            <li>Rafraîchissez cette page</li>
          </ol>
          <p className="mt-3 text-xs text-orange-200/80">
            Ou désactivez temporairement les autres extensions wallet dans chrome://extensions
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
}
