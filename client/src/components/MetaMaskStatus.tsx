import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, Lock, UserPlus } from "lucide-react";
import { useEffect, useState } from "react";

type MetaMaskStatus = "not-installed" | "locked" | "no-account" | "ready" | "checking";

export function MetaMaskStatus() {
  const [status, setStatus] = useState<MetaMaskStatus>("checking");

  useEffect(() => {
    const checkMetaMask = async () => {
      if (!window.ethereum) {
        setStatus("not-installed");
        return;
      }

      try {
        // Try to get accounts
        const accounts = await window.ethereum.request({ method: 'eth_accounts' }) as string[];
        
        if (accounts && accounts.length > 0) {
          setStatus("ready");
        } else {
          // No accounts - could be locked or no account created
          setStatus("locked");
        }
      } catch (error: any) {
        console.error("MetaMask check error:", error);
        if (error.message?.includes("account")) {
          setStatus("no-account");
        } else {
          setStatus("locked");
        }
      }
    };

    checkMetaMask();
    
    // Re-check when window regains focus (user might unlock MetaMask)
    const handleFocus = () => checkMetaMask();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  if (status === "ready" || status === "checking") return null;

  const content = {
    "not-installed": {
      icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      title: "❌ MetaMask Non Installé",
      description: (
        <>
          <p className="mb-3">MetaMask n'est pas installé dans votre navigateur.</p>
          <Button 
            onClick={() => window.open('https://metamask.io/download/', '_blank')}
            className="bg-orange-600 hover:bg-orange-500"
          >
            Télécharger MetaMask
          </Button>
        </>
      ),
    },
    "locked": {
      icon: <Lock className="h-5 w-5 text-yellow-500 animate-pulse" />,
      title: "🔒 MetaMask Est Verrouillé",
      description: (
        <>
          <p className="mb-3 font-medium">Votre wallet MetaMask est verrouillé.</p>
          <div className="bg-yellow-950/50 p-4 rounded border border-yellow-600/30 mb-3">
            <p className="font-bold mb-2">Étapes pour déverrouiller :</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Cliquez sur l'icône <strong>🦊 MetaMask</strong> en haut à droite de votre navigateur</li>
              <li>Entrez votre <strong>mot de passe</strong> MetaMask</li>
              <li>Cliquez sur <strong>"Déverrouiller"</strong></li>
              <li>Revenez sur cette page et cliquez sur <strong>"Connect MetaMask"</strong></li>
            </ol>
          </div>
          <p className="text-xs text-yellow-200/80">
            💡 Astuce : Gardez l'extension MetaMask épinglée dans votre barre d'outils
          </p>
        </>
      ),
    },
    "no-account": {
      icon: <UserPlus className="h-5 w-5 text-blue-500" />,
      title: "👤 Aucun Compte MetaMask",
      description: (
        <>
          <p className="mb-3">Vous devez créer ou importer un compte dans MetaMask.</p>
          <div className="bg-blue-950/50 p-4 rounded border border-blue-600/30">
            <p className="font-bold mb-2">Comment créer un compte :</p>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Ouvrez <strong>MetaMask</strong></li>
              <li>Suivez les instructions pour <strong>créer un wallet</strong></li>
              <li>Sauvegardez votre <strong>phrase secrète de récupération</strong> en lieu sûr</li>
              <li>Revenez ici et connectez-vous</li>
            </ol>
          </div>
        </>
      ),
    },
  };

  const currentContent = content[status];

  return (
    <Alert className="bg-gradient-to-r from-red-950/30 to-orange-950/30 border-2 border-red-500/60 mb-6" data-testid="alert-metamask-status">
      {currentContent.icon}
      <AlertTitle className="text-red-400 font-bold text-lg">{currentContent.title}</AlertTitle>
      <AlertDescription className="text-red-100 mt-3">
        {currentContent.description}
      </AlertDescription>
    </Alert>
  );
}
