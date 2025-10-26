import * as Sentry from '@sentry/node';
import consola from 'consola';
import { ethers } from 'ethers';
import { Id } from '../../../convex/_generated/dataModel';

import { IRelayPKP } from '@lit-protocol/types';

import { type AppData, assertPermittedVersion } from '../utils/jobVersion';
import {
  alchemyGasSponsor,
  alchemyGasSponsorApiKey,
  alchemyGasSponsorPolicyId,
  balanceOf,
  getERC20Contract,
  getUserPermittedVersion,
  handleOperationExecution,
} from '../utils/executeDCASwap/utils';
import {
  getErc20ApprovalToolClient,
  getSignedUniswapQuote,
  getUniswapToolClient,
} from '../utils/executeDCASwap/vincentAbilities';
import { env } from '../env';
import { normalizeError } from '../error';
import { getConvexClient } from './client';
import { api } from '../../../convex/_generated/api';

export type JobParams = {
  app: AppData;
  name: string;
  pkpInfo: IRelayPKP;
  purchaseAmount: number;
  purchaseIntervalHuman: string;
  updatedAt: Date;
};

const { BASE_RPC_URL, VINCENT_APP_ID } = env;

const BASE_CHAIN_ID = 8453;
const BASE_USDC_ADDRESS = '0x833589fcd6edb6e08f4c7c32d4f71b54bda02913';
const BASE_WBTC_ADDRESS = '0x0555E30da8f98308EdB960aa94C0Db47230d2B9c';
const BASE_UNISWAP_V3_ROUTER = '0x2626664c2603336E57B271c5C0b26F421741e481';

const baseProvider = new ethers.providers.StaticJsonRpcProvider(BASE_RPC_URL);
const usdcContract = getERC20Contract(BASE_USDC_ADDRESS, baseProvider);

async function addUsdcApproval({
  ethAddress,
  usdcAmount,
}: {
  ethAddress: `0x${string}`;
  usdcAmount: ethers.BigNumber;
}): Promise<`0x${string}` | undefined> {
  const erc20ApprovalToolClient = getErc20ApprovalToolClient();
  const approvalParams = {
    alchemyGasSponsor,
    alchemyGasSponsorApiKey,
    alchemyGasSponsorPolicyId,
    chainId: BASE_CHAIN_ID,
    rpcUrl: BASE_RPC_URL,
    spenderAddress: BASE_UNISWAP_V3_ROUTER,
    tokenAddress: BASE_USDC_ADDRESS,
    tokenAmount: usdcAmount.mul(5).toString(),
  };
  const approvalContext = {
    delegatorPkpEthAddress: ethAddress,
  };

  const approvalPrecheckResult = await erc20ApprovalToolClient.precheck(
    approvalParams,
    approvalContext
  );
  if (!approvalPrecheckResult.success) {
    throw new Error(`ERC20 approval tool precheck failed: ${approvalPrecheckResult}`);
  } else if (approvalPrecheckResult.result.alreadyApproved) {
    return undefined;
  }

  const approvalExecutionResult = await erc20ApprovalToolClient.execute(
    approvalParams,
    approvalContext
  );
  consola.trace('ERC20 Approval Vincent Tool Response:', approvalExecutionResult);
  if (!approvalExecutionResult.success) {
    throw new Error(`ERC20 approval tool execution failed: ${approvalExecutionResult}`);
  }

  return approvalExecutionResult.result.approvalTxHash as `0x${string}`;
}

