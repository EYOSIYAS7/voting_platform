// Contract address — sourced from env var (set by deploy script)
// Falls back to the address baked into VotingPlatform.json at build time.

import deployedJson from './abi/VotingPlatform.json';

export const CONTRACT_ADDRESS: string =
  process.env.NEXT_PUBLIC_CONTRACT_ADDRESS ||
  (deployedJson as { address?: string }).address ||
  '';

export const BESU_CHAIN_ID = parseInt(
  process.env.NEXT_PUBLIC_BESU_CHAIN_ID || '1337'
);

export const BESU_CHAIN = {
  id: BESU_CHAIN_ID,
  name: process.env.NEXT_PUBLIC_BESU_CHAIN_NAME || 'Besu Network',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http:      [process.env.NEXT_PUBLIC_BESU_RPC_URL || 'http://172.27.3.251/rpc'],
      webSocket: [process.env.NEXT_PUBLIC_BESU_WS_URL  || 'ws://172.27.3.251/ws'],
    },
    public: {
      http:      [process.env.NEXT_PUBLIC_BESU_RPC_URL || 'http://172.27.3.251/rpc'],
      webSocket: [process.env.NEXT_PUBLIC_BESU_WS_URL  || 'ws://172.27.3.251/ws'],
    },
  },
  blockExplorers: {
    default: { name: 'Besu Explorer', url: '' },
  },
} as const;
