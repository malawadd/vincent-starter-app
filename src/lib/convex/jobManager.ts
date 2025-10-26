import consola from 'consola';
import { Id } from '../../../convex/_generated/dataModel';
import { getConvexClient } from './client';
import { api } from '../../../convex/_generated/api';

const logger = consola.withTag('convexJobManager');

export interface JobData {
  appId: number;
  appVersion: string;
  ethAddress: string;
  name: string;
  pkpPublicKey: string;
  pkpTokenId: string;
  purchaseAmount: number;
  purchaseIntervalHuman: string;
}

export interface Schedule {
  _id: Id<'schedules'>;
  _creationTime: number;
  appId: number;
  appVersion: string;
  disabled: boolean;
  ethAddress: string;
  failureCount: number;
  failureReason?: string;
  lastFailedAt?: number;
  lastProcessedAt?: number;
  lastRunAt?: number;
  lockedAt?: number;
  name: string;
  nextRunAt: number;
  pkpPublicKey: string;
  pkpTokenId: string;
  purchaseAmount: number;
  purchaseIntervalHuman: string;
  purchaseIntervalMs: number;
  repeatInterval: string;
}

function parseIntervalToMs(interval: string): number {
  const match = interval.match(/^(\d+)\s*(second|minute|hour|day|week|month)s?$/i);
  if (!match) {
    throw new Error(`Invalid interval format: ${interval}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  const multipliers: Record<string, number> = {
    second: 1000,
    minute: 60 * 1000,
    hour: 60 * 60 * 1000,
    day: 24 * 60 * 60 * 1000,
    week: 7 * 24 * 60 * 60 * 1000,
    month: 30 * 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}

function scheduleToJson(schedule: Schedule) {
  return {
    _id: schedule._id,
    data: {
      app: {
        id: schedule.appId,
        version: schedule.appVersion,
      },
      name: schedule.name,
      pkpInfo: {
        ethAddress: schedule.ethAddress,
        publicKey: schedule.pkpPublicKey,
        tokenId: schedule.pkpTokenId,
      },
      purchaseAmount: schedule.purchaseAmount,
      purchaseIntervalHuman: schedule.purchaseIntervalHuman,
      updatedAt: new Date(schedule._creationTime),
    },
    disabled: schedule.disabled,
    failCount: schedule.failureCount,
    failReason: schedule.failureReason,
    lastFinishedAt: schedule.lastProcessedAt ? new Date(schedule.lastProcessedAt) : undefined,
    lastRunAt: schedule.lastRunAt ? new Date(schedule.lastRunAt) : undefined,
    lockedAt: schedule.lockedAt ? new Date(schedule.lockedAt) : undefined,
    name: schedule.name,
    nextRunAt: new Date(schedule.nextRunAt),
    repeatInterval: schedule.repeatInterval,
  };
}

export async function listJobsByEthAddress({ ethAddress }: { ethAddress: string }) {
  const convex = getConvexClient();
  logger.log('listing jobs', { ethAddress });

  const schedules = await convex.query(api.schedules.listByEthAddress, { ethAddress });

  return schedules.map((schedule: Schedule) => ({
    attrs: {
      _id: schedule._id,
      data: {
        app: {
          id: schedule.appId,
          version: schedule.appVersion,
        },
        name: schedule.name,
        pkpInfo: {
          ethAddress: schedule.ethAddress,
          publicKey: schedule.pkpPublicKey,
          tokenId: schedule.pkpTokenId,
        },
        purchaseAmount: schedule.purchaseAmount,
        purchaseIntervalHuman: schedule.purchaseIntervalHuman,
        updatedAt: new Date(schedule._creationTime),
      },
      disabled: schedule.disabled,
      failCount: schedule.failureCount,
      failReason: schedule.failureReason,
      lastFinishedAt: schedule.lastProcessedAt ? new Date(schedule.lastProcessedAt) : undefined,
      lastRunAt: schedule.lastRunAt ? new Date(schedule.lastRunAt) : undefined,
      lockedAt: schedule.lockedAt ? new Date(schedule.lockedAt) : undefined,
      name: schedule.name,
      nextRunAt: new Date(schedule.nextRunAt),
      repeatInterval: schedule.repeatInterval,
    },
    toJson: () => scheduleToJson(schedule),
  }));
}

export async function findJob({
  ethAddress,
  mustExist,
  scheduleId,
}: {
  ethAddress: string;
  mustExist?: boolean;
  scheduleId: string;
}) {
  const convex = getConvexClient();

  const schedule = await convex.query(api.schedules.findByEthAddressAndId, {
    ethAddress,
    scheduleId: scheduleId as Id<'schedules'>,
  });

  logger.log(`Found ${schedule ? 1 : 0} jobs with ID ${scheduleId}`);
  if (mustExist && !schedule) {
    throw new Error(`No DCA schedule found with ID ${scheduleId}`);
  }

  if (!schedule) return undefined;

  return {
    attrs: {
      _id: schedule._id,
      data: {
        app: {
          id: schedule.appId,
          version: schedule.appVersion,
        },
        name: schedule.name,
        pkpInfo: {
          ethAddress: schedule.ethAddress,
          publicKey: schedule.pkpPublicKey,
          tokenId: schedule.pkpTokenId,
        },
        purchaseAmount: schedule.purchaseAmount,
        purchaseIntervalHuman: schedule.purchaseIntervalHuman,
        updatedAt: new Date(schedule._creationTime),
      },
      disabled: schedule.disabled,
      failCount: schedule.failureCount,
      failReason: schedule.failureReason,
      lastFinishedAt: schedule.lastProcessedAt ? new Date(schedule.lastProcessedAt) : undefined,
      lastRunAt: schedule.lastRunAt ? new Date(schedule.lastRunAt) : undefined,
      lockedAt: schedule.lockedAt ? new Date(schedule.lockedAt) : undefined,
      name: schedule.name,
      nextRunAt: new Date(schedule.nextRunAt),
      repeatInterval: schedule.repeatInterval,
    },
    toJson: () => scheduleToJson(schedule),
  };
}

export async function editJob({
  data,
  scheduleId,
}: {
  data: JobData;
  scheduleId: string;
}) {
  const convex = getConvexClient();
  const { ethAddress } = data;
  const job = await findJob({ ethAddress, scheduleId, mustExist: true });

  if (!job) {
    throw new Error(`Job not found: ${scheduleId}`);
  }

  const { purchaseIntervalHuman } = data;

  if (purchaseIntervalHuman !== job.attrs.data.purchaseIntervalHuman) {
    logger.log(
      `Changing DCA interval from ${job.attrs.data.purchaseIntervalHuman} to ${purchaseIntervalHuman}`
    );
  }

  const purchaseIntervalMs = parseIntervalToMs(purchaseIntervalHuman);

  await convex.mutation(api.schedules.update, {
    scheduleId: scheduleId as Id<'schedules'>,
    appId: data.appId,
    appVersion: data.appVersion,
    name: data.name,
    purchaseAmount: data.purchaseAmount,
    purchaseIntervalHuman,
    purchaseIntervalMs,
  });

  return findJob({ ethAddress, scheduleId, mustExist: true });
}

export async function disableJob({
  ethAddress,
  scheduleId,
}: {
  ethAddress: string;
  scheduleId: string;
}) {
  const convex = getConvexClient();
  const job = await findJob({ ethAddress, scheduleId, mustExist: false });

  if (!job) return null;

  logger.log(`Disabling DCA job ${scheduleId}`);
  await convex.mutation(api.schedules.disable, { scheduleId: scheduleId as Id<'schedules'> });

  return findJob({ ethAddress, scheduleId, mustExist: true });
}

export async function enableJob({
  ethAddress,
  scheduleId,
}: {
  ethAddress: string;
  scheduleId: string;
}) {
  const convex = getConvexClient();
  await findJob({ ethAddress, scheduleId, mustExist: true });

  logger.log(`Enabling DCA job ${scheduleId}`);
  await convex.mutation(api.schedules.enable, { scheduleId: scheduleId as Id<'schedules'> });

  return findJob({ ethAddress, scheduleId, mustExist: true });
}

export async function cancelJob({
  ethAddress,
  scheduleId,
}: {
  ethAddress: string;
  scheduleId: string;
}) {
  const convex = getConvexClient();
  logger.log(`Cancelling (deleting) DCA job ${scheduleId}`);

  await findJob({ ethAddress, scheduleId, mustExist: true });
  await convex.mutation(api.schedules.remove, { scheduleId: scheduleId as Id<'schedules'> });
}

export async function createJob(
  data: JobData,
  options: {
    interval?: string;
  } = {}
) {
  const convex = getConvexClient();

  const interval = options.interval || data.purchaseIntervalHuman;
  const purchaseIntervalMs = parseIntervalToMs(interval);

  const scheduleId = await convex.mutation(api.schedules.create, {
    appId: data.appId,
    appVersion: data.appVersion,
    ethAddress: data.ethAddress,
    name: data.name,
    pkpPublicKey: data.pkpPublicKey,
    pkpTokenId: data.pkpTokenId,
    purchaseAmount: data.purchaseAmount,
    purchaseIntervalHuman: interval,
    purchaseIntervalMs,
  });

  logger.log(`Created DCA job ${scheduleId}`);

  return findJob({ ethAddress: data.ethAddress, scheduleId, mustExist: true });
}
