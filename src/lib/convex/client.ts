import { ConvexHttpClient } from 'convex/browser';

import { env } from '../env';

const { CONVEX_URL } = env;

let convexClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    convexClient = new ConvexHttpClient(CONVEX_URL);
  }
  return convexClient;
}
