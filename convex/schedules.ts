import { query, mutation, internalMutation } from './_generated/server';
import { v } from 'convex/values';
import { Id } from './_generated/dataModel';

export const listByEthAddress = query({
  args: { ethAddress: v.string() },
  handler: async (ctx, args) => {
    const schedules = await ctx.db
      .query('schedules')
      .withIndex('by_ethAddress', (q) => q.eq('ethAddress', args.ethAddress))
      .collect();

    return schedules;
  },
});

export const getById = query({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    return schedule;
  },
});

export const findByEthAddressAndId = query({
  args: {
    ethAddress: v.string(),
    scheduleId: v.id('schedules'),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule || schedule.ethAddress !== args.ethAddress) {
      return null;
    }
    return schedule;
  },
});

export const create = mutation({
  args: {
    appId: v.number(),
    appVersion: v.string(),
    ethAddress: v.string(),
    name: v.string(),
    pkpPublicKey: v.string(),
    pkpTokenId: v.string(),
    purchaseAmount: v.number(),
    purchaseIntervalHuman: v.string(),
    purchaseIntervalMs: v.number(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const scheduleId = await ctx.db.insert('schedules', {
      appId: args.appId,
      appVersion: args.appVersion,
      disabled: false,
      ethAddress: args.ethAddress,
      failureCount: 0,
      lastProcessedAt: undefined,
      lastRunAt: undefined,
      lastFailedAt: undefined,
      lockedAt: undefined,
      name: args.name,
      nextRunAt: now + args.purchaseIntervalMs,
      pkpPublicKey: args.pkpPublicKey,
      pkpTokenId: args.pkpTokenId,
      purchaseAmount: args.purchaseAmount,
      purchaseIntervalHuman: args.purchaseIntervalHuman,
      purchaseIntervalMs: args.purchaseIntervalMs,
      repeatInterval: args.purchaseIntervalHuman,
    });

    return scheduleId;
  },
});

export const update = mutation({
  args: {
    scheduleId: v.id('schedules'),
    appId: v.optional(v.number()),
    appVersion: v.optional(v.string()),
    name: v.optional(v.string()),
    purchaseAmount: v.optional(v.number()),
    purchaseIntervalHuman: v.optional(v.string()),
    purchaseIntervalMs: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { scheduleId, ...updates } = args;
    const schedule = await ctx.db.get(scheduleId);

    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const updateData: any = {};
    if (updates.appId !== undefined) updateData.appId = updates.appId;
    if (updates.appVersion !== undefined) updateData.appVersion = updates.appVersion;
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.purchaseAmount !== undefined) updateData.purchaseAmount = updates.purchaseAmount;
    if (updates.purchaseIntervalHuman !== undefined) {
      updateData.purchaseIntervalHuman = updates.purchaseIntervalHuman;
      updateData.repeatInterval = updates.purchaseIntervalHuman;
    }
    if (updates.purchaseIntervalMs !== undefined) {
      updateData.purchaseIntervalMs = updates.purchaseIntervalMs;
      updateData.nextRunAt = Date.now() + updates.purchaseIntervalMs;
    }

    await ctx.db.patch(scheduleId, updateData);
    return await ctx.db.get(scheduleId);
  },
});

export const disable = mutation({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await ctx.db.patch(args.scheduleId, { disabled: true });
    return await ctx.db.get(args.scheduleId);
  },
});

export const enable = mutation({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    await ctx.db.patch(args.scheduleId, { disabled: false });
    return await ctx.db.get(args.scheduleId);
  },
});

export const remove = mutation({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.scheduleId);
  },
});

export const getDueSchedules = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const schedules = await ctx.db
      .query('schedules')
      .withIndex('by_nextRunAt_and_disabled', (q) =>
        q.eq('nextRunAt', now).eq('disabled', false)
      )
      .collect();

    const allSchedules = await ctx.db
      .query('schedules')
      .filter((q) =>
        q.and(
          q.lte(q.field('nextRunAt'), now),
          q.eq(q.field('disabled'), false),
          q.or(
            q.eq(q.field('lockedAt'), undefined),
            q.lt(q.field('lockedAt'), now - 5 * 60 * 1000)
          )
        )
      )
      .collect();

    return allSchedules;
  },
});

export const lockSchedule = internalMutation({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      lockedAt: Date.now(),
    });
  },
});

export const unlockSchedule = internalMutation({
  args: { scheduleId: v.id('schedules') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.scheduleId, {
      lockedAt: undefined,
    });
  },
});

export const updateAfterExecution = internalMutation({
  args: {
    scheduleId: v.id('schedules'),
    success: v.boolean(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (!schedule) {
      throw new Error('Schedule not found');
    }

    const now = Date.now();
    const updates: any = {
      lastRunAt: now,
      lastProcessedAt: now,
      lockedAt: undefined,
    };

    if (args.success) {
      updates.nextRunAt = now + schedule.purchaseIntervalMs;
      updates.failureCount = 0;
      updates.failureReason = undefined;
      updates.lastFailedAt = undefined;
    } else {
      updates.failureCount = schedule.failureCount + 1;
      updates.failureReason = args.error;
      updates.lastFailedAt = now;

      if (
        args.error?.includes('Not enough balance') ||
        args.error?.includes('insufficient funds') ||
        args.error?.includes('gas too low') ||
        args.error?.includes('out of gas')
      ) {
        updates.disabled = true;
      }
    }

    await ctx.db.patch(args.scheduleId, updates);
  },
});
