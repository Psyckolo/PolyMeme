import { createConfig, http } from 'wagmi';
import { mainnet, sepolia, base, baseSepolia } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

// Configure chains and connectors for ProphetX
export const config = createConfig({
  chains: [mainnet, sepolia, base, baseSepolia],
  connectors: [
    injected({ 
      target: 'metaMask',
      shimDisconnect: true,
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [base.id]: http(),
    [baseSepolia.id]: http(),
  },
});
