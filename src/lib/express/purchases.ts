import { Response } from 'express';

import { getPKPInfo } from '@lit-protocol/vincent-app-sdk/jwt';

import { VincentAuthenticatedRequest } from './types';
import { getConvexClient } from '../convex/client';
import { api } from '../../../convex/_generated/api';

export const handleListPurchasesRoute = async (req: VincentAuthenticatedRequest, res: Response) => {
  const { ethAddress } = getPKPInfo(req.user.decodedJWT);
  const convex = getConvexClient();

  const purchases = await convex.query(api.purchases.listByEthAddress, { ethAddress });

  if (purchases.length === 0) {
    res.status(404).json({ error: `No purchases found for wallet address ${ethAddress}` });
    return;
  }

  res.json({ data: purchases, success: true });
};
