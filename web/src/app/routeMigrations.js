export const ROUTE_MIGRATIONS = Object.freeze([
  {
    from: "/explore/play/novoban-pushbox",
    to: "/explore/play/novoban",
  },
  {
    from: "/explore/play/loma-pushbox",
    to: "/explore/play/loma",
  },
  {
    from: "/explore/novoban-pushbox",
    to: "/explore/novoban",
  },
  {
    from: "/explore/loma-pushbox",
    to: "/explore/loma",
  },
]);

/** 根据集中迁移表把历史 pathname 解析为当前正式 pathname。 */
export function resolveRouteMigration(pathname) {
  for (const migration of ROUTE_MIGRATIONS) {
    if (!matchesRoutePrefix(pathname, migration.from)) continue;
    return `${migration.to}${pathname.slice(migration.from.length)}`;
  }
  return null;
}

/** 返回当前正式 pathname 对应的历史 route shell 路径。 */
export function legacyRoutePaths(pathname) {
  return ROUTE_MIGRATIONS.flatMap((migration) =>
    matchesRoutePrefix(pathname, migration.to)
      ? [`${migration.from}${pathname.slice(migration.to.length)}`]
      : [],
  );
}

function matchesRoutePrefix(pathname, prefix) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}
