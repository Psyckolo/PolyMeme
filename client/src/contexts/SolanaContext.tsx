import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SolanaContextType {
  mode: 'simulated' | 'mainnet';
  setMode: (mode: 'simulated' | 'mainnet') => void;
  walletAddress: string | null;
  solBalance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  sendSol: (amountSol: number) => Promise<string | null>;
  refreshBalance: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

// Treasury wallet address for receiving bets (Solana mainnet)
const TREASURY_WALLET = 'PoLYDd3d8mZqj2Wk8vNwJpWpVdZ1SNwVsHqAVypbPEM';

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'simulated' | 'mainnet'>('simulated');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const refreshBalance = async () => {
    if (!walletAddress) return;
    
    try {
      const provider = (window as any).solana;
      if (!provider?.publicKey) return;
      
      const rpcResponse = await fetch('/api/solana/rpc-url');
      const { url: rpcUrl } = await rpcResponse.json();
      
      const connection = new (window as any).solanaWeb3.Connection(rpcUrl);
      const balance = await connection.getBalance(provider.publicKey);
      setSolBalance(balance / 1e9);
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  };

  const sendSol = async (amountSol: number): Promise<string | null> => {
    if (!walletAddress) {
      alert('Please connect your wallet first');
      return null;
    }

    try {
      const provider = (window as any).solana;
      if (!provider?.isPhantom) {
        alert('Please install Phantom wallet');
        return null;
      }

      // Get RPC URL from backend
      const rpcResponse = await fetch('/api/solana/rpc-url');
      const { url: rpcUrl } = await rpcResponse.json();
      
      const solanaWeb3 = (window as any).solanaWeb3;
      const connection = new solanaWeb3.Connection(rpcUrl);
      
      // Create transaction
      const fromPubkey = provider.publicKey;
      const toPubkey = new solanaWeb3.PublicKey(TREASURY_WALLET);
      const lamports = Math.round(amountSol * 1e9); // Convert SOL to lamports
      
      const transaction = new solanaWeb3.Transaction().add(
        solanaWeb3.SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports,
        })
      );
      
      // Get recent blockhash
      const { blockhash } = await connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = fromPubkey;
      
      // Sign and send transaction
      const signedTx = await provider.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize());
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, 'confirmed');
      
      console.log('Transaction confirmed:', signature);
      
      // Refresh balance after transaction
      await refreshBalance();
      
      return signature;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      if (error.message?.includes('User rejected')) {
        alert('Transaction cancelled');
      } else {
        alert('Transaction failed: ' + (error.message || 'Unknown error'));
      }
      return null;
    }
  };

  const connectWallet = async () => {
    if (mode === 'simulated') {
      console.log('Simulated mode - no wallet needed');
      return;
    }

    setIsConnecting(true);
    try {
      // Check if Phantom is installed
      const provider = (window as any).solana;
      
      if (!provider?.isPhantom) {
        alert('Please install Phantom wallet! Visit phantom.app');
        setIsConnecting(false);
        return;
      }

      // Connect to Phantom
      const response = await provider.connect();
      const publicKey = response.publicKey.toString();
      setWalletAddress(publicKey);

      // Fetch RPC URL from backend (includes Helius API key)
      const rpcResponse = await fetch('/api/solana/rpc-url');
      const { url: rpcUrl } = await rpcResponse.json();
      
      // Fetch balance using Helius RPC
      const connection = new (window as any).solanaWeb3.Connection(rpcUrl);
      const balance = await connection.getBalance(response.publicKey);
      setSolBalance(balance / 1e9); // Convert lamports to SOL

      // Register Solana address with backend (associate with Twitter account if logged in)
      // For now, use the Solana address as userAddress
      try {
        await fetch('/api/solana/connect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userAddress: publicKey, // Using Solana address as userAddress for now
            solanaAddress: publicKey,
          }),
        });
      } catch (err) {
        console.error('Failed to register Solana address:', err);
      }

      console.log('Wallet connected:', publicKey);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      alert('Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setWalletAddress(null);
    setSolBalance(0);
    const provider = (window as any).solana;
    if (provider) {
      provider.disconnect();
    }
  };

  // Auto-disconnect when switching to simulated
  useEffect(() => {
    if (mode === 'simulated' && walletAddress) {
      disconnectWallet();
    }
  }, [mode]);

  // Listen to wallet events
  useEffect(() => {
    if (mode === 'mainnet') {
      const provider = (window as any).solana;
      if (provider) {
        provider.on('connect', () => {
          console.log('Wallet connected event');
        });
        provider.on('disconnect', () => {
          setWalletAddress(null);
          setSolBalance(0);
        });
      }
    }
  }, [mode]);

  return (
    <SolanaContext.Provider
      value={{
        mode,
        setMode,
        walletAddress,
        solBalance,
        connectWallet,
        disconnectWallet,
        isConnecting,
        sendSol,
        refreshBalance,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}

export function useSolana() {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within SolanaProvider');
  }
  return context;
}
