import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SolanaContextType {
  mode: 'simulated' | 'mainnet';
  setMode: (mode: 'simulated' | 'mainnet') => void;
  walletAddress: string | null;
  solBalance: number;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
}

const SolanaContext = createContext<SolanaContextType | undefined>(undefined);

export function SolanaProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<'simulated' | 'mainnet'>('simulated');
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

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

      // Fetch balance
      const connection = new (window as any).solanaWeb3.Connection(
        'https://api.mainnet-beta.solana.com'
      );
      const balance = await connection.getBalance(response.publicKey);
      setSolBalance(balance / 1e9); // Convert lamports to SOL

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