async function handleSwapExecution({
  delegatorAddress,
  tokenInAddress,
  tokenInAmount,
  tokenInDecimals,
  tokenOutAddress,
}: {
  delegatorAddress: `0x${string}`;
  tokenInAddress: `0x${string}`;
  tokenInAmount: ethers.BigNumber;
  tokenInDecimals: number;
  tokenOutAddress: `0x${string}`;
}): Promise<`0x${string}`> {
  const signedUniswapQuote = await getSignedUniswapQuote({
    tokenInAddress,
    tokenOutAddress,
    recipient: delegatorAddress,
    rpcUrl: BASE_RPC_URL,
    tokenInAmount: ethers.utils.formatUnits(tokenInAmount, tokenInDecimals),
  });

  const uniswapToolClient = getUniswapToolClient();
  const swapParams = {
    signedUniswapQuote,
    rpcUrlForUniswap: BASE_RPC_URL,
  };
  const swapContext = {
    delegatorPkpEthAddress: delegatorAddress,
  };

  const swapPrecheckResult = await uniswapToolClient.precheck(swapParams, swapContext);
  if (!swapPrecheckResult.success) {
    throw new Error(`Uniswap tool precheck failed: ${swapPrecheckResult}`);
  }

  const swapExecutionResult = await uniswapToolClient.execute(swapParams, swapContext);
  consola.trace('Uniswap Swap Vincent Tool Response:', swapExecutionResult);
  if (!swapExecutionResult.success) {
    throw new Error(`Uniswap tool execution failed: ${swapExecutionResult}`);
  }

  return swapExecutionResult.result.swapTxHash as `0x${string}`;
}

export async function executeDCASwap(
  scheduleId: Id<'schedules'>,
  jobData: {
    app: AppData;
    pkpInfo: IRelayPKP;
    purchaseAmount: number;
  },
  sentryScope: Sentry.Scope
): Promise<void> {
  const convex = getConvexClient();

  try {
    const {
      app,
      pkpInfo: { ethAddress, publicKey },
      purchaseAmount,
    } = jobData;

    consola.log('Starting DCA swap job...', {
      scheduleId,
      ethAddress,
      purchaseAmount,
    });

    consola.debug('Fetching user USDC balance...');
    const [usdcBalance, userPermittedAppVersion] = await Promise.all([
      balanceOf(usdcContract, ethAddress),
      getUserPermittedVersion({ ethAddress, appId: VINCENT_APP_ID }),
    ]);

    sentryScope.addBreadcrumb({
      data: {
        usdcBalance,
      },
      message: 'User USDC balance',
    });

    const _purchaseAmount = ethers.utils.parseUnits(purchaseAmount.toFixed(6), 6);
    if (usdcBalance.lt(_purchaseAmount)) {
      throw new Error(
        `Not enough balance for account ${ethAddress} - please fund this account with USDC to DCA`
      );
    }
    if (!userPermittedAppVersion) {
      throw new Error(
        `User ${ethAddress} revoked permission to run this app. Used version to generate: ${app.version}`
      );
    }

    const appVersionToRun = assertPermittedVersion(app.version, userPermittedAppVersion);
    sentryScope.addBreadcrumb({
      data: {
        app,
        appVersionToRun,
        userPermittedAppVersion,
      },
    });

    if (appVersionToRun !== app.version) {
      await convex.mutation(api.schedules.update, {
        scheduleId,
        appVersion: appVersionToRun,
      });
    }

    consola.log('Job details', {
      ethAddress,
      purchaseAmount,
      userPermittedAppVersion,
      usdcBalance: ethers.utils.formatUnits(usdcBalance, 6),
    });

    const approvalHash = await addUsdcApproval({
      ethAddress: ethAddress as `0x${string}`,
      usdcAmount: _purchaseAmount,
    });
    sentryScope.addBreadcrumb({
      data: {
        approvalHash,
      },
    });

    if (approvalHash) {
      await handleOperationExecution({
        isSponsored: alchemyGasSponsor,
        operationHash: approvalHash,
        pkpPublicKey: publicKey,
        provider: baseProvider,
      });
    }

    const swapHash = await handleSwapExecution({
      delegatorAddress: ethAddress as `0x${string}`,
      tokenInAddress: BASE_USDC_ADDRESS,
      tokenInAmount: _purchaseAmount,
      tokenInDecimals: 6,
      tokenOutAddress: BASE_WBTC_ADDRESS,
    });
    sentryScope.addBreadcrumb({
      data: {
        swapHash,
      },
    });

    await convex.mutation(api.purchases.create, {
      ethAddress,
      coinAddress: BASE_WBTC_ADDRESS,
      purchaseAmount: purchaseAmount.toFixed(2),
      scheduleId,
      symbol: 'wBTC',
      txHash: swapHash,
    });

    consola.debug(`Successfully purchased ${purchaseAmount} USDC of wBTC at tx hash ${swapHash}`);
  } catch (e) {
    const err = normalizeError(e);
    sentryScope.captureException(err);
    consola.error(err.message, err.stack);
    throw e;
  }
}
