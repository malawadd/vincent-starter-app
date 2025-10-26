import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  purchasedCoins: defineTable({
    coinAddress: v.string(),
    ethAddress: v.string(),
    purchaseAmount: v.string(),
    scheduleId: v.id('schedules'),
    symbol: v.string(),
    txHash: v.optional(v.string()),
  })
    .index('by_ethAddress', ['ethAddress'])
    .index('by_scheduleId', ['scheduleId']),

  schedules: defineTable({
    appId: v.number(),
    appVersion: v.string(),
    disabled: v.boolean(),
    ethAddress: v.string(),
    failureCount: v.number(),
    failureReason: v.optional(v.string()),
    lastFailedAt: v.optional(v.number()),
    lastProcessedAt: v.optional(v.number()),
    lastRunAt: v.optional(v.number()),
    lockedAt: v.optional(v.number()),
    name: v.string(),
    nextRunAt: v.number(),
    pkpPublicKey: v.string(),
    pkpTokenId: v.string(),
    purchaseAmount: v.number(),
    purchaseIntervalHuman: v.string(),
    purchaseIntervalMs: v.number(),
    repeatInterval: v.string(),
  })
    .index('by_ethAddress', ['ethAddress'])
    .index('by_nextRunAt', ['nextRunAt'])
    .index('by_nextRunAt_and_disabled', ['nextRunAt', 'disabled']),
});
