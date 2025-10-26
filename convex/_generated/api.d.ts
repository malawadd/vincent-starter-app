import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from 'convex/server';
import type * as purchases from '../purchases';
import type * as schedules from '../schedules';

declare const fullApi: ApiFromModules<{
  purchases: typeof purchases;
  schedules: typeof schedules;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>;
