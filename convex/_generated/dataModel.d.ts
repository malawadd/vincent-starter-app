import type { GenericId } from 'convex/values';

export type Id<TableName extends string> = GenericId<TableName>;

export interface DataModel {
  purchasedCoins: {
    _id: Id<'purchasedCoins'>;
    _creationTime: number;
    coinAddress: string;
    ethAddress: string;
    purchaseAmount: string;
    scheduleId: Id<'schedules'>;
    symbol: string;
    txHash?: string;
  };
  schedules: {
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
  };
}
