import { startWorker as startConvexWorker } from './convex/jobWorker';

export async function startWorker() {
  return startConvexWorker();
}
