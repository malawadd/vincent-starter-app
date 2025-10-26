import { getVincentAbilityClient } from '@lit-protocol/vincent-scaffold-sdk';
import { env } from '../../env';

const { VINCENT_DELEGATEE_PRIVATE_KEY, CHRONICLE_YELLOWSTONE_RPC } = env;

export function getErc20ApprovalToolClient() {
  return getVincentAbilityClient({
    abilityName: 'erc20-approval',
    delegateePrivateKey: VINCENT_DELEGATEE_PRIVATE_KEY,
    litNodeRpc: CHRONICLE_YELLOWSTONE_RPC,
  });
}

export function getUniswapToolClient() {
  return getVincentAbilityClient({
    abilityName: 'uniswap-swap',
    delegateePrivateKey: VINCENT_DELEGATEE_PRIVATE_KEY,
    litNodeRpc: CHRONICLE_YELLOWSTONE_RPC,
  });
}

export async function getSignedUniswapQuote(params: {
  tokenInAddress: string;
  tokenOutAddress: string;
  recipient: string;
  rpcUrl: string;
  tokenInAmount: string;
}) {
  const response = await fetch('https://api.uniswap.org/v2/quote', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      tokenInAddress: params.tokenInAddress,
      tokenOutAddress: params.tokenOutAddress,
      recipient: params.recipient,
      tokenInAmount: params.tokenInAmount,
      type: 'EXACT_INPUT',
      protocols: ['V3'],
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Uniswap quote: ${response.statusText}`);
  }

  return await response.json();
}
