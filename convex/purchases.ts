import { query, mutation } from './_generated/server';
import { v } from 'convex/values';

export const listByEthAddress = query({
  args: { ethAddress: v.string() },
  handler: async (ctx, args) => {
    const purchases = await ctx.db
      .query('purchasedCoins')
      .withIndex('by_ethAddress', (q) => q.eq('ethAddress', args.ethAddress))
      .order('desc')
      .collect();

    return purchases;
  },
});

export const create = mutation({
  args: {
    coinAddress: v.string(),
    ethAddress: v.string(),
    purchaseAmount: v.string(),
    scheduleId: v.id('schedules'),
    symbol: v.string(),
    txHash: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const purchaseId = await ctx.db.insert('purchasedCoins', {
      coinAddress: args.coinAddress,
      ethAddress: args.ethAddress,
      purchaseAmount: args.purchaseAmount,
      scheduleId: args.scheduleId,
      symbol: args.symbol,
      txHash: args.txHash,
    });

    return purchaseId;
  },
});
