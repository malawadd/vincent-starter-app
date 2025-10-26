import * as Sentry from '@sentry/node';
import consola from 'consola';
import { getConvexClient } from './client';
import { api } from '../../../convex/_generated/api';
import { executeDCASwap } from './executeDCASwap';
import { Id } from '../../../convex/_generated/dataModel';

const workerLogger = consola.withTag('convex-worker');

let workerInterval: NodeJS.Timeout | null = null;

async function processSchedules() {
  const convex = getConvexClient();

  try {
    const dueSchedules = await convex.query(api.schedules.getDueSchedules, {});

    if (dueSchedules.length === 0) {
      return;
    }

    workerLogger.info(`Found ${dueSchedules.length} due schedules to process`);

    for (const schedule of dueSchedules) {
      await Sentry.withIsolationScope(async (scope) => {
        try {
          scope.setContext('schedule', {
            id: schedule._id,
            ethAddress: schedule.ethAddress,
            purchaseAmount: schedule.purchaseAmount,
          });

          await convex.mutation(api.schedules.lockSchedule, { scheduleId: schedule._id });

          await executeDCASwap(
            schedule._id,
            {
              app: {
                id: schedule.appId,
                version: schedule.appVersion,
              },
              pkpInfo: {
                ethAddress: schedule.ethAddress,
                publicKey: schedule.pkpPublicKey,
                tokenId: schedule.pkpTokenId,
              },
              purchaseAmount: schedule.purchaseAmount,
            },
            scope
          );

          await convex.mutation(api.schedules.updateAfterExecution, {
            scheduleId: schedule._id,
            success: true,
          });

          workerLogger.success(`Successfully processed schedule ${schedule._id}`);
        } catch (err) {
          scope.captureException(err);
          const error = err as Error;

          workerLogger.error(`Failed to process schedule ${schedule._id}:`, error.message);

          await convex.mutation(api.schedules.updateAfterExecution, {
            scheduleId: schedule._id,
            success: false,
            error: error.message,
          });
        } finally {
          await Sentry.flush(2000);
        }
      });
    }
  } catch (err) {
    workerLogger.error('Error in worker loop:', err);
    Sentry.captureException(err);
  }
}

export async function startWorker() {
  workerLogger.info('Starting Convex job worker...');

  workerInterval = setInterval(async () => {
    await processSchedules();
  }, 10000);

  process.on('SIGTERM', async () => {
    workerLogger.info('Shutting down worker...');
    if (workerInterval) {
      clearInterval(workerInterval);
    }
    workerLogger.info('Worker shut down successfully');
  });

  workerLogger.info('Convex job worker started');
}
