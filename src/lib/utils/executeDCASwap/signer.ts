import { ethers } from 'ethers';
import { env } from '../../env';
import { getClient } from '@lit-protocol/vincent-contracts-sdk';

const { ALCHEMY_API_KEY, ALCHEMY_POLICY_ID } = env;

export const alchemyGasSponsor = !!ALCHEMY_API_KEY && !!ALCHEMY_POLICY_ID;
export const alchemyGasSponsorApiKey = ALCHEMY_API_KEY;
export const alchemyGasSponsorPolicyId = ALCHEMY_POLICY_ID;
const { CHRONICLE_YELLOWSTONE_RPC, VINCENT_DELEGATEE_PRIVATE_KEY } = env;

export const readOnlySigner = new ethers.Wallet(
  ethers.Wallet.createRandom().privateKey,
  new ethers.providers.JsonRpcProvider(CHRONICLE_YELLOWSTONE_RPC)
);

export const delegateeSigner = new ethers.Wallet(
  VINCENT_DELEGATEE_PRIVATE_KEY,
  new ethers.providers.StaticJsonRpcProvider(CHRONICLE_YELLOWSTONE_RPC)
);
