export interface RouteMigration {
  readonly from: string;
  readonly to: string;
}

export const ROUTE_MIGRATIONS: readonly RouteMigration[];

export function resolveRouteMigration(pathname: string): string | null;
export function legacyRoutePaths(pathname: string): string[];
