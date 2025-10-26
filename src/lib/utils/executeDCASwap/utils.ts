import { ethers } from 'ethers';
import { env } from '../../env';
import { getVincentContractSdk } from '@lit-protocol/vincent-contracts-sdk';

const { ALCHEMY_API_KEY, ALCHEMY_POLICY_ID } = env;

export const alchemyGasSponsor = !!ALCHEMY_API_KEY && !!ALCHEMY_POLICY_ID;
export const alchemyGasSponsorApiKey = ALCHEMY_API_KEY;
export const alchemyGasSponsorPolicyId = ALCHEMY_POLICY_ID;

export function getERC20Contract(
  tokenAddress: string,
  provider: ethers.providers.Provider
): ethers.Contract {
  const erc20Abi = [
    'function balanceOf(address owner) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function symbol() view returns (string)',
    'function transfer(address to, uint amount) returns (bool)',
    'function allowance(address owner, address spender) view returns (uint256)',
    'function approve(address spender, uint256 amount) returns (bool)',
  ];

  return new ethers.Contract(tokenAddress, erc20Abi, provider);
}

export async function balanceOf(
  contract: ethers.Contract,
  address: string
): Promise<ethers.BigNumber> {
  return await contract.balanceOf(address);
}

export async function getUserPermittedVersion(params: {
  ethAddress: string;
  appId: number;
}): Promise<string | null> {
  try {
    const sdk = getVincentContractSdk();
    const result = await sdk.getPermittedAppVersion({
      pkpEthAddress: params.ethAddress,
      appId: params.appId,
    });
    return result || null;
  } catch (error) {
    return null;
  }
}

export async function handleOperationExecution(params: {
  isSponsored: boolean;
  operationHash: string;
  pkpPublicKey: string;
  provider: ethers.providers.Provider;
}): Promise<void> {
  const receipt = await params.provider.waitForTransaction(params.operationHash);

  if (receipt.status !== 1) {
    throw new Error(`Transaction failed: ${params.operationHash}`);
  }
}
