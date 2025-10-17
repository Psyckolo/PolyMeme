import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle } from "lucide-react";

export function MetaMaskGuide() {
  const isInIframe = window.self !== window.top;
  
  if (!isInIframe) return null;

  const openInNewTab = () => {
    window.open(window.location.href, '_blank');
  };

  return (
    <Alert className="bg-yellow-950/20 border-yellow-600/50 mb-6" data-testid="alert-metamask-guide">
      <AlertCircle className="h-4 w-4 text-yellow-600" />
      <AlertTitle className="text-yellow-600">MetaMask Connection Blocked</AlertTitle>
      <AlertDescription className="text-yellow-200/80 mt-2">
        <p className="mb-3">
          Replit preview runs in an iframe which prevents MetaMask from opening. 
          To connect your wallet, open this app in a new tab.
        </p>
        <Button 
          onClick={openInNewTab} 
          variant="outline" 
          size="sm"
          className="gap-2"
          data-testid="button-open-new-tab"
        >
          <ExternalLink className="w-4 h-4" />
          Open in New Tab
        </Button>
      </AlertDescription>
    </Alert>
  );
}
