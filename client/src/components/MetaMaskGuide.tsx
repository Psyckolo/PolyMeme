import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";

export function MetaMaskGuide() {
  const isInIframe = window.self !== window.top;
  
  if (!isInIframe) return null;

  const openInNewTab = () => {
    const newWindow = window.open(window.location.href, '_blank');
    if (newWindow) {
      newWindow.focus();
    }
  };

  return (
    <Alert className="bg-gradient-to-r from-yellow-950/30 to-orange-950/30 border-2 border-yellow-500/60 mb-6 shadow-lg" data-testid="alert-metamask-guide">
      <AlertCircle className="h-5 w-5 text-yellow-500 animate-pulse" />
      <AlertTitle className="text-yellow-400 font-bold text-lg">⚠️ Action Requise: Ouvrir dans un Nouvel Onglet</AlertTitle>
      <AlertDescription className="text-yellow-100 mt-3">
        <p className="mb-3 font-medium">
          Le preview Replit bloque MetaMask. Pour connecter votre wallet, vous DEVEZ ouvrir cette application dans un nouvel onglet :
        </p>
        <Button 
          onClick={openInNewTab} 
          variant="default"
          size="lg"
          className="gap-2 bg-yellow-600 hover:bg-yellow-500 text-black font-bold shadow-lg shadow-yellow-600/50"
          data-testid="button-open-new-tab"
        >
          <ExternalLink className="w-5 h-5" />
          OUVRIR EN NOUVEL ONGLET
        </Button>
        <p className="mt-3 text-sm text-yellow-200/80">
          Une fois ouvert dans un nouvel onglet, MetaMask fonctionnera normalement.
        </p>
      </AlertDescription>
    </Alert>
  );
}
