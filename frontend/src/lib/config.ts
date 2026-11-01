// Contract address — sourced from env var (set by deploy script)
// Falls back to the address baked into VotingPlatform.json at build time.

import deployedJson from './abi/VotingPlatform.json';

export const CONTRACT_ADDRESS: string =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  (deployedJson as { address?: string }).address ||
  '';

export const BESU_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_CHAIN_ID ||
    process.env.NEXT_PUBLIC_SEPOLIA_CHAIN_ID ||
    process.env.NEXT_PUBLIC_BESU_CHAIN_ID ||
    '11155111'
);

const isSepolia = BESU_CHAIN_ID === 11155111;

export const BESU_CHAIN = {
  id: BESU_CHAIN_ID,
  name:
    process.env.NEXT_PUBLIC_CHAIN_NAME ||
    (isSepolia ? 'Ethereum Sepolia' : 'Besu Network'),
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
          process.env.NEXT_PUBLIC_BESU_RPC_URL ||
          'https://rpc.sepolia.org',
      ],
    },
    public: {
      http: [
        process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ||
          process.env.NEXT_PUBLIC_BESU_RPC_URL ||
          'https://rpc.sepolia.org',
      ],
    },
  },
  blockExplorers: {
    default: {
      name: isSepolia ? 'Etherscan Sepolia' : 'Besu Explorer',
      url: isSepolia ? 'https://sepolia.etherscan.io' : '',
    },
  },
} as const;
